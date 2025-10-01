package com.kyc.controller;

import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.beans.factory.annotation.Value;

import com.mongodb.WriteConcern;
import com.mongodb.client.*;
// import com.mongodb.client.model.UpdateOptions;
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
            // starting client session for transaction support - atomicity
            ClientSession session = mongoClient.startSession();

            // implementation of transaction to ensure atomicity
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

                String custId = new ObjectId().toString();
                String name = null;
                List<String> documentTypes = new ArrayList<>();
                Map<String, Object> entities = new HashMap<>();

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

                    entities.putAll(namedEntities);

                    Document insertDoc = new Document("cust_id", custId);
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
                        .append("entities", entities);

                documentCollection.insertOne(session, documentToInsert);

                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "customer_id", custId,
                        "name", name,
                        "document_types", documentTypes,
                        "named_entities", entities));
            });

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()));
        }
    }
}
