package com.kyc.controller;

import org.bson.Document;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.springframework.beans.factory.annotation.Value;
import java.util.regex.Pattern;

import com.mongodb.ReadConcern;
import com.mongodb.client.FindIterable;

import java.util.*;

@RestController
@RequestMapping("/api")
public class SearchByName {
    
    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    @GetMapping("/name/{name}")
    public ResponseEntity<?> getCustomerByName(
        @PathVariable("name") String name) {
            try {
                try (var mongoClient = MongoClients.create(mongoUriString)) {
                    // ensures consistency of data that is read and returned
                    MongoDatabase database = mongoClient.getDatabase("kyc_db").withReadConcern(ReadConcern.MAJORITY);
                    
                    MongoCollection<Document> collection = database.getCollection("document");

                    Pattern pattern = Pattern.compile(name, Pattern.CASE_INSENSITIVE);
                    Document query = new Document("name", pattern);

                    Document projection = new Document("name", 1)
                            .append("cust_id", 1)
                            .append("_id", 0);

                    FindIterable<Document> result = collection.find(query).projection(projection);
                    List<String> returnList = new ArrayList<>();
                    for(Document doc : result) {
                        returnList.add(doc.toJson());
                    }

                    return ResponseEntity.ok(returnList);
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("An error occurred: " + e.getMessage());
            }
        }
}
