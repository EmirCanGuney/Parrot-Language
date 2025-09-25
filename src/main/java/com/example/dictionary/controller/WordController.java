package com.example.dictionary.controller;

import com.example.dictionary.model.Word;
import com.example.dictionary.repository.WordRepository;
import com.example.dictionary.service.Definition;
import com.example.dictionary.service.DictionaryResponse;
import com.example.dictionary.service.Meaning;
import com.example.dictionary.service.WordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@RestController
@RequestMapping("/api/words")
public class WordController {

    @Autowired
    private WordService wordService;

    @Autowired
    private WordRepository wordRepository;

    // Yardımcı metod: Word nesnesini Map'e dönüştürür
    private Map<String, Object> convertWordToMap(Word word) {
        Map<String, Object> wordMap = new HashMap<>();
        wordMap.put("id", word.getId());
        wordMap.put("english", word.getEnglish());
        wordMap.put("meaning", word.getMeaning());
        wordMap.put("turkishMeaning", word.getTurkishMeaning());
        wordMap.put("exampleUsage", word.getExampleUsage());
        wordMap.put("difficultyLevel", word.getDifficultyLevel());
        wordMap.put("addedDate", word.getAddedDate());
        return wordMap;
    }

    @PostMapping
    public ResponseEntity<?> addWord(@RequestBody Word word, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You need to be logged in to add words");
        }

        // Kelime daha önce eklenmiş mi kontrol et
        boolean exists = wordService.checkWordExistsForUser(word.getEnglish(), userId);

        if (exists) {
            Map<String, Object> response = new HashMap<>();
            response.put("exists", true);
            response.put("message", "This word already exists in your dictionary. Are you sure you want to add it again?");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        // Kelime yoksa ekle
        Word addedWord = wordService.addWord(word.getEnglish(), userId);
        return ResponseEntity.ok(addedWord);
    }

    @PostMapping("/force")
    public ResponseEntity<?> forceAddWord(@RequestBody Word word, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You need to be logged in to add words");
        }

        // Kelimeyi zorla ekle (kontrol yapmadan)
        Word addedWord = wordService.addWord(word.getEnglish(), userId);
        return ResponseEntity.ok(addedWord);
    }

    @GetMapping
    public List<Map<String, Object>> getAllWords(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        List<Word> words;

        if (userId != null) {
            words = wordService.getAllWordsForUser(userId);
        } else {
            words = wordService.getAllWords();
        }

        return words.stream().map(this::convertWordToMap).collect(Collectors.toList());
    }

    @GetMapping("/search")
    public List<Map<String, Object>> searchWords(@RequestParam String query, @RequestParam(required = false) Long userId, HttpSession session) {
        // Eğer userId parametresi verilmemişse, session'dan al
        if (userId == null) {
            userId = (Long) session.getAttribute("userId");
        }

        List<Word> words;

        if (userId != null) {
            words = wordService.searchWordsForUser(query, userId);
        } else {
            // Kullanıcı giriş yapmamışsa boş liste döndür
            return new ArrayList<>();
        }

        return words.stream().map(this::convertWordToMap).collect(Collectors.toList());
    }

    @GetMapping("/sorted")
    public List<Map<String, Object>> getWordsSortedByDate(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        List<Word> words;

        if (userId != null) {
            words = wordService.getAllWordsSortedByDateDescForUser(userId);
        } else {
            words = wordService.getAllWordsSortedByDateDesc();
        }

        return words.stream().map(this::convertWordToMap).collect(Collectors.toList());
    }

    @GetMapping("/filter")
    public List<Map<String, Object>> filterWordsByDifficulty(@RequestParam String difficulty, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        List<Word> words;

        if (userId != null) {
            words = wordService.getWordsByDifficultyLevelForUser(difficulty, userId);
        } else {
            words = wordService.getWordsByDifficultyLevel(difficulty);
        }

        return words.stream().map(this::convertWordToMap).collect(Collectors.toList());
    }

    @GetMapping("/statistics")
    public Map<String, Object> getStatistics(HttpSession session) {
        Map<String, Object> stats = new HashMap<>();
        Long userId = (Long) session.getAttribute("userId");

        if (userId != null) {
            stats.put("totalWords", wordService.getTotalWordCountForUser(userId));
            stats.put("todayWords", wordService.getTodayWordCountForUser(userId));
            stats.put("last7Days", wordService.getLast7DaysWordCountForUser(userId));
            stats.put("lastMonth", wordService.getLastMonthWordCountForUser(userId));
            stats.put("lastYear", wordService.getLastYearWordCountForUser(userId));
        } else {
            stats.put("totalWords", wordService.getTotalWordCount());
            stats.put("todayWords", wordService.getTodayWordCount());
            stats.put("last7Days", wordService.getLast7DaysWordCount());
            stats.put("lastMonth", wordService.getLastMonthWordCount());
            stats.put("lastYear", wordService.getLastYearWordCount());
        }
        return stats;
    }

    @GetMapping("/chart-data")
    public Map<String, Object> getChartData(HttpSession session) {
        Map<String, Object> chartData = new HashMap<>();
        Long userId = (Long) session.getAttribute("userId");

        // Get words for the user
        List<Word> words;
        if (userId != null) {
            words = wordService.getAllWordsForUser(userId);
        } else {
            words = wordService.getAllWords();
        }

        // Calculate time data (last 7 days)
        int[] timeData = new int[7];
        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();

        for (Word word : words) {
            LocalDateTime wordDate = word.getAddedDate().toLocalDate().atStartOfDay();
            long daysDiff = ChronoUnit.DAYS.between(wordDate, today);

            if (daysDiff >= 0 && daysDiff < 7) {
                timeData[6 - (int)daysDiff]++;
            }
        }

        // Calculate difficulty data
        int easyCount = 0, mediumCount = 0, hardCount = 0, noDifficultyCount = 0;

        for (Word word : words) {
            String difficulty = word.getDifficultyLevel();
            if (difficulty == null || difficulty.isEmpty()) {
                noDifficultyCount++;
            } else {
                switch (difficulty.toLowerCase()) {
                    case "easy":
                        easyCount++;
                        break;
                    case "medium":
                        mediumCount++;
                        break;
                    case "hard":
                        hardCount++;
                        break;
                    default:
                        noDifficultyCount++;
                        break;
                }
            }
        }

        chartData.put("timeData", timeData);
        chartData.put("difficultyData", new int[]{easyCount, mediumCount, hardCount, noDifficultyCount});

        return chartData;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getWordById(@PathVariable Long id) {
        return wordRepository.findById(id)
                .map(word -> {
                    Map<String, Object> wordMap = convertWordToMap(word);

                    // API'den tam anlamı almak için
                    try {
                        String apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word.getEnglish();
                        RestTemplate restTemplate = new RestTemplate();
                        DictionaryResponse[] response = restTemplate.getForObject(apiUrl, DictionaryResponse[].class);

                        if (response != null && response.length > 0) {
                            StringBuilder fullMeaning = new StringBuilder();
                            DictionaryResponse dictionaryResponse = response[0];
                            List<Meaning> meanings = dictionaryResponse.getMeanings();

                            if (meanings != null && !meanings.isEmpty()) {
                                for (int i = 0; i < meanings.size(); i++) {
                                    Meaning meaning = meanings.get(i);
                                    List<Definition> definitions = meaning.getDefinitions();

                                    if (definitions != null && !definitions.isEmpty()) {
                                        for (int j = 0; j < definitions.size(); j++) {
                                            fullMeaning.append((j+1) + ". " + definitions.get(j).getDefinition());
                                            fullMeaning.append(". ");
                                        }
                                    }

                                    if (i < meanings.size() - 1) {
                                        fullMeaning.append(" ");
                                    }
                                }
                            }

                            if (fullMeaning.length() > 0) {
                                wordMap.put("fullMeaning", fullMeaning.toString());
                            }
                        }
                    } catch (Exception e) {
                        // API hatası durumunda mevcut anlamı kullan
                        wordMap.put("fullMeaning", word.getMeaning());
                    }

                    return ResponseEntity.ok(wordMap);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateWord(@PathVariable Long id, @RequestBody Word updatedWord) {
        return wordRepository.findById(id)
                .map(existingWord -> {
                    existingWord.setEnglish(updatedWord.getEnglish());
                    existingWord.setMeaning(updatedWord.getMeaning());
                    existingWord.setTurkishMeaning(updatedWord.getTurkishMeaning());
                    existingWord.setExampleUsage(updatedWord.getExampleUsage());
                    existingWord.setDifficultyLevel(updatedWord.getDifficultyLevel());
                    existingWord.setAddedDate(updatedWord.getAddedDate());
                    Word saved = wordRepository.save(existingWord);

                    return ResponseEntity.ok(convertWordToMap(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWord(@PathVariable Long id) {
        if (wordRepository.existsById(id)) {
            wordRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}