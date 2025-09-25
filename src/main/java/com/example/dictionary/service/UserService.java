package com.example.dictionary.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.dictionary.model.User;
import com.example.dictionary.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("This email is already in use");
        }

        User user = User.builder()
                .email(email)
                .password(password) // Gerçek uygulamada şifre hashlenmeli
                .name(name)
                .build();

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public boolean validateUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return user.getPassword().equals(password); // Gerçek uygulamada hash karşılaştırması yapılmalı
        }
        return false;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Long id, String name, String email, String password) {
        User user = getUserById(id);

        // Email değiştirilmek isteniyorsa ve yeni email başka bir kullanıcı tarafından kullanılıyorsa hata ver
        if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Bu e-posta adresi zaten kullanılıyor");
        }

        user.setName(name);
        user.setEmail(email);

        // Şifre değiştirilmek isteniyorsa güncelle
        if (password != null && !password.isEmpty()) {
            user.setPassword(password); // Gerçek uygulamada şifre hashlenmeli
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}
