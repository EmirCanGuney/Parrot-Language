package com.example.dictionary.service;

import java.util.List;

public class DictionaryResponse {
    private List<Meaning> meanings;

    public List<Meaning> getMeanings() {
        return meanings;
    }

    public void setMeanings(List<Meaning> meanings) {
        this.meanings = meanings;
    }
}
