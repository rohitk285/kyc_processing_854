package com.kyc.controller;

import org.bson.Document;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.mongodb.ReadConcern;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
public class FetchByCustID {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @GetMapping("/customerDetailsCustID")
    public ResponseEntity<?> getCustomerDetailsById(
            @RequestParam("cust_id") String custId) {
        try {
            try (var mongoClient = MongoClients.create(mongoUriString)) {
                // ReadConcern - returns data that has been ACK by the majority of replica set members
                // ensures consistency of data that is read and returned
                MongoDatabase database = mongoClient.getDatabase("kyc_db").withReadConcern(ReadConcern.MAJORITY);

                MongoCollection<Document> collection = database.getCollection("document");

                // fetching details of customer with cust_id
                Document query = new Document("cust_id", custId);
                Document result = collection.find(query).first();

                if (result == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("No customer found with cust_id: " + custId);
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
