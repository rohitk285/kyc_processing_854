package com.kyc.controller;

import org.bson.Document;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.springframework.beans.factory.annotation.Value;

import java.util.*;

@RestController
@RequestMapping("/api")
public class FetchLinksByCustID {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @PostMapping("customerDetailsLinks")
    public ResponseEntity<?> getCustomerLinksById(
            @RequestBody Map<String, Object> reqBody) {
        try {
            String custId = (String) reqBody.get("cust_id");
            List<String> docType = (List<String>) reqBody.get("document_type");

            if (custId == null || docType == null || docType.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("cust_id and document_type are required in the request body");
            }

            try (var mongoClient = MongoClients.create(mongoUriString)) {
                MongoDatabase database = mongoClient.getDatabase("kyc_db");
                MongoCollection<Document> aadhaar = database.getCollection("aadhaar");
                MongoCollection<Document> pan = database.getCollection("pan");
                MongoCollection<Document> creditcard = database.getCollection("creditcard");
                MongoCollection<Document> cheque = database.getCollection("cheque");

                List<Map<String, Object>> result = new ArrayList<>();
                Document projection = new Document("fileLink", 1).append("_id", 0);

                for (String dType : docType) {
                    Map<String, Object> map = new HashMap<>();
                    switch (dType) {
                        case "Aadhaar Card":
                            Document resultAadhaar = aadhaar.find(new Document("cust_id", custId))
                                    .projection(projection).first();
                            map.put("Aadhaar Card", resultAadhaar);
                            break;
                        case "PAN Card":
                            Document resultPan = pan.find(new Document("cust_id", custId)).projection(projection)
                                    .first();
                            map.put("PAN Card", resultPan);
                            break;
                        case "Credit Card":
                            Document resultCreditCard = creditcard.find(new Document("cust_id", custId))
                                    .projection(projection).first();
                            map.put("Credit Card", resultCreditCard);
                            break;
                        case "Cheque":
                            Document resultCheque = cheque.find(new Document("cust_id", custId)).projection(projection)
                                    .first();
                            map.put("Cheque", resultCheque);
                            break;
                        default:
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Invalid document type: " + dType);
                    }
                    result.add(map);
                }

                return ResponseEntity.ok(result);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }
}
