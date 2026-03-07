# 🎮 Förbır - Kelime Türetme Bot - Kurulum Rehberi

## 📋 Adım Adım Kurulum

### 1. Discord Bot Oluşturma

#### 1.1. Discord Developer Portal'a Giriş
1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. Sağ üstteki **"New Application"** butonuna tıklayın
3. Uygulama adı: **"Förbır - Kelime Türetme"**
4. "Create" butonuna tıklayın

#### 1.2. Bot Oluşturma
1. Sol menüden **"Bot"** sekmesine gidin
2. **"Add Bot"** butonuna tıklayın
3. "Yes, do it!" ile onaylayın

#### 1.3. Bot Token'ını Alma
1. Bot sekmesinde **"Reset Token"** butonuna tıklayın
2. Çıkan token'ı kopyalayın ve güvenli bir yere kaydedin
   - ⚠️ **ÖNEMLİ**: Token'ı kimseyle paylaşmayın!

#### 1.4. Privileged Gateway Intents
Aşağı kaydırın ve **"Privileged Gateway Intents"** bölümünde şunları aktif edin:
- ✅ **MESSAGE CONTENT INTENT** (Zorunlu!)
- ⬜ PRESENCE INTENT (Opsiyonel)
- ⬜ SERVER MEMBERS INTENT (Opsiyonel)

**"Save Changes"** butonuna tıklayın.

#### 1.5. Client ID'yi Alma
1. Sol menüden **"OAuth2"** → **"General"** sekmesine gidin
2. **"CLIENT ID"** kısmını kopyalayın

### 2. Botu Sunucuya Davet Etme

#### 2.1. Davet Linki Oluşturma
Aşağıdaki linkte `BURAYA_CLIENT_ID` yerine kendi CLIENT ID'nizi yazın:

```
https://discord.com/api/oauth2/authorize?client_id=BURAYA_CLIENT_ID&permissions=326417525824&scope=bot%20applications.commands
```

#### 2.2. Gerekli İzinler
Bot şu izinlere sahip olacak:
- ✅ Kanalları Görüntüleme
- ✅ Mesaj Gönderme
- ✅ Mesajları Görüntüleme
- ✅ Embed Linkleri
- ✅ Dosya Ekleme
- ✅ Mesaj Geçmişini Okuma
- ✅ Tepki Ekleme
- ✅ Slash Komutları Kullanma

#### 2.3. Sunucuya Davet
1. Davet linkini tarayıcıda açın
2. Sunucunuzu seçin
3. "Authorize" butonuna tıklayın
4. CAPTCHA'yı tamamlayın

### 3. Bot Kurulumu

#### 3.1. Node.js Yükleme
Eğer yüklü değilse:
1. [Node.js İndirme Sayfası](https://nodejs.org/)
2. LTS versiyonunu indirin ve kurun
3. Kurulumu doğrulayın:
```bash
node --version
npm --version
```

#### 3.2. Proje Klasörüne Gitme
PowerShell veya Terminal'de:
```bash
cd E:\gelistirilen-projeler\2025-Q3\forbir-kelime-turetme
```

#### 3.3. Bağımlılıkları Yükleme
```bash
npm install
```

Bu komut şu paketleri yükleyecek:
- `discord.js` (v14.20.0)
- `axios` (v1.10.0)
- `dotenv` (v16.5.0)

### 4. Yapılandırma

#### 4.1. .env Dosyası Oluşturma
1. `.env.example` dosyasını kopyalayıp `.env` olarak kaydedin:
```bash
copy .env.example .env
```

2. `.env` dosyasını bir metin editörü ile açın

3. Aşağıdaki bilgileri doldurun:
```env
TOKEN=DISCORD_BOT_TOKEN_BURAYA
CLIENT_ID=DISCORD_CLIENT_ID_BURAYA
```

**Örnek:**
```env
TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GaBcDe.FgHiJkLmNoPqRsTuVwXyZ1234567890
CLIENT_ID=1234567890123456789
```

#### 4.2. Test Sunucusu (Opsiyonel)
Hızlı test için sadece bir sunucuya komut kaydetmek isterseniz:
```env
GUILD_ID=SUNUCU_ID_BURAYA
```

Sunucu ID'sini almak için:
1. Discord'da Developer Mode'u aktif edin (Ayarlar → Gelişmiş → Geliştirici Modu)
2. Sunucuya sağ tıklayın → "Sunucu ID'sini Kopyala"

### 5. Slash Komutları Kaydetme

```bash
npm run deploy
```

Çıktı şöyle olmalı:
```
✅ Komut hazırlandı: kelime-oyunu
🔄 1 slash komut kaydediliyor...
✅ Komutlar kaydedildi!
```

**Not**: Global kayıt yapıyorsanız komutların görünmesi 1 saat sürebilir. Guild ID kullanırsanız anında görünür.

### 6. Botu Başlatma

#### Windows:
```bash
start.bat
```
veya
```bash
npm start
```

#### Linux/Mac:
```bash
npm start
```

Başarılı çıktı:
```
✅ Komut yüklendi: kelime-oyunu
✅ Kelime Türetme Oyunu event handler yüklendi.
✅ Förbır - Kelime Türetme#1234 aktif!
📊 5 sunucuda hizmet veriliyor.
```

### 7. İlk Test

#### 7.1. Oyun Kanalını Belirleme
Discord'da bir kanalda şu komutu yazın:
```
/kelime-oyunu kanal-belirle #kelime-oyunları
```

#### 7.2. Oyun Oynama
Belirlediğiniz kanalda bir kelime yazın:
```
merhaba
```

Bot cevap vermelidir:
```
✅ 🎯 Kelime türetme oyunu başladı! Son harf: A
```

#### 7.3. Devam Etme
Başka bir kullanıcı (veya siz başka bir hesapla):
```
araba
```

Bot:
```
✅ ✨ Doğru kelime! Puanın: 1 | Son harf: A
```

## 🎯 İlk Kurulum Checklist

- [ ] Discord Developer Portal'dan bot oluşturdum
- [ ] MESSAGE CONTENT INTENT'i aktif ettim
- [ ] Bot token'ını aldım
- [ ] Client ID'yi aldım
- [ ] Botu sunucuma davet ettim
- [ ] Node.js yükledim
- [ ] `npm install` çalıştırdım
- [ ] `.env` dosyasını oluşturdum
- [ ] Token ve Client ID'yi `.env`'e yazdım
- [ ] `npm run deploy` çalıştırdım
- [ ] `npm start` veya `start.bat` ile botu başlattım
- [ ] Discord'da `/kelime-oyunu` komutunu gördüm
- [ ] Oyunu test ettim

## ⚠️ Yaygın Hatalar ve Çözümleri

### Hata: "Invalid Token"
**Çözüm**: `.env` dosyasındaki TOKEN'ı kontrol edin. Yeniden reset edip alın.

### Hata: "Missing Access"
**Çözüm**: Bot doğru izinlerle davet edilmedi. Davet linkini tekrar kullanın.

### Hata: "MESSAGE CONTENT ACCESS"
**Çözüm**: Developer Portal → Bot → MESSAGE CONTENT INTENT'i aktif edin.

### Slash komutlar görünmüyor
**Çözüm**: 
1. `npm run deploy` tekrar çalıştırın
2. Global kayıt yaptıysanız 1 saat bekleyin
3. GUILD_ID kullanarak tek sunucuya kaydedin (hızlı test)

### Bot mesajlara cevap vermiyor
**Çözüm**: 
1. Botun kanal izinlerini kontrol edin
2. MESSAGE CONTENT INTENT aktif mi?
3. Doğru kanalda mı? (`/kelime-oyunu durum` kontrol edin)

## 🚀 Başarılar!

Artık **Förbır - Kelime Türetme** botunuz çalışıyor! 🎉

Sorularınız için Discord sunucunuza destek kanalı açabilirsiniz.
