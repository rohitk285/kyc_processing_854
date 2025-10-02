package com.kyc.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;

@Document(collection = "aadhaar")
public class AadhaarModel {
    @Id
    private String id; // automatically indexed as _id by mongo db

    @NotBlank(message = "Name must not be blank")
    @Indexed
    private String name; // remove if not needed

    private String fileLink;

    @NotBlank(message = "cust_id must not be blank")
    @Indexed
    private String cust_id; // foreign key reference to DocumentModel - creating a reference in mongodb

    public AadhaarModel() {
    }

    public AadhaarModel(String name, String fileLink, String cust_id) {
        this.name = name;
        this.fileLink = fileLink;
        this.cust_id = cust_id;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFileLink() {
        return fileLink;
    }

    public void setFileLink(String fileLink) {
        this.fileLink = fileLink;
    }

    public String getCust_id() {
        return cust_id;
    }

    public void setCust_id(String cust_id) {
        this.cust_id = cust_id;
    }
}
