# Freshchat Vectorizer

Bu proje, Freshchat müşteri hizmetleri konuşmalarını ve bilgi bankası dokümanlarını vektörleştirerek, yapay zeka destekli akıllı yanıt sistemi oluşturmayı amaçlar.

## Özellikler

- Freshchat konuşmalarını otomatik vektörleştirme
- Bilgi bankası dokümanlarını vektörleştirme
- İki boyutlu RAG (Retrieval Augmented Generation) sistemi
  - Geçmiş konuşmalardan benzer örnekleri bulma
  - Bilgi bankasından ilgili dokümanları bulma
- GPT-4 ile doğal dil yanıtları oluşturma
- REST API desteği

## Sistem Mimarisi

### Servisler

1. **FreshchatService**: Freshchat API ile iletişim kurar ve konuşmaları yönetir
2. **QdrantService**: Konuşmaları vektör veritabanında saklar ve benzerlik araması yapar
3. **KnowledgeService**: Bilgi bankası dokümanlarını yönetir ve vektörleştirir
4. **OpenAIService**: Embedding oluşturma ve RAG yanıtları üretme işlemlerini yönetir
5. **API Server**: RAG sistemine HTTP endpoint üzerinden erişim sağlar

### Vektör Veritabanı (Qdrant)

- `conversations_simplified`: Geçmiş konuşmaları saklar
- `knowledge`: Bilgi bankası dokümanlarını saklar

## Kurulum

1. Gerekli paketleri yükleyin:
```bash
npm install
```

2. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
```
`.env` dosyasını düzenleyerek gerekli API anahtarlarını ekleyin:
- OPENAI_API_KEY
- QDRANT_URL
- QDRANT_API_KEY
- FRESHCHAT_API_KEY
- FRESHCHAT_API_URL
- API_TOKEN (güvenli bir token oluşturun)

## Kullanım

### API Sunucusunu Başlatma

```bash
node src/api/server.js
```

### API Endpoint Kullanımı

```bash
curl "http://localhost:3000/api/flalingo-ai?question=Nasıl ders rezervasyonu yapabilirim?&token=your_api_token"
```

Örnek yanıt:
```json
{
    "success": true,
    "answer": "GPT-4 tarafından oluşturulan yanıt",
    "metadata": {
        "similar_conversations": 3,
        "knowledge_articles": 2
    }
}
```

### Bilgi Bankası Dokümanlarını İçe Aktarma

1. `knowledge_base.txt` dosyasına dokümanları ekleyin (her dokümanı "-----" ile ayırın)
2. Dokümanları içe aktarın:
```bash
node src/scripts/importKnowledge.js
```

### RAG Sistemini Test Etme

Test scriptini çalıştırın:
```bash
node test-rag.js
```

## Teknik Detaylar

### Vektör Boyutları
- OpenAI Ada-002 Embeddings: 1536 boyutlu vektörler
- Cosine benzerlik metriği kullanılır
- Benzerlik eşiği: 0.3 (ayarlanabilir)

### API Güvenliği
- Token tabanlı kimlik doğrulama
- Rate limiting (yakında eklenecek)
- CORS koruması (yakında eklenecek)

### Konuşma Formatı
```javascript
{
    id: "unique-id",
    conversation: "Agent: Merhaba\nUser: Merhaba...",
    user_id: "user-id",
    assigned_agent_id: "agent-id",
    is_resolved: true/false
}
```

### RAG Yanıt Formatı
```javascript
{
    answer: "GPT-4 tarafından oluşturulan yanıt",
    sources: {
        conversations: [
            { id, content, score }
        ],
        knowledge: [
            { id, title, content, score }
        ]
    }
}
```

## Hata Ayıklama

### Yaygın Hatalar

1. **Vektör Oluşturma Hataları**
   - OpenAI API anahtarının doğruluğunu kontrol edin
   - Rate limit aşımlarına dikkat edin

2. **Qdrant Bağlantı Hataları**
   - URL ve API anahtarının doğruluğunu kontrol edin
   - Koleksiyon yapılandırmasını kontrol edin

3. **Benzer Konuşma Bulunamama Durumu**
   - Benzerlik eşiğini düşürmeyi deneyin
   - Vektörlerin doğru oluşturulduğundan emin olun

4. **API Hataları**
   - Token doğruluğunu kontrol edin
   - İstek formatını kontrol edin
   - Sunucunun çalışır durumda olduğundan emin olun

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun 