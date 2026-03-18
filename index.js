// index.js - Förbır - Kelime Türetme Bot
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🚀 Förbır - Kelime Türetme Bot başlatılıyor...');

// Client oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Komut koleksiyonu
client.commands = new Collection();

// Komutları yükle
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if (command?.data?.name) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Komut yüklendi: ${command.data.name}`);
    }
}

// Event handler'ı yükle
require('./events/sozcukOyunu')(client);

// Interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Komut hatası:', error);
        const errorMessage = { 
            content: '❌ Bu komutu çalıştırırken bir hata oluştu!', 
            ephemeral: true 
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Bot hazır
client.once('clientReady', () => {
    console.log(`✅ ${client.user.tag} aktif!`);
    console.log(`📊 ${client.guilds.cache.size} sunucuda hizmet veriliyor.`);
    
    // Bot durumu
    client.user.setActivity('Kelime Türetmece 📝', { type: 0 }); // Playing
});

// Hata yönetimi
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Botu başlat
client.login(process.env.TOKEN);

// Dashboard Routes
const dataPath = path.join(__dirname, 'data/sozcuk_data.json');

// Public klasörünü statik dosyalar için kullan
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint - Son harfi güncelle
app.post('/api/update-harf', (req, res) => {
    try {
        const { harf } = req.body;
        
        if (!harf || harf.length !== 1) {
            return res.status(400).json({ success: false, message: 'Geçerli bir harf girin!' });
        }
        
        const turkishLetter = harf.toLowerCase().replace('i', 'ı');
        
        const gameData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        gameData.sonHarf = turkishLetter;
        
        fs.writeFileSync(dataPath, JSON.stringify(gameData, null, 2), 'utf8');
        
        console.log(`✏️ Son harf güncellendi: ${turkishLetter.toUpperCase()}`);
        
        res.json({ 
            success: true, 
            message: `Son harf "${turkishLetter.toUpperCase()}" olarak güncellendi!`,
            newHarf: turkishLetter
        });
    } catch (error) {
        console.error('Harf güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// API endpoint - Kanala mesaj gönder
app.post('/api/send-message', async (req, res) => {
    try {
        const { channelId, message } = req.body;
        
        if (!channelId || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Kanal ID ve mesaj gereklidir!' 
            });
        }
        
        // Channel ID validation
        if (!/^[0-9]{17,19}$/.test(channelId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz kanal ID formatı!' 
            });
        }
        
        // Get channel
        const channel = await client.channels.fetch(channelId).catch(() => null);
        
        if (!channel) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kanal bulunamadı veya bota erişim yok!' 
            });
        }
        
        if (!channel.isTextBased()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bu kanal metin kanalı değil!' 
            });
        }
        
        // Send message
        await channel.send(message);
        
        console.log(`📨 Mesaj gönderildi: Kanal=${channelId}, Uzunluk=${message.length}`);
        
        res.json({ 
            success: true, 
            message: 'Mesaj başarıyla gönderildi! ✅',
            channelName: channel.name
        });
        
    } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Mesaj gönderilemedi: ' + (error.message || 'Sunucu hatası')
        });
    }
});

// API endpoint - JSON veri
app.get('/api/stats', (req, res) => {
    try {
        const gameData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        // Anlık oyun skorları
        const anlikSkorlar = Object.entries(gameData.oyuncular || {})
            .map(([userId, stats]) => ({
                kullaniciAdi: stats.kullaniciAdi,
                kelimeSayisi: stats.kelimeSayisi
            }))
            .sort((a, b) => b.kelimeSayisi - a.kelimeSayisi);
        
        res.json({
            oyunAktif: gameData.oyunAktif,
            sonKelime: gameData.sonKelime,
            sonHarf: gameData.sonHarf,
            toplamOyuncu: Object.keys(gameData.puanTablosu || {}).length,
            toplamKelime: gameData.kullanilanKelimeler?.length || 0,
            aktifOyuncular: Object.keys(gameData.oyuncular || {}).length,
            sunucuSayisi: client.guilds?.cache.size || 0,
            anlikSkorlar: anlikSkorlar,
            liderler: Object.entries(gameData.puanTablosu || {})
                .map(([userId, stats]) => ({
                    kullaniciAdi: stats.kullaniciAdi,
                    toplamPuan: stats.toplamPuan,
                    kazanilanOyunlar: stats.kazanilanOyunlar,
                    toplamKelime: stats.toplamKelime || 0
                }))
                .sort((a, b) => b.toplamPuan - a.toplamPuan)
                .slice(0, 10)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        botStatus: client.user ? 'online' : 'offline'
    });
});

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`🌐 Dashboard ${port} portunda çalışıyor!`);
    console.log(`📊 Dashboard URL: http://localhost:${port}`);
});
