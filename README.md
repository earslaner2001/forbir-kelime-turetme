# 🎮 Förbır - Kelime Türetme Discord Bot

**v1.1.0** - TDK (Türk Dil Kurumu) destekli Discord kelime türetme oyunu botu.

[![Discord.js](https://img.shields.io/badge/discord.js-v14.20.0-blue.svg)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/node.js-16%2B-green.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Özellikler

### 🎮 Oyun Özellikleri
- ✅ **TDK API Entegrasyonu**: Her kelime TDK sözlüğünden kontrol edilir
- 🏆 **Otomatik Puanlama**: Oyuncuların puanları otomatik takip edilir
- 📊 **Skor Tablosu**: Oyun bittiğinde kazananlar otomatik sıralanır
- 🎯 **Akıllı Oyun Bitişi**: Ğ, Q, W, X gibi harflerle oyun otomatik biter
- 📍 **Kanal Yönetimi**: Oyun kanalını belirleme özelliği
- 🔄 **Kullanılan Kelime Kontrolü**: Aynı kelime tekrar kullanılamaz

### 📊 Dashboard & API
- 🌐 **Canlı Dashboard**: Modern, responsive web arayüzü
- 📈 **Gerçek Zamanlı İstatistikler**: Oyuncu sayısı, kelime sayısı, liderlik tablosu
- 🎨 **Glassmorphism Tasarım**: Smooth animasyonlar ve gradient arka plan
- 🔄 **Otomatik Yenileme**: 30 saniyede bir güncellenir
- 🔗 **REST API**: JSON formatında veri erişimi
- 💪 **Hata Yönetimi**: API hatalarına karşı güvenli (v1.1.0)
- ⚡ **Render Uyumlu**: Production ortamında sorunsuz çalışır

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Discord Bot Oluştur

1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. "New Application" → **"Förbır - Kelime Türetme"** adını verin
3. "Bot" sekmesinden bot oluşturun
4. **Privileged Gateway Intents** altında şunları aktif edin:
   - ✅ MESSAGE CONTENT INTENT
5. Token'ı kopyalayın

### 3. .env Dosyası Oluştur

`.env.example` dosyasını `.env` olarak kopyalayıp düzenleyin:

```bash
cp .env.example .env
```

```env
TOKEN=BOT_TOKEN_BURAYA
CLIENT_ID=CLIENT_ID_BURAYA
```

### 4. Slash Komutları Kaydet

```bash
npm run deploy
```

### 5. Botu Başlat

```bash
npm start
```

### 6. Dashboard'a Erişim

Bot başladıktan sonra tarayıcınızda:

```
http://localhost:10000
```

**Dashboard Özellikleri:**
- 📊 Anlık istatistikler
- 🏆 Liderlik tablosu (top 10)
- 🎯 Aktif oyun durumu
- 📝 Son kelime ve devam harfi

**API Endpoints:**
- `GET /` - Dashboard ana sayfa
- `GET /api/stats` - JSON istatistikler
- `GET /health` - Health check

## 🎮 Kullanım

### Oyun Oynamak

1. `/kelime-oyunu kanal-belirle #kanal` ile oyun kanalını belirle (opsiyonel)
2. Belirlenen kanalda herhangi bir TDK kelimesi yaz
3. Sırayla son harfle başlayan kelimeler yazın!

**Örnek:**

```
Kullanıcı1> merhaba
Bot: ✅ 🎯 Kelime türetme oyunu başladı! Son harf: A

Kullanıcı2> araba
Bot: ✅ ✨ Doğru kelime! Puanın: 1 | Son harf: A

Kullanıcı1> ağaç
Bot: ✅ ✨ Doğru kelime! Puanın: 2 | Son harf: Ç

Kullanıcı2> çağ
Bot: 🏆
[Skor tablosu gösterilir]
```

### Slash Komutlar

| Komut | Açıklama |
|-------|----------|
| `/kelime-oyunu durum` | Oyun durumunu ve skorları gösterir |
| `/kelime-oyunu kanal-belirle #kanal` | Oyun kanalını belirler (Yönetici) |
| `/kelime-oyunu kanal-sifirla` | Oyun kanalı ayarını sıfırlar (Yönetici) |
| `/kelime-oyunu sifirla` | Oyunu tamamen sıfırlar (Yönetici) |

## 🎲 Oyun Kuralları

1. ✅ Son harfle başla
2. ✅ TDK'da olmalı
3. ✅ Aynı kişi üst üste yazamaz
4. 🏆 Ğ, Q, W, X gibi harflerle biten kelime oyunu bitirir
5. 📊 Her kelime +1 puan

## 📁 Proje Yapısı

```
forbir-kelime-turetme/
│
├── games/
│   └── sozcukturetme.js         # Oyun motoru & API hata yönetimi
│
├── commands/
│   └── kelime-oyunu.js           # Slash command
│
├── events/
│   └── sozcukOyunu.js            # Message event handler
│
├── data/
│   └── sozcuk_data.json          # Oyun verileri (JSON)
│
├── index.js                       # Ana bot + Express Dashboard
├── deploy-commands.js             # Slash command kayıt
├── package.json                   # Bağımlılıklar
├── .env.example                   # Örnek env dosyası
├── start.bat                      # Windows başlatma scripti
└── README.md                      # Dokümantasyon
```

## 🔧 Geliştirme

### Devam Edilebilir Harfleri Düzenle

`games/sozcukturetme.js` dosyasında `devamEdilirHarf()` fonksiyonunu düzenleyin:

```javascript
function devamEdilirHarf(harf) {
    const devamEdilebilirHarfler = ['a', 'b', 'c', ...];
    return devamEdilebilirHarfler.includes(harf.toLowerCase());
}
```

### Bot Durumunu Değiştir

`index.js` dosyasında:

```javascript
client.user.setActivity('Kelime Türetmece 📝', { type: 0 });
// type: 0 = Playing, 2 = Listening, 3 = Watching
```

## 🆘 Sorun Giderme

### Bot çevrimiçi olmuyor

- `.env` dosyasında TOKEN doğru mu?
- Bot izinleri doğru mu?
- MESSAGE CONTENT INTENT aktif mi?

### Slash komutlar görünmüyor

```bash
npm run deploy
```

komutunu tekrar çalıştırın.

### TDK API hatası

- İnternet bağlantınızı kontrol edin
- TDK API'si erişilebilir durumda mı?
- Bot otomatik retry mekanizması ile 3 kez dener

### Discord API Error [10008]: Unknown Message

✅ **Çözüldü v1.1.0**: Tüm mesaj reaksiyonları ve yanıtları artık hata yönetimine sahip. Kullanıcı mesajını silse bile bot çalışmaya devam eder.

### Dashboard yüklenmiyor

- Port numarası doğru mu? (varsayılan: 10000)
- `data/sozcuk_data.json` dosyası var mı?
- Console'da hata var mı kontrol edin

## 📊 Veri Yönetimi

Oyun verileri `data/sozcuk_data.json` dosyasında saklanır:

```json
{
  "sonKelime": "araba",
  "sonHarf": "a",
  "sonKullaniciID": "123456789",
  "oyunAktif": true,
  "oyuncular": {
    "123456789": {
      "kelimeSayisi": 5,
      "kullaniciAdi": "Kullanıcı1"
    }
  },
  "kullanilanKelimeler": ["merhaba", "araba"],
  "puanTablosu": {
    "123456789": {
      "toplamPuan": 25,
      "kazanilanOyunlar": 3,
      "toplamKelime": 25,
      "kullaniciAdi": "Kullanıcı1"
    }
  },
  "kanalID": "555666777"
}
```

## 🌐 Render Deployment

### Kurulum Adımları

1. Render.com'da yeni **Web Service** oluşturun
2. GitHub repository'nizi bağlayın
3. Environment Variables ekleyin:
   - `TOKEN` = Discord bot token
   - `CLIENT_ID` = Discord client ID
   - `PORT` = 10000 (otomatik atanır)
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Deploy edin!

### Dashboard URL

Render deployment sonrası:
```
https://your-app-name.onrender.com
```

### Özellikler
- ✅ Otomatik SSL sertifikası
- ✅ Health check endpoint (`/health`)
- ✅ 24/7 çalışır durumda
- ✅ API hata yönetimi (v1.1.0 ile iyileştirildi)

## 🔗 Bağlantılar

- **Discord.js Dokümantasyonu**: https://discord.js.org/
- **TDK Sözlük API**: https://sozluk.gov.tr/
- **Discord Developer Portal**: https://discord.com/developers/applications
- **Render Hosting**: https://render.com/

## 📝 Changelog

### v1.1.0 (Mart 2026)
- ✨ **Dashboard eklendi**: Modern web arayüzü ile gerçek zamanlı istatistikler
- 🔧 **API hata yönetimi**: Discord API hatalarına karşı güvenli (Error 10008 fixed)
- 🎨 **Glassmorphism tasarım**: Gradient arka plan ve smooth animasyonlar
- 📊 **REST API**: `/api/stats` endpoint'i eklendi
- 💪 **Production ready**: Render deployment için optimize edildi
- ⚡ **Health check**: `/health` endpoint'i eklendi

### v1.0.0
- 🎮 İlk sürüm
- ✅ TDK API entegrasyonu
- 🏆 Otomatik puanlama sistemi
- 📊 Skor tablosu

## 📄 Lisans

MIT License

## 🙏 Katkıda Bulunanlar

- [earslaner2001](https://github.com/earslaner2001)
- GitHub Copilot

---

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

**Förbır - Kelime Türetme** ile Discord sunucularınızda eğlenceli kelime oyunları oynayın! 🎉

**Versiyon**: 1.0.0  
**Tarih**: 7 Mart 2026
