package com.kyc.controller;

import com.kyc.util.EncryptionUtil;
import com.mongodb.WriteConcern;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class UpdateDetailsController {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUriString;

    /**
     * Partially updates an existing customer's details (name and/or entities) in
     * the 'document'
     * collection. Only the fields sent in the request body are updated.
     *
     * @param custId         The unique ID of the customer to update, passed in the
     *                       URL path.
     * @param updatedDetails A Map representing the JSON body with the fields to
     *                       update.
     * @return A response entity indicating the success or failure of the operation.
     */
    @PatchMapping("/customer/{custId}")
    public ResponseEntity<?> patchCustomerDetails(
            @PathVariable String custId,
            @RequestBody Map<String, Object> updatedDetails) {

        try (var mongoClient = MongoClients.create(mongoUriString)) {
            try (var session = mongoClient.startSession()) {
                return session.withTransaction(() -> {
                    MongoDatabase database = mongoClient.getDatabase("kyc_db").withWriteConcern(WriteConcern.MAJORITY);
                    MongoCollection<Document> collection = database.getCollection("document");

                    if(custId == null || custId.isEmpty()){
                        return ResponseEntity.badRequest()
                                .body(Map.of("status", "error", "message", "cust_id in path cannot be null or empty."));
                    }

                    Document filter = new Document("cust_id", custId);
                    Document updateOperation = new Document();

                    if (updatedDetails.containsKey("name")) {
                        updateOperation.append("name", updatedDetails.get("name"));
                    }
                    if (updatedDetails.containsKey("entities")) {
                        Map<String, Object> entitiesMap = (Map<String, Object>) updatedDetails.get("entities");
                        Document encryptedEntities = new Document();

                        for(Map.Entry<String, Object> entry: entitiesMap.entrySet()){
                            String key = entry.getKey();
                            String value = entry.getValue().toString();
                            
                            try{
                                Map<String, String> encResult = EncryptionUtil.encryptWithIV(value);
                                encryptedEntities.put(key, encResult);
                            }
                            catch(Exception e){
                                throw new RuntimeException("Failed to encrypt field: " + key, e);
                            }
                        }

                        updateOperation.append("entities", encryptedEntities);
                    }

                    if (updateOperation.isEmpty()) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("status", "error", "message", "No valid fields provided to update."));
                    }

                    UpdateResult result = collection.updateOne(session, filter, new Document("$set", updateOperation));

                    if (result.getMatchedCount() == 0) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("status", "error", "message",
                                        "Customer with ID '" + custId + "' not found."));
                    }

                    return ResponseEntity
                            .ok(Map.of("status", "success", "message", "Customer details updated successfully."));
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
