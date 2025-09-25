package com.example.dictionary.service;

import com.example.dictionary.model.User;
import com.example.dictionary.model.Word;
import com.example.dictionary.repository.WordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;


import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WordService {

    @Autowired
    private WordRepository wordRepository;

    @Autowired
    private UserService userService;
    
    //apilerle iletişim için
    private final RestTemplate restTemplate = new RestTemplate();

    // eski metod (geriye dönük uyumluluk için kullanıcısız hali)
    public Word addWord(String englishWord) {
        return addWord(englishWord, null);
    }

    // Kelime kullanıcı için daha önce eklenmiş mi kontrol et
    public boolean checkWordExistsForUser(String englishWord, Long userId) {
        User user = userService.getUserById(userId);
        Optional<Word> existing = wordRepository.findByEnglishIgnoreCaseAndUser(englishWord, user);
        return existing.isPresent();
    }

    public Word addWord(String englishWord, Long userId) {
        User user = null;
        if (userId != null) {
            user = userService.getUserById(userId);
        }

        String apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + englishWord;

        try {
        	DictionaryResponse[] response = restTemplate.getForObject(apiUrl, DictionaryResponse[].class);
        	String meaning = extractMeaningFromResponse(response);
        	String exampleUsage = extractExampleSentenceFromResponse(response);
        	String turkishMeaning = translateToTurkish(meaning);

            Word word = Word.builder()
                    .english(englishWord)
                    .meaning(meaning)
                    .exampleUsage(exampleUsage)
                    .turkishMeaning(turkishMeaning)
                    .addedDate(LocalDateTime.now())
                    .user(user)
                    .build();

            return wordRepository.save(word);
        } catch (Exception e) {
            throw new RuntimeException("Anlam alınamadı veya kelime bulunamadı: " + e.getMessage());
        }
    }


    public List<Word> getAllWords() {
        return wordRepository.findAll();
    }

    public List<Word> getAllWordsForUser(Long userId) {
        User user = userService.getUserById(userId);
        return wordRepository.findByUserOrderByAddedDateDesc(user);
    }

    private String extractMeaningFromResponse(DictionaryResponse[] response) {
        DictionaryResponse dictionaryResponse = response[0];
        List<Meaning> meanings = dictionaryResponse.getMeanings();

        if (meanings != null && !meanings.isEmpty()) {
            Meaning firstMeaning = meanings.get(0);
            List<Definition> definitions = firstMeaning.getDefinitions();

            if (definitions != null && !definitions.isEmpty()) {
                return definitions.get(0).getDefinition();
            }
        }
        return "Anlam bulunamadı";
    }

    private String extractExampleSentenceFromResponse(DictionaryResponse[] response) {
        DictionaryResponse dictionaryResponse = response[0];
        List<Meaning> meanings = dictionaryResponse.getMeanings();
        if (meanings != null && !meanings.isEmpty()) {
            Meaning firstMeaning = meanings.get(0);
            List<Definition> definitions = firstMeaning.getDefinitions();
            if (definitions != null && !definitions.isEmpty()) {
                return definitions.get(0).getExampleSentence(); // Örnek cümleyi al
            }
        }
        return "Örnek cümle bulunamadı";
    }


    public List<Word> searchWords(String query) {
        return wordRepository.findByEnglishContainingIgnoreCaseOrMeaningContainingIgnoreCase(query, query);
    }

    public List<Word> searchWordsForUser(String query, Long userId) {
        User user = userService.getUserById(userId);
        return wordRepository.findByUserAndEnglishContainingIgnoreCaseOrUserAndMeaningContainingIgnoreCase(user, query, user, query);
    }

    public List<Word> getAllWordsSortedByDateDesc() {
        return wordRepository.findAllByOrderByAddedDateDesc();
    }

    public List<Word> getAllWordsSortedByDateDescForUser(Long userId) {
        User user = userService.getUserById(userId);
        return wordRepository.findByUserOrderByAddedDateDesc(user);
    }

    public List<Word> getWordsByDifficultyLevel(String difficultyLevel) {
        return wordRepository.findByDifficultyLevelOrderByAddedDateDesc(difficultyLevel);
    }

    public List<Word> getWordsByDifficultyLevelForUser(String difficultyLevel, Long userId) {
        User user = userService.getUserById(userId);
        return wordRepository.findByDifficultyLevelAndUserOrderByAddedDateDesc(difficultyLevel, user);
    }

    public long getTotalWordCount() {
        return wordRepository.count();
    }

    public long getTotalWordCountForUser(Long userId) {
        User user = userService.getUserById(userId);
        return wordRepository.countByUser(user);
    }

    public long getTodayWordCount() {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        return wordRepository.countByAddedDateGreaterThanEqual(todayStart);
    }

    public long getTodayWordCountForUser(Long userId) {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        User user = userService.getUserById(userId);
        return wordRepository.countByAddedDateGreaterThanEqualAndUser(todayStart, user);
    }

    public long getLast7DaysWordCount() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        return wordRepository.countByAddedDateAfter(sevenDaysAgo);
    }

    public long getLast7DaysWordCountForUser(Long userId) {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        User user = userService.getUserById(userId);
        return wordRepository.countByAddedDateAfterAndUser(sevenDaysAgo, user);
    }

    public long getLastMonthWordCount() {
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        return wordRepository.countByAddedDateAfter(oneMonthAgo);
    }

    public long getLastMonthWordCountForUser(Long userId) {
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        User user = userService.getUserById(userId);
        return wordRepository.countByAddedDateAfterAndUser(oneMonthAgo, user);
    }

    public long getLastYearWordCount() {
        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);
        return wordRepository.countByAddedDateAfter(oneYearAgo);
    }

    public long getLastYearWordCountForUser(Long userId) {
        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);
        User user = userService.getUserById(userId);
        return wordRepository.countByAddedDateAfterAndUser(oneYearAgo, user);
    }

    private String translateToTurkish(String englishText) {
    	String url = "http://localhost:5000/translate";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("q", englishText);
        requestBody.put("source", "en");
        requestBody.put("target", "tr");
        requestBody.put("format", "text");

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<>() {}
            );

            Object translated = response.getBody().get("translatedText");
            return translated != null ? translated.toString() : "Türkçe çeviri alınamadı";
        } catch (Exception e) {
            return "Çeviri hatası: " + e.getMessage();
        }
    }
}
