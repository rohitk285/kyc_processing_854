package com.kyc.controller;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kyc.model.UserModel;
import com.kyc.util.JwtUtil;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.crypto.bcrypt.BCrypt;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserModel user){
        UserModel existingUser = mongoTemplate.findById(user.getUser_id(), UserModel.class);
        if(existingUser != null){
            return ResponseEntity.badRequest().body("Username already exists");
        }

        String hashedPassword = BCrypt.hashpw(user.getPassword(), BCrypt.gensalt());
        user.setPassword(hashedPassword);
        mongoTemplate.save(user);

        return ResponseEntity.ok("User registered successfully");
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserModel user){
        UserModel existingUser = mongoTemplate.findById(user.getUser_id(), UserModel.class);
        if(existingUser == null || !BCrypt.checkpw(user.getPassword(), existingUser.getPassword())){
            return ResponseEntity.status(401).body("Invalid username or password");
        }

        String token = jwtUtil.generateToken(existingUser.getUsername());
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("message", "Login successful");
        return ResponseEntity.ok(response);
    }
}
