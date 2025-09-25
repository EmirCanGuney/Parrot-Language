package com.example.dictionary.service;

public class Definition {
    private String definition;
    private String exampleSentence; 

    public String getDefinition() {
        return definition;
    }

    public void setDefinition(String definition) {
        this.definition = definition;
    }

    public String getExampleSentence() {
        return exampleSentence;  // Getter
    }

    public void setExampleSentence(String exampleSentence) {
        this.exampleSentence = exampleSentence; // Setter
    }
}
