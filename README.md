# Parrot-Language
PARROT — Kişisel Sözlük Uygulaması (Parrot Language)PARROT — Kişisel Sözlük Uygulaması (Parrot Language)


**Kısa Açıklama**  
Parrot, kullanıcıların kişisel kelime listeleri oluşturup takip edebildiği bir sözlük/öğrenme uygulamasıdır. Java Spring Boot backend ve vanilla HTML/CSS/JS frontend ile geliştirilmiştir. Otomatik anlam çekme ve çeviri için Dictionary API ve LibreTranslate entegrasyonu bulunmaktadır. :contentReference[oaicite:2]{index=2}

---

## Özellikler
- Kullanıcı kaydı / oturum yönetimi
- Kelime ekleme, düzenleme, silme
- Dictionary API üzerinden otomatik anlam/örnek çekme
- LibreTranslate ile otomatik Türkçe çeviri (Docker ile çalıştırılır)
- Zorluk seviyesine göre filtreleme, arama ve sıralama
- Kelime öğrenme istatistikleri (grafikler) ve Chart.js entegrasyonu  
(Detaylı özellik listesi proje raporunda yer alır). :contentReference[oaicite:3]{index=3}

---

## Teknoloji Yığını
- Java 17, Spring Boot 3.x, Spring Data JPA, Maven, Lombok  
- Frontend: HTML5, CSS3 (Glass Morphism), JavaScript (ES6+), Chart.js  
- Veritabanı: H2 (geliştirme) → MySQL (production)  
(Tech stack proje dokümanında belirtilmiştir). :contentReference[oaicite:4]{index=4}

---

## API (kısa özet)
- `POST /api/words` — Yeni kelime ekle  
- `GET /api/words` — Tüm kelimeler  
- `GET /api/words/search` — Kelime arama  
- `GET /api/words/statistics` — İstatistikler  
- `POST /api/users/register`, `POST /api/users/login`, `POST /api/users/logout`  
(Daha fazla endpoint ve detay proje raporunda). 

---

## Gereksinimler
- Java 17+
- Maven (veya proje ile gelen `mvnw` / `mvnw.cmd`)
- MySQL (opsiyonel, H2 için konfigürasyon mevcut)
- Docker (LibreTranslate için, opsiyonel)
- Modern tarayıcı (Chrome/Firefox/Edge)

---
