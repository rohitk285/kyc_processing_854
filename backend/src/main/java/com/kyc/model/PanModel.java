package com.kyc.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection="Pan")
public class PanModel {
    @Id
    private String id;

    @Indexed
    private String name;
    private String fileLink;

    private String cust_id; // foreign key reference to DocumentModel - creating a reference in mongodb

    public PanModel() {}

    public PanModel(String name, String fileLink, String cust_id) {
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
