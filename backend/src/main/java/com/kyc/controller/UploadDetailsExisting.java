package com.kyc.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.beans.factory.annotation.Value;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadDetailsExisting {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/saveDetailsExisting")
    public ResponseEntity<?> uploadCustDetails(@RequestBody List<Map<String, Object>> userDetails) {
        try (var mongoClient = MongoClients.create(mongoUriString)) {
            MongoDatabase db = mongoClient.getDatabase("kyc_db");
            MongoCollection<Document> documentCollection = db.getCollection("document");
            MongoCollection<Document> aadharCollection = db.getCollection("aadhaar");
            MongoCollection<Document> panCollection = db.getCollection("pan");
            MongoCollection<Document> creditCardCollection = db.getCollection("creditcard");
            MongoCollection<Document> chequeCollection = db.getCollection("cheque");
            MongoCollection<Document> drivingLicenseCollection = db.getCollection("drivinglicense");
            MongoCollection<Document> passportCollection = db.getCollection("passport");

            String custId = (String) userDetails.get(0).get("cust_id");
            if (custId == null || custId.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "cust_id is required"));
            }

            Document query = new Document("cust_id", custId);
            Document existingDoc = documentCollection.find(query).first();
            if (existingDoc == null) {
                return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Customer not found"));
            }

            Map<String, Object> existingEntities = (Map<String, Object>) existingDoc.get("entities");
            if (existingEntities == null)
                existingEntities = new HashMap<>();

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
                    existingEntities.put(key, entry.getValue());
                }

                // for safety - mostly won't be executed
                if (name == null && newEntities.containsKey("Name")) {
                    name = newEntities.get("Name").toString();
                }

                // avoiding duplicate docTypes
                if (!existingDocumentTypes.contains(docType))
                    existingDocumentTypes.add(docType);

                Document docQuery = new Document("cust_id", custId);
                Document updateDoc = new Document();
                if (name != null)
                    updateDoc.append("name", name);

                switch (docType) {
                    case "Aadhaar Card":
                        aadharCollection.updateOne(docQuery, new Document("$set", updateDoc),
                                new com.mongodb.client.model.UpdateOptions().upsert(true));
                        break;
                    case "PAN Card":
                        panCollection.updateOne(docQuery, new Document("$set", updateDoc),
                                new com.mongodb.client.model.UpdateOptions().upsert(true));
                        break;
                    case "Credit Card":
                        creditCardCollection.updateOne(docQuery, new Document("$set", updateDoc),
                                new com.mongodb.client.model.UpdateOptions().upsert(true));
                        break;
                    case "Cheque":
                        chequeCollection.updateOne(docQuery, new Document("$set", updateDoc),
                                new com.mongodb.client.model.UpdateOptions().upsert(true));
                        break;
                    case "Driving License":
                        drivingLicenseCollection.updateOne(docQuery, new Document("$set", updateDoc),
                                new com.mongodb.client.model.UpdateOptions().upsert(true));
                        break;
                    case "Passport":
                        passportCollection.updateOne(docQuery, new Document("$set", updateDoc),
                                new com.mongodb.client.model.UpdateOptions().upsert(true));
                        break;
                    default:
                        return ResponseEntity.badRequest()
                                .body(Map.of("status", "error", "message", "Unknown document type: " + docType));
                }
            }

            Document updatedEntityFields = new Document("name", name).append("entities", existingEntities)
                    .append("document_type", existingDocumentTypes);

            documentCollection.updateOne(new Document("cust_id", custId), new Document("$set", updatedEntityFields));

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "cust_id", custId,
                    "name", name,
                    "document_types", existingDocumentTypes,
                    "merged_entities", existingEntities));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
