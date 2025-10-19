package com.kyc.controller;

import com.kyc.util.EncryptionUtil;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
// import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.WriteConcern;
import com.mongodb.client.*;
import org.bson.Document;
import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadDetails {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/saveDetails")
    public ResponseEntity<?> uploadCustDetails(@RequestBody List<Map<String, Object>> userDetails) {
        try (var mongoClient = MongoClients.create(mongoUriString)) {
            ClientSession session = mongoClient.startSession();

            return session.withTransaction(() -> {
                MongoDatabase db = mongoClient.getDatabase("kyc_db").withWriteConcern(WriteConcern.MAJORITY);

                MongoCollection<Document> documentCollection = db.getCollection("document");
                MongoCollection<Document> aadharCollection = db.getCollection("aadhaar");
                MongoCollection<Document> panCollection = db.getCollection("pan");
                MongoCollection<Document> creditCardCollection = db.getCollection("creditcard");
                MongoCollection<Document> chequeCollection = db.getCollection("cheque");
                MongoCollection<Document> drivingLicenseCollection = db.getCollection("drivinglicense");
                MongoCollection<Document> passportCollection = db.getCollection("passport");

                String custId = new ObjectId().toString();
                String name = null;
                List<String> documentTypes = new ArrayList<>();
                Map<String, Object> encryptedEntitiesGlobal = new HashMap<>();

                for (Map<String, Object> doc : userDetails) {
                    String docType = (String) doc.get("document_type");
                    if (docType == null || docType.isEmpty()) {
                        throw new RuntimeException("Missing or empty document_type");
                    }

                    documentTypes.add(docType);

                    Map<String, Object> namedEntities = (Map<String, Object>) doc.get("named_entities");
                    if (namedEntities == null) {
                        throw new RuntimeException("Missing named_entities for document type: " + docType);
                    }

                    if (name == null && namedEntities.containsKey("Name")) {
                        name = namedEntities.get("Name").toString();
                    }

                    // encryption
                    Map<String, Object> encryptedEntities = new HashMap<>();
                    for (Map.Entry<String, Object> entry : namedEntities.entrySet()) {
                        try {
                            Map<String, String> encResult = EncryptionUtil.encryptWithIV(entry.getValue().toString());
                            encryptedEntities.put(entry.getKey(), encResult);
                            encryptedEntitiesGlobal.put(entry.getKey(), encResult);
                        } catch (Exception e) {
                            throw new RuntimeException("Failed to encrypt field: " + entry.getKey(), e);
                        }
                    }

                    Document insertDoc = new Document("cust_id", custId)
                            .append("name", name);

                    if (name != null) {
                        insertDoc.append("name", name);
                    }

                    switch (docType) {
                        case "Aadhaar Card":
                            aadharCollection.insertOne(session, insertDoc);
                            break;
                        case "PAN Card":
                            panCollection.insertOne(session, insertDoc);
                            break;
                        case "Credit Card":
                            creditCardCollection.insertOne(session, insertDoc);
                            break;
                        case "Cheque":
                            chequeCollection.insertOne(session, insertDoc);
                            break;
                        case "Driving License":
                            drivingLicenseCollection.insertOne(session, insertDoc);
                            break;
                        case "Passport":
                            passportCollection.insertOne(session, insertDoc);
                            break;
                        default:
                            throw new RuntimeException("Unknown document type: " + docType);
                    }
                }

                Document documentToInsert = new Document("cust_id", custId)
                        .append("name", name)
                        .append("document_type", documentTypes)
                        .append("entities", encryptedEntitiesGlobal);

                documentCollection.insertOne(session, documentToInsert);

                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "customer_id", custId,
                        "name", name,
                        "document_types", documentTypes,
                        "encrypted_entities", encryptedEntitiesGlobal
                ));
            });

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }
}
