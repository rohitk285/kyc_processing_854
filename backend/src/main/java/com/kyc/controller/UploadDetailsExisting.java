package com.kyc.controller;

import com.kyc.util.EncryptionUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.beans.factory.annotation.Value;

import com.mongodb.WriteConcern;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import java.util.*;

// check and remove named_entities variable if not needed

@RestController
@RequestMapping("/api")
public class UploadDetailsExisting {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/saveDetailsExisting")
    public ResponseEntity<?> uploadCustDetails(@RequestBody List<Map<String, Object>> userDetails) {
        try (var mongoClient = MongoClients.create(mongoUriString)) {
            // client session for transaction - atomicity
            var session = mongoClient.startSession();

            // using this syntax to implement atomicity using transaction in springboot
            // mongodb
            return session.withTransaction(() -> {
                // this ensures durability since ACK is given after writing to majority nodes
                MongoDatabase db = mongoClient.getDatabase("kyc_db").withWriteConcern(WriteConcern.MAJORITY);

                MongoCollection<Document> documentCollection = db.getCollection("document");
                MongoCollection<Document> aadharCollection = db.getCollection("aadhaar");
                MongoCollection<Document> panCollection = db.getCollection("pan");
                MongoCollection<Document> creditCardCollection = db.getCollection("creditcard");
                MongoCollection<Document> chequeCollection = db.getCollection("cheque");
                MongoCollection<Document> drivingLicenseCollection = db.getCollection("drivinglicense");
                MongoCollection<Document> passportCollection = db.getCollection("passport");

                String custId = (String) userDetails.get(0).get("cust_id");
                if (custId == null || custId.isEmpty()) {
                    throw new RuntimeException("cust_id is required");
                }

                Document query = new Document("cust_id", custId);
                Document existingDoc = documentCollection.find(session, query).first();
                if (existingDoc == null) {
                    throw new RuntimeException("Customer not found");
                }

                Map<String, Object> existingEntities = (Map<String, Object>) existingDoc.get("entities");
                if (existingEntities == null)
                    existingEntities = new HashMap<>();
                else{
                    Map<String, Object> decryptedEntities = new HashMap<>();
                    for(Map.Entry<String, Object> entry: existingEntities.entrySet()){
                        String key = entry.getKey();
                        Object valueObj = entry.getValue();  // contains {iv, cipherText}
                        Map<String, String> encryptedMap = (Map<String, String>) valueObj;  // vulnerability 
                        try {
                            String decryptedValue = EncryptionUtil.decryptWithIV(encryptedMap);
                            decryptedEntities.put(key, decryptedValue);
                        }
                        catch (Exception e) {
                            throw new RuntimeException("Failed to decrypt field: " + key, e);
                        }
                    }
                    existingEntities = decryptedEntities;
                }

                List<String> existingDocumentTypes = (List<String>) existingDoc.get("document_type");
                if (existingDocumentTypes == null)
                    existingDocumentTypes = new ArrayList<>();

                String name = existingDoc.getString("name");

                for (Map<String, Object> doc : userDetails) {
                    String docType = (String) doc.get("document_type");
                    if (docType == null || docType.isEmpty())
                        continue;

                    Map<String, Object> newEntities = (Map<String, Object>) doc.get("named_entities");
                    if (newEntities == null)
                        continue;

                    for (Map.Entry<String, Object> entry : newEntities.entrySet()) {
                        String key = entry.getKey();
                        // overwriting existing values with incoming values
                        existingEntities.put(key, entry.getValue());
                    }

                    if (name == null && newEntities.containsKey("Name")) {
                        name = newEntities.get("Name").toString();
                    }

                    if (!existingDocumentTypes.contains(docType)) {
                        existingDocumentTypes.add(docType);
                    }

                    Document docQuery = new Document("cust_id", custId);
                    Document updateDoc = new Document();
                    if (name != null)
                        updateDoc.append("name", name);

                    switch (docType) {
                        case "Aadhaar Card":
                            aadharCollection.updateOne(session, docQuery, new Document("$set", updateDoc),
                                    new com.mongodb.client.model.UpdateOptions().upsert(true));
                            break;
                        case "PAN Card":
                            panCollection.updateOne(session, docQuery, new Document("$set", updateDoc),
                                    new com.mongodb.client.model.UpdateOptions().upsert(true));
                            break;
                        case "Credit Card":
                            creditCardCollection.updateOne(session, docQuery, new Document("$set", updateDoc),
                                    new com.mongodb.client.model.UpdateOptions().upsert(true));
                            break;
                        case "Cheque":
                            chequeCollection.updateOne(session, docQuery, new Document("$set", updateDoc),
                                    new com.mongodb.client.model.UpdateOptions().upsert(true));
                            break;
                        case "Driving License":
                            drivingLicenseCollection.updateOne(session, docQuery, new Document("$set", updateDoc),
                                    new com.mongodb.client.model.UpdateOptions().upsert(true));
                            break;
                        case "Passport":
                            passportCollection.updateOne(session, docQuery, new Document("$set", updateDoc),
                                    new com.mongodb.client.model.UpdateOptions().upsert(true));
                            break;
                        default:
                            throw new RuntimeException("Unknown document type: " + docType);
                    }
                }

                Document encryptedEntities = new Document();
                for (Map.Entry<String, Object> entry : existingEntities.entrySet()) {
                    try {
                        Map<String, String> result = EncryptionUtil.encryptWithIV(entry.getValue().toString());
                        encryptedEntities.append(entry.getKey(), result);
                    }
                    catch (Exception e) {
                        throw new RuntimeException("Failed to encrypt field: " + entry.getKey(), e);
                    }
                }

                Document updatedEntityFields = new Document("name", name)
                        .append("entities", encryptedEntities)
                        .append("document_type", existingDocumentTypes);
                

                documentCollection.updateOne(session, new Document("cust_id", custId),
                        new Document("$set", updatedEntityFields));

                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "cust_id", custId,
                        "name", name,
                        "document_types", existingDocumentTypes,
                        "merged_entities", encryptedEntities));
            });

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
