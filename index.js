// index.js - Förbır - Kelime Türetme Bot
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

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

// Ana dashboard sayfası
app.get('/', (req, res) => {
    try {
        const gameData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        // İstatistikler hazırla
        const toplamOyuncu = Object.keys(gameData.puanTablosu || {}).length;
        const toplamKelime = gameData.kullanilanKelimeler?.length || 0;
        const aktifOyuncular = Object.keys(gameData.oyuncular || {}).length;
        
        // Liderlik tablosu
        const liderler = Object.entries(gameData.puanTablosu || {})
            .map(([userId, stats]) => ({
                kullaniciAdi: stats.kullaniciAdi,
                toplamPuan: stats.toplamPuan,
                kazanilanOyunlar: stats.kazanilanOyunlar,
                toplamKelime: stats.toplamKelime
            }))
            .sort((a, b) => b.toplamPuan - a.toplamPuan)
            .slice(0, 10);
        
        // Anlık oyun skorları
        const anlikSkorlar = Object.entries(gameData.oyuncular || {})
            .map(([userId, stats]) => ({
                kullaniciAdi: stats.kullaniciAdi,
                kelimeSayisi: stats.kelimeSayisi
            }))
            .sort((a, b) => b.kelimeSayisi - a.kelimeSayisi);
        
        const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Förbır - Kelime Türetme Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            text-align: center;
            margin-bottom: 40px;
            animation: fadeIn 0.8s ease-in;
        }
        h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            animation: slideUp 0.6s ease-out;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .stat-icon {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            font-size: 1em;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .game-status {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .status-active {
            background: #10b981;
            animation: pulse 2s infinite;
        }
        .status-inactive {
            background: #ef4444;
        }
        .leaderboard {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .leaderboard h2 {
            margin-bottom: 20px;
            font-size: 2em;
        }
        .leader-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.3s ease;
        }
        .leader-item:hover {
            background: rgba(255, 255, 255, 0.15);
        }
        .leader-rank {
            font-size: 1.5em;
            font-weight: bold;
            width: 50px;
        }
        .leader-name {
            flex: 1;
            font-size: 1.2em;
        }
        .leader-stats {
            text-align: right;
            font-size: 0.9em;
            opacity: 0.8;
        }
        .leader-score {
            font-size: 1.5em;
            font-weight: bold;
            min-width: 80px;
            text-align: right;
        }
        .refresh-info {
            text-align: center;
            margin-top: 30px;
            opacity: 0.7;
            font-size: 0.9em;
        }
        .no-data {
            text-align: center;
            padding: 40px;
            opacity: 0.6;
            font-size: 1.2em;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        @media (max-width: 768px) {
            h1 { font-size: 2em; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
    <script>
        // Otomatik yenileme (30 saniyede bir)
        setTimeout(() => location.reload(), 30000);
    </script>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎮 Förbır - Kelime Türetme</h1>
            <p class="subtitle">Discord Bot Dashboard</p>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🤖</div>
                <div class="stat-value">${client.guilds?.cache.size || 0}</div>
                <div class="stat-label">Sunucu</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${toplamOyuncu}</div>
                <div class="stat-label">Toplam Oyuncu</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-value">${toplamKelime}</div>
                <div class="stat-label">Kullanılan Kelime</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-value">${aktifOyuncular}</div>
                <div class="stat-label">Anlık Oyuncu</div>
            </div>
        </div>

        <div class="game-status">
            <h2>🎯 Oyun Durumu</h2>
            <div class="status-badge ${gameData.oyunAktif ? 'status-active' : 'status-inactive'}">
                ${gameData.oyunAktif ? '● AKTİF' : '● PASİF'}
            </div>
            ${gameData.oyunAktif ? `
                <p style="font-size: 1.2em; margin-top: 15px;">
                    <strong>Son Kelime:</strong> ${gameData.sonKelime || 'Yok'}<br>
                    <strong>Devam Harfi:</strong> <span style="font-size: 1.5em; color: #fbbf24;">${(gameData.sonHarf || '').toUpperCase()}</span>
                </p>
                ${anlikSkorlar.length > 0 ? `
                    <div style="margin-top: 20px;">
                        <h3 style="margin-bottom: 10px;">📊 Anlık Skorlar</h3>
                        ${anlikSkorlar.map(s => `
                            <div class="leader-item">
                                <span class="leader-name">${s.kullaniciAdi}</span>
                                <span class="leader-score">${s.kelimeSayisi} kelime</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            ` : '<p style="margin-top: 15px; opacity: 0.8;">Oyun başlatılmayı bekliyor...</p>'}
        </div>

        <div class="leaderboard">
            <h2>🏆 Tüm Zamanlar Liderlik Tablosu</h2>
            ${liderler.length > 0 ? liderler.map((lider, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                return `
                    <div class="leader-item">
                        <span class="leader-rank">${medal}</span>
                        <span class="leader-name">${lider.kullaniciAdi}</span>
                        <div class="leader-stats">
                            ${lider.kazanilanOyunlar} zafer<br>
                            ${lider.toplamKelime} kelime
                        </div>
                        <span class="leader-score">${lider.toplamPuan}</span>
                    </div>
                `;
            }).join('') : '<div class="no-data">Henüz oyuncu verisi yok</div>'}
        </div>

        <div class="refresh-info">
            ⟳ Sayfa otomatik olarak 30 saniyede bir yenilenir<br>
            Son güncelleme: ${new Date().toLocaleString('tr-TR')}
        </div>
    </div>
</body>
</html>
        `;
        
        res.send(html);
    } catch (error) {
        console.error('Dashboard hatası:', error);
        res.status(500).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a1a; color: #fff;">
                    <h1>❌ Hata</h1>
                    <p>Dashboard yüklenirken bir hata oluştu.</p>
                    <p style="color: #ff6b6b;">${error.message}</p>
                </body>
            </html>
        `);
    }
});

// API endpoint - JSON veri
app.get('/api/stats', (req, res) => {
    try {
        const gameData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        res.json({
            oyunAktif: gameData.oyunAktif,
            sonKelime: gameData.sonKelime,
            sonHarf: gameData.sonHarf,
            toplamOyuncu: Object.keys(gameData.puanTablosu || {}).length,
            toplamKelime: gameData.kullanilanKelimeler?.length || 0,
            aktifOyuncular: Object.keys(gameData.oyuncular || {}).length,
            sunucuSayisi: client.guilds?.cache.size || 0,
            liderler: Object.entries(gameData.puanTablosu || {})
                .map(([userId, stats]) => ({
                    kullaniciAdi: stats.kullaniciAdi,
                    toplamPuan: stats.toplamPuan,
                    kazanilanOyunlar: stats.kazanilanOyunlar
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
