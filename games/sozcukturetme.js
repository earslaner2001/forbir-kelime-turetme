// games/sozcukturetme.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/sozcuk_data.json');

/**
 * Veri dosyasını yükle veya oluştur
 */
function loadData() {
    if (!fs.existsSync(dataPath)) {
        const defaultData = {
            sonKelime: null,
            sonHarf: null,
            sonKullaniciID: null,
            oyunAktif: false,
            oyuncular: {},
            kanalID: null
        };
        fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Eski veri yapısını güncelle
    if (!data.hasOwnProperty('oyunAktif')) data.oyunAktif = false;
    if (!data.hasOwnProperty('oyuncular')) data.oyuncular = {};
    if (!data.hasOwnProperty('kanalID')) data.kanalID = null;
    
    return data;
}

/**
 * Veri dosyasını kaydet
 */
function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

/**
 * TDK API'sinden kelime kontrolü yap
 * @param {string} kelime - Kontrol edilecek kelime
 * @returns {Promise<boolean>} - Kelime geçerliyse true, değilse false
 */
async function tdkKelimeKontrol(kelime) {
    try {
        // Türkçe karakterleri encode etmek için encodeURIComponent kullanıyoruz
        const encodedKelime = encodeURIComponent(kelime.toLocaleLowerCase('tr-TR'));
        const url = `https://sozluk.gov.tr/gts?ara=${encodedKelime}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 5000 // 5 saniye timeout
        });

        // TDK API'si başarılı sonuç döndüğünde array döner, bulunamazsa "error" döner
        if (Array.isArray(response.data) && response.data.length > 0) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('TDK API hatası:', error.message);
        // API hatası durumunda false döndür
        return false;
    }
}

/**
 * Kelimenin son harfini al (Türkçe karakter desteği ile)
 * @param {string} kelime 
 * @returns {string} - Son harf
 */
function sonHarfAl(kelime) {
    return kelime.charAt(kelime.length - 1).toLocaleLowerCase('tr-TR');
}

/**
 * Kelimenin ilk harfini al (Türkçe karakter desteği ile)
 * @param {string} kelime 
 * @returns {string} - İlk harf
 */
function ilkHarfAl(kelime) {
    return kelime.charAt(0).toLocaleLowerCase('tr-TR');
}

/**
 * Hata mesajı gönder ve 5 saniye sonra sil
 * @param {Message} message - Discord mesajı
 * @param {string} hataMesaji - Gönderilecek hata mesajı
 */
async function hataGonder(message, hataMesaji) {
    try {
        const yanit = await message.reply(hataMesaji);
        setTimeout(async () => {
            try {
                await yanit.delete();
            } catch (err) {
                // Mesaj zaten silinmişse hata vermemesi için
                console.log('Mesaj silinemedi (zaten silinmiş olabilir)');
            }
        }, 5000);
    } catch (error) {
        console.error('Hata mesajı gönderilemedi:', error.message);
    }
}

/**
 * Türkçede devam edilebilir harf mi kontrol et
 * @param {string} harf 
 * @returns {boolean}
 */
function devamEdilirHarf(harf) {
    // Türkçede kelime başında kullanılabilen harfler
    const devamEdilebilirHarfler = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'ı', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'ö', 'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z', 'ç'];
    return devamEdilebilirHarfler.includes(harf.toLocaleLowerCase('tr-TR'));
}

/**
 * Oyunu bitir ve puanları dağıt
 * @param {Message} message - Discord mesajı
 * @param {object} data - Oyun verisi
 * @param {string} sebep - Oyun bitiş sebebi
 */
async function oyunuBitir(message, data, sebep) {
    // Son kelimeyi yazan oyuncu puan alır
    if (!data.oyuncular[message.author.id]) {
        data.oyuncular[message.author.id] = {
            kelimeSayisi: 1,
            kullaniciAdi: message.author.username
        };
    } else {
        data.oyuncular[message.author.id].kelimeSayisi += 1;
    }
    
    // Sıralama yap
    const sirali = Object.entries(data.oyuncular)
        .map(([userId, stats]) => ({
            userId,
            kelimeSayisi: stats.kelimeSayisi,
            kullaniciAdi: stats.kullaniciAdi
        }))
        .sort((a, b) => b.kelimeSayisi - a.kelimeSayisi);
    
    // Embed oluştur
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
        .setTitle('🏆 Kelime Türetme Oyunu Sona Erdi!')
        .setColor('#FFD700')
        .setDescription(`**Bitiş Sebebi:** ${sebep}\n\n📊 **Final Skorları:**`)
        .setTimestamp();
    
    let skorTablosu = '';
    sirali.forEach((oyuncu, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        skorTablosu += `${medal} **${oyuncu.kullaniciAdi}**: ${oyuncu.kelimeSayisi} kelime\n`;
    });
    
    embed.addFields({ name: '🎯 Sıralama', value: skorTablosu || 'Hiç kelime yazılmadı' });
    embed.setFooter({ text: `Kazanan: ${sirali[0]?.kullaniciAdi || 'Belirsiz'} 🎊` });
    
    await message.channel.send({ embeds: [embed] });
    
    // Oyunu sıfırla
    data.sonKelime = null;
    data.sonHarf = null;
    data.sonKullaniciID = null;
    data.oyunAktif = false;
    data.oyuncular = {};
    saveData(data);
}

/**
 * Kelime türetme oyunu ana fonksiyonu
 * @param {Message} message - Discord mesajı
 * @returns {Promise<boolean>} - İşlem başarılıysa true
 */
async function kelimeTuretmeOyunu(message) {
    // Bot mesajlarını ve boş mesajları yok say
    if (message.author.bot) return false;
    
    const kelime = message.content.trim().toLocaleLowerCase('tr-TR');
    
    // Boş veya çok kısa kelimeler
    if (!kelime || kelime.length < 2) return false;

    // Sadece harf içermeyen mesajları yoksay
    const turkceHarfler = /^[a-zçğıöşü]+$/i;
    if (!turkceHarfler.test(kelime)) return false;

    // Veriyi yükle
    const data = loadData();

    // İlk kelime mi?
    if (!data.sonKelime) {
        // İlk kelimeyi kontrol et
        const tdkGecerli = await tdkKelimeKontrol(kelime);
        
        if (!tdkGecerli) {
            await hataGonder(message, `❌ **"${kelime}"** TDK'da bulunamadı! Geçerli bir Türkçe kelime yazın.`);
            return false;
        }

        const sonHarf = sonHarfAl(kelime);
        
        // Devam edilemez harfle bitiyorsa oyunu başlatma
        if (!devamEdilirHarf(sonHarf)) {
            await hataGonder(message, `❌ **"${kelime}"** kelimesi **${sonHarf.toUpperCase()}** ile bitiyor! Bu harfle devam edilemez.`);
            return false;
        }

        // İlk kelimeyi kaydet ve oyunu başlat
        data.sonKelime = kelime;
        data.sonHarf = sonHarf;
        data.sonKullaniciID = message.author.id;
        data.oyunAktif = true;
        data.oyuncular[message.author.id] = {
            kelimeSayisi: 1,
            kullaniciAdi: message.author.username
        };
        saveData(data);

        await message.react('✅');
        await message.reply(`🎯 Kelime türetme oyunu başladı! Son harf: **${sonHarf.toUpperCase()}**`);
        return true;
    }

    // Aynı kişi üst üste yazamaz
    if (data.sonKullaniciID === message.author.id) {
        await hataGonder(message, `❌ Aynı kişi üst üste kelime yazamaz! Başka birinin kelime yazmasını bekleyin.`);
        return false;
    }

    // Son harfle başlamalı
    const ilkHarf = ilkHarfAl(kelime);
    if (ilkHarf !== data.sonHarf) {
        await hataGonder(message, `❌ Kelime **${data.sonHarf.toUpperCase()}** harfi ile başlamalı! (Yazdığınız: **${kelime}**)`);
        return false;
    }

    // TDK kontrolü
    const tdkGecerli = await tdkKelimeKontrol(kelime);
    if (!tdkGecerli) {
        await hataGonder(message, `❌ **"${kelime}"** TDK'da bulunamadı! Geçerli bir Türkçe kelime yazın.`);
        return false;
    }

    // Yeni son harfi al
    const yeniSonHarf = sonHarfAl(kelime);
    
    // Devam edilemez harfle bitiyorsa oyunu bitir
    if (!devamEdilirHarf(yeniSonHarf)) {
        await message.react('🏆');
        await oyunuBitir(message, data, `**${message.author.username}** tarafından yazılan **"${kelime}"** kelimesi **${yeniSonHarf.toUpperCase()}** harfi ile bitiyor ve bu harfle devam edilemez!`);
        return true;
    }

    // Kelimeyi kaydet ve oyuncuya puan ekle
    data.sonKelime = kelime;
    data.sonHarf = yeniSonHarf;
    data.sonKullaniciID = message.author.id;
    
    if (!data.oyuncular[message.author.id]) {
        data.oyuncular[message.author.id] = {
            kelimeSayisi: 1,
            kullaniciAdi: message.author.username
        };
    } else {
        data.oyuncular[message.author.id].kelimeSayisi += 1;
    }
    
    saveData(data);

    await message.react('✅');
    await message.reply(`✨ Doğru kelime! Puanın: **${data.oyuncular[message.author.id].kelimeSayisi}** | Son harf: **${yeniSonHarf.toUpperCase()}**`);
    return true;
}

/**
 * Kelime türetme oyununu sıfırla
 * @returns {object} - Sıfırlama sonucu
 */
function oyunuSifirla() {
    const data = loadData();
    data.sonKelime = null;
    data.sonHarf = null;
    data.sonKullaniciID = null;
    data.oyunAktif = false;
    data.oyuncular = {};
    // kanalID'yi sıfırlamıyoruz, ayar korunmalı
    saveData(data);
    return { success: true, message: 'Kelime türetme oyunu sıfırlandı!' };
}

/**
 * Oyun kanalını belirle
 * @param {string} kanalID - Kanal ID
 * @returns {object} - Sonuç
 */
function kanalBelirle(kanalID) {
    const data = loadData();
    data.kanalID = kanalID;
    saveData(data);
    return { success: true, message: `Oyun kanalı belirlendi: <#${kanalID}>` };
}

/**
 * Oyun kanalını sıfırla (tüm kanallarda oynanabilir)
 * @returns {object} - Sonuç
 */
function kanalSifirla() {
    const data = loadData();
    data.kanalID = null;
    saveData(data);
    return { success: true, message: 'Oyun kanalı sıfırlandı! Artık tüm kanallarda oynanabilir.' };
}

/**
 * Mevcut oyun durumunu getir
 * @returns {object} - Oyun durumu
 */
function durumGetir() {
    return loadData();
}

module.exports = {
    kelimeTuretmeOyunu,
    oyunuSifirla,
    durumGetir,
    tdkKelimeKontrol,
    kanalBelirle,
    kanalSifirla
};
