package com.kyc.controller;

import org.bson.Document;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.springframework.util.MultiValueMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.core.ParameterizedTypeReference;

import com.kyc.util.GoogleDriveUploader;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.*;

@RestController
@RequestMapping("/api")
public class UploadController {
    @CrossOrigin(origins = "http://localhost:5173") // frontend localhost - not needed, can be removed
    @PostMapping("/upload")
    public ResponseEntity<?> handleUpload(
        @RequestParam("file") MultipartFile file) { // only one file as of now
        try {
            // Read file bytes once
            byte[] fileBytes = file.getBytes();

            // uploading to GDrive through service account
            InputStream driveStream = new ByteArrayInputStream(fileBytes);
            String driveLink = GoogleDriveUploader.uploadToDrive(
                    driveStream,
                    file.getOriginalFilename(),
                    file.getContentType());

            // Send PDF to Flask API for NER (only the file)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            InputStream flaskStream = new ByteArrayInputStream(fileBytes);
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new MultipartInputStreamFileResource(flaskStream, file.getOriginalFilename()));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map<String, Object>> flaskResponse = restTemplate.exchange(
                    "http://localhost:5000/uploadDetails",
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<>() {
                    });

            if (flaskResponse.getStatusCode() != HttpStatus.OK || flaskResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                        "status", "error",
                        "message", "Flask server error or no data"));
            }

            Map<String, Object> flaskData = flaskResponse.getBody();

            // Extract and parse response
            List<Map<String, Object>> extracted = new ArrayList<>();
            Object extractedObj = flaskData.get("extracted_data");
            if (extractedObj instanceof List<?>) {
                for (Object item : (List<?>) extractedObj) {
                    if (item instanceof Map<?, ?> rawMap) {
                        Map<String, Object> typedMap = new HashMap<>();
                        for (Map.Entry<?, ?> e : rawMap.entrySet()) {
                            typedMap.put(String.valueOf(e.getKey()), e.getValue());
                        }
                        extracted.add(typedMap);
                    }
                }
            }

            // storing data in MongoDB
            try (var mongoClient = MongoClients.create("mongodb://localhost:27017")) {
                MongoDatabase db = mongoClient.getDatabase("kyc_db");
                MongoCollection<Document> documentCollection = db.getCollection("document");

                for (Map<String, Object> doc : extracted) {
                    Object docTypeObj = doc.get("document_type");

                    List<String> documentTypes = new ArrayList<>();
                    if (docTypeObj instanceof List<?> list) {
                        for (Object t : list)
                            documentTypes.add(String.valueOf(t));
                    } else if (docTypeObj instanceof String s) {
                        documentTypes.add(s);
                    }

                    Object namedEntities = doc.get("named_entities");
                    String name = null;
                    if(namedEntities instanceof Map<?,?>){
                        Map<?,?> temp = (Map<?,?>) namedEntities;
                        name = (String) temp.get("Name");
                    }

                    Document docModel = new Document();               
                    docModel.append("name", name);
                    docModel.append("document_type", documentTypes);
                    docModel.append("entities", namedEntities);

                    // inserting into document collection
                    documentCollection.insertOne(docModel);
                    // getting the generated cust_id in mongodb
                    String cust_id = docModel.getObjectId("_id").toString(); // use this as foreign key

                    if (!documentTypes.isEmpty()) {
                        String type = documentTypes.get(0).toLowerCase();
                        MongoCollection<Document> typeCollection = db.getCollection(type);

                        Document typeDoc = new Document();
                        typeDoc.append("name", name);
                        typeDoc.append("fileLink", driveLink);
                        typeDoc.append("cust_id", cust_id);

                        typeCollection.insertOne(typeDoc);
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "data", extracted));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Server error: " + e.getMessage()));
        }
    }
}
