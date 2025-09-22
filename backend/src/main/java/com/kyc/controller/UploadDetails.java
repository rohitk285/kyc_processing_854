package com.kyc.controller;

import org.bson.types.ObjectId;
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
public class UploadDetails {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("/saveDetails")
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

            String custId = new ObjectId().toString();
            String name = null;
            List<String> documentTypes = new ArrayList<>();
            Map<String, Object> entities = new HashMap<>();

            for (Map<String, Object> doc : userDetails) {
                String docType = (String) doc.get("document_type");
                documentTypes.add(docType);
                Map<String, Object> namedEntities = (Map<String, Object>) doc.get("named_entities");
                if(name == null && namedEntities.containsKey("Name")) {
                    name = namedEntities.get("Name").toString();
                }
                entities.putAll(namedEntities);

                switch (docType) {
                    case "Aadhaar Card":
                        Document aadhaarDoc = new Document("cust_id", custId).append("name", name);
                        aadharCollection.insertOne(aadhaarDoc);
                        break;
                    case "PAN Card":
                        Document panDoc = new Document("cust_id", custId).append("name", name);
                        panCollection.insertOne(panDoc);
                        break;
                    case "Credit Card":
                        Document creditCardDoc = new Document("cust_id", custId).append("name", name);
                        creditCardCollection.insertOne(creditCardDoc);
                        break;
                    case "Cheque":
                        Document chequeDoc = new Document("cust_id", custId).append("name", name);
                        chequeCollection.insertOne(chequeDoc);
                        break;
                    case "Driving License":
                        Document drivingLicenseDoc = new Document("cust_id", custId).append("name", name);
                        drivingLicenseCollection.insertOne(drivingLicenseDoc);
                        break;
                    case "Passport":
                        Document passportDoc = new Document("cust_id", custId).append("name", name);
                        passportCollection.insertOne(passportDoc);
                        break;
                    default:
                        return ResponseEntity.badRequest()
                                .body(Map.of("status", "error", "message", "Unknown document type: " + docType));
                }
            }

            Document documentToInsert = new Document("cust_id", custId)
                    .append("name", name)
                    .append("document_type", documentTypes)
                    .append("entities", entities);

            documentCollection.insertOne(documentToInsert);

            return ResponseEntity.ok(Map.of("status", "success", "customer_id", custId, "name", name,
                    "document_types", documentTypes, "named_entities", entities));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
