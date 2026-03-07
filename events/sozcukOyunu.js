// events/sozcukOyunu.js
const { kelimeTuretmeOyunu, durumGetir } = require('../games/sozcukturetme');

/**
 * Kelime Türetme Oyunu Event Handler
 * 
 * KULLANIM:
 * - Bu event handler tüm mesajları dinler ve kelime türetme oyununu yönetir
 * - Oyun kanalı /kelime-oyunu kanal-belirle komutu ile ayarlanır
 * - Belirli bir kanal ayarlanmamışsa tüm kanallarda oynanabilir
 */

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        // Bot mesajlarını yok say
        if (message.author.bot) return;
        
        // Sunucu dışı mesajları yok say
        if (!message.guild) return;

        // Slash command'lar ve özel komutlar için yok say
        if (message.content.startsWith('/') || message.content.startsWith('!')) {
            return;
        }

        // Oyun kanalı kontrolü
        const durum = durumGetir();
        if (durum.kanalID && message.channel.id !== durum.kanalID) {
            // Farklı bir kanalda ise yok say
            return;
        }

        // Kelime türetme oyununu çalıştır
        try {
            await kelimeTuretmeOyunu(message);
        } catch (error) {
            console.error('Kelime türetme oyunu hatası:', error);
        }
    });

    console.log('✅ Kelime Türetme Oyunu event handler yüklendi.');
};
