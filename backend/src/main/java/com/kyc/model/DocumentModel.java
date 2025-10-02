package com.kyc.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;

import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;
import java.util.Map;

@Document(collection="document")
public class DocumentModel {
    @Id
    private String cust_id;  // mongo db automatically indexes this field since it is the _id

    @NotBlank(message = "Name must not be blank")
    @Indexed
    private String name;
    
    private List<String> document_type;
    private Map<String, Object> entities;

    public DocumentModel() {}

    public DocumentModel(String name, List<String> document_type, Map<String, Object> entities) {
        this.name = name;
        this.document_type = document_type;
        this.entities = entities;
    }

    public String getCust_id() {
        return cust_id;
    }

    public void setCust_id(String cust_id) {
        this.cust_id = cust_id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getDocument_type() {
        return document_type;
    }

    public void setDocument_type(List<String> document_type) {
        this.document_type = document_type;
    }

    public Map<String, Object> getEntities() {
        return entities;
    }

    public void setEntities(Map<String, Object> entities) {
        this.entities = entities;
    }
}
