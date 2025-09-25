package com.example.dictionary.repository;

import com.example.dictionary.model.User;
import com.example.dictionary.model.Word;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
	Optional<Word> findByEnglishIgnoreCase(String english);
	Optional<Word> findByEnglishIgnoreCaseAndUser(String english, User user);

	List<Word> findByEnglishContainingIgnoreCaseOrMeaningContainingIgnoreCase(String english, String meaning);
	List<Word> findByUserAndEnglishContainingIgnoreCaseOrUserAndMeaningContainingIgnoreCase(User user, String english, User user2, String meaning);

	List<Word> findAllByOrderByAddedDateDesc();
	List<Word> findByUserOrderByAddedDateDesc(User user);

	List<Word> findByDifficultyLevel(String difficultyLevel);
	List<Word> findByDifficultyLevelAndUser(String difficultyLevel, User user);

	List<Word> findByDifficultyLevelOrderByAddedDateDesc(String difficultyLevel);
	List<Word> findByDifficultyLevelAndUserOrderByAddedDateDesc(String difficultyLevel, User user);

    long countByAddedDateAfter(LocalDateTime date);
    long countByAddedDateAfterAndUser(LocalDateTime date, User user);

    long countByAddedDateBefore(LocalDateTime date);
    long countByAddedDateBeforeAndUser(LocalDateTime date, User user);

    long countByAddedDateGreaterThanEqual(LocalDateTime date);
    long countByAddedDateGreaterThanEqualAndUser(LocalDateTime date, User user);

    long countByUser(User user);
}
