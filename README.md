# Flalingo AI Assistant

Flalingo AI Assistant, müşteri hizmetleri konuşmalarını ve bilgi bankası dokümanlarını kullanarak, yapay zeka destekli akıllı yanıt sistemi sunan bir API servisidir. Sistem, geçmiş konuşmalardan ve bilgi bankasından en alakalı içerikleri bularak, GPT-4 ile doğal ve tutarlı yanıtlar üretir.

## 🚀 Özellikler

- **İki Boyutlu RAG Sistemi**
  - Geçmiş konuşmalardan benzer örnekleri bulma
  - Bilgi bankasından ilgili dokümanları bulma
  - Her iki kaynağı birleştirerek kapsamlı yanıtlar üretme

- **Vektör Veritabanı Entegrasyonu**
  - Konuşmaları ve dokümanları vektörleştirme
  - Semantik arama yapabilme
  - Yüksek performanslı benzerlik sorguları

- **REST API**
  - Token tabanlı güvenlik
  - Kolay entegre edilebilir endpoint
  - JSON formatında yanıtlar

## 🛠 Teknolojiler

- **OpenAI GPT-4**: Doğal dil işleme ve yanıt üretme
- **Qdrant**: Vektör veritabanı
- **Express.js**: API sunucusu
- **Node.js**: Runtime environment

## 📦 Kurulum

1. Repo'yu klonlayın:
```bash
git clone https://github.com/yourusername/flalingo-ai-assistant.git
cd flalingo-ai-assistant
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Çevre değişkenlerini ayarlayın:
```bash
cp .env.example .env
```

4. `.env` dosyasını düzenleyin:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Qdrant Configuration
QDRANT_URL=your_qdrant_url_here
QDRANT_API_KEY=your_qdrant_api_key_here

# Freshchat Configuration
FRESHCHAT_API_KEY=your_freshchat_api_key_here
FRESHCHAT_API_URL=your_freshchat_api_url_here

# API Configuration
API_TOKEN=your_secure_api_token_here
```

## 🚦 Kullanım

### API Sunucusunu Başlatma

```bash
node src/api/server.js
```

### API'yi Kullanma

**Endpoint**: `GET /api/flalingo-ai`

**Parametreler**:
- `question`: Sorulacak soru (zorunlu)
- `token`: API token (zorunlu)

**Örnek İstek**:
```bash
curl "http://localhost:3000/api/flalingo-ai?question=Nasıl ders rezervasyonu yapabilirim?&token=your_api_token"
```

**Örnek Yanıt**:
```json
{
    "success": true,
    "answer": "Ders rezervasyonu yapmak için öncelikle Flalingo platformuna giriş yapmanız gerekiyor...",
    "metadata": {
        "similar_conversations": 3,
        "knowledge_articles": 2
    }
}
```

### Bilgi Bankası Yönetimi

1. Dokümanları `knowledge_base.txt` dosyasına ekleyin:
```text
Başlık 1
İçerik...
-----
Başlık 2
İçerik...
```

2. Dokümanları içe aktarın:
```bash
node src/scripts/importKnowledge.js
```

## 🔍 Teknik Detaylar

### Vektör Özellikleri
- Model: OpenAI Ada-002 Embeddings
- Boyut: 1536 dimension
- Metrik: Cosine similarity
- Eşik değeri: 0.3 (ayarlanabilir)

### Veri Formatları

**Konuşma Formatı**:
```javascript
{
    id: "unique-id",
    conversation: "Agent: Merhaba\nUser: Merhaba...",
    user_id: "user-id",
    assigned_agent_id: "agent-id",
    is_resolved: true/false
}
```

**RAG Yanıt Formatı**:
```javascript
{
    answer: "GPT-4 yanıtı",
    sources: {
        conversations: [{ id, content, score }],
        knowledge: [{ id, title, content, score }]
    }
}
```

## ⚠️ Hata Ayıklama

### Sık Karşılaşılan Sorunlar

1. **API Bağlantı Hataları**
   - Token doğruluğunu kontrol edin
   - Sunucunun çalıştığından emin olun
   - İstek formatını kontrol edin

2. **Vektör İşleme Hataları**
   - OpenAI API anahtarını kontrol edin
   - Rate limit aşımlarını kontrol edin
   - Vektör boyutlarını kontrol edin

3. **Yanıt Kalitesi Sorunları**
   - Benzerlik eşiğini ayarlayın
   - Bilgi bankası içeriğini güncelleyin
   - Konuşma verilerini kontrol edin

## 🔒 Güvenlik

- Token tabanlı kimlik doğrulama
- Rate limiting (yakında)
- CORS koruması (yakında)
- IP bazlı kısıtlamalar (yakında)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 Destek

Sorularınız için [issues](https://github.com/yourusername/flalingo-ai-assistant/issues) bölümünü kullanabilirsiniz. 