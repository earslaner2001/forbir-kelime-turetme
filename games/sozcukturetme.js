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
            kanalID: null,
            kullanilanKelimeler: [],
            puanTablosu: {}
        };
        fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Eski veri yapısını güncelle
    if (!data.hasOwnProperty('oyunAktif')) data.oyunAktif = false;
    if (!data.hasOwnProperty('oyuncular')) data.oyuncular = {};
    if (!data.hasOwnProperty('kanalID')) data.kanalID = null;
    if (!data.hasOwnProperty('kullanilanKelimeler')) data.kullanilanKelimeler = [];
    if (!data.hasOwnProperty('puanTablosu')) data.puanTablosu = {};
    
    return data;
}

/**
 * Veri dosyasını kaydet
 */
function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

/**
 * TDK API'sinden kelime kontrolü yap (retry mekanizması ile)
 * @param {string} kelime - Kontrol edilecek kelime
 * @returns {Promise<boolean>} - Kelime geçerliyse true, değilse false
 */
async function tdkKelimeKontrol(kelime) {
    const maxRetries = 2;
    const kelimeLower = kelime.toLocaleLowerCase('tr-TR');
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const encodedKelime = encodeURIComponent(kelimeLower);
            const url = `https://sozluk.gov.tr/gts?ara=${encodedKelime}`;
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'tr-TR,tr;q=0.9'
                },
                timeout: 8000, // 8 saniye timeout
                validateStatus: (status) => status === 200
            });

            // TDK API'si başarılı sonuç döndüğünde array döner
            if (Array.isArray(response.data) && response.data.length > 0) {
                return true;
            }
            return false;
            
        } catch (error) {
            // Son denemeyse hatayı logla ve false dön
            if (attempt === maxRetries) {
                console.error(`TDK API hatası (${maxRetries + 1} deneme sonrası): ${error.message}`);
                return false;
            }
            
            // Yeniden denemeden önce kısa bir bekleme
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
    }
    
    return false;
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
                // Mesaj zaten silinmişse hata vermemesi için (kod 10008: Unknown Message)
                if (err.code !== 10008) {
                    console.log('Mesaj silinemedi:', err.message);
                }
            }
        }, 5000);
    } catch (error) {
        // Yanıt gönderilemiyorsa (mesaj silinmiş veya kanal erişilemez)
        if (error.code !== 10008) {
            console.error('Hata mesajı gönderilemedi:', error.message);
        }
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
    
    // Puanları kalıcı tabloya kaydet
    for (const [userId, stats] of Object.entries(data.oyuncular)) {
        if (!data.puanTablosu[userId]) {
            data.puanTablosu[userId] = {
                toplamPuan: 0,
                kazanilanOyunlar: 0,
                toplamKelime: 0,
                kullaniciAdi: stats.kullaniciAdi
            };
        }
        data.puanTablosu[userId].toplamPuan += stats.kelimeSayisi;
        data.puanTablosu[userId].toplamKelime += stats.kelimeSayisi;
        data.puanTablosu[userId].kullaniciAdi = stats.kullaniciAdi; // İsim güncellemesi için
    }
    
    // Kazananın istatistiklerini güncelle
    const kazananId = Object.entries(data.oyuncular)
        .sort(([, a], [, b]) => b.kelimeSayisi - a.kelimeSayisi)[0]?.[0];
    if (kazananId && data.puanTablosu[kazananId]) {
        data.puanTablosu[kazananId].kazanilanOyunlar += 1;
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
    
    embed.addFields({ name: '🎯 Bu Tur Sıralaması', value: skorTablosu || 'Hiç kelime yazılmadı' });
    
    // Toplam puanları göster
    let toplamPuanTablosu = '';
    const toplamSirali = Object.entries(data.puanTablosu)
        .map(([userId, stats]) => ({
            userId,
            toplamPuan: stats.toplamPuan,
            kullaniciAdi: stats.kullaniciAdi,
            kazanilanOyunlar: stats.kazanilanOyunlar
        }))
        .sort((a, b) => b.toplamPuan - a.toplamPuan)
        .slice(0, 5);
    
    toplamSirali.forEach((oyuncu, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        toplamPuanTablosu += `${medal} **${oyuncu.kullaniciAdi}**: ${oyuncu.toplamPuan} puan (${oyuncu.kazanilanOyunlar} zafer)\n`;
    });
    
    if (toplamPuanTablosu) {
        embed.addFields({ name: '🏆 Tüm Zamanlar Liderlik Tablosu', value: toplamPuanTablosu });
    }
    
    embed.setFooter({ text: `Bu Turu Kazanan: ${sirali[0]?.kullaniciAdi || 'Belirsiz'} 🎊` });
    
    try {
        await message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Oyun sonu mesajı gönderilemedi:', error.message);
    }
    
    // Oyunu sıfırla
    data.sonKelime = null;
    data.sonHarf = null;
    data.sonKullaniciID = null;
    data.oyunAktif = false;
    data.oyuncular = {};
    data.kullanilanKelimeler = [];
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

        // Daha önce kullanılmış mı kontrol et
        if (data.kullanilanKelimeler.includes(kelime)) {
            await hataGonder(message, `❌ **"${kelime}"** kelimesi daha önce kullanıldı! Farklı bir kelime yazın.`);
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
        data.kullanilanKelimeler.push(kelime);
        data.oyuncular[message.author.id] = {
            kelimeSayisi: 1,
            kullaniciAdi: message.author.username
        };
        saveData(data);

        try {
            await message.react('✅');
        } catch (error) {
            // Mesaj silinmişse veya erisilemiryorsa sessizce devam et
            if (error.code !== 10008) {
                console.error('Reaksiyon eklenemedi:', error.message);
            }
        }
        
        try {
            await message.reply(`🎯 Kelime türetme oyunu başladı! Son harf: **${sonHarf.toUpperCase()}**`);
        } catch (error) {
            console.error('Yanıt gönderilemedi:', error.message);
        }
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

    // Daha önce kullanılmış mı kontrol et
    if (data.kullanilanKelimeler.includes(kelime)) {
        await hataGonder(message, `❌ **"${kelime}"** kelimesi daha önce kullanıldı! Farklı bir kelime yazın.`);
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
        // Son kelimeyi de kaydet
        data.kullanilanKelimeler.push(kelime);
        
        try {
            await message.react('🏆');
        } catch (error) {
            // Mesaj silinmişse veya erisilemiryorsa sessizce devam et
            if (error.code !== 10008) {
                console.error('Reaksiyon eklenemedi:', error.message);
            }
        }
        
        await oyunuBitir(message, data, `**${message.author.username}** tarafından yazılan **"${kelime}"** kelimesi **${yeniSonHarf.toUpperCase()}** harfi ile bitiyor ve bu harfle devam edilemez!`);
        return true;
    }

    // Kelimeyi kaydet ve oyuncuya puan ekle
    data.sonKelime = kelime;
    data.sonHarf = yeniSonHarf;
    data.sonKullaniciID = message.author.id;
    data.kullanilanKelimeler.push(kelime);
    
    if (!data.oyuncular[message.author.id]) {
        data.oyuncular[message.author.id] = {
            kelimeSayisi: 1,
            kullaniciAdi: message.author.username
        };
    } else {
        data.oyuncular[message.author.id].kelimeSayisi += 1;
    }
    
    saveData(data);

    try {
        await message.react('✅');
    } catch (error) {
        // Mesaj silinmişse veya erisilemiryorsa sessizce devam et
        if (error.code !== 10008) {
            console.error('Reaksiyon eklenemedi:', error.message);
        }
    }
    
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
    data.kullanilanKelimeler = [];
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

/**
 * Puan tablosunu getir
 * @returns {Array} - Sıralı puan tablosu
 */
function puanTablosuGetir() {
    const data = loadData();
    return Object.entries(data.puanTablosu)
        .map(([userId, stats]) => ({
            userId,
            toplamPuan: stats.toplamPuan,
            kazanilanOyunlar: stats.kazanilanOyunlar,
            toplamKelime: stats.toplamKelime,
            kullaniciAdi: stats.kullaniciAdi
        }))
        .sort((a, b) => b.toplamPuan - a.toplamPuan);
}

/**
 * Puan tablosunu sıfırla
 * @returns {object} - Sonuç
 */
function puanTablosuSifirla() {
    const data = loadData();
    data.puanTablosu = {};
    saveData(data);
    return { success: true, message: 'Puan tablosu sıfırlandı!' };
}

module.exports = {
    kelimeTuretmeOyunu,
    oyunuSifirla,
    durumGetir,
    tdkKelimeKontrol,
    kanalBelirle,
    kanalSifirla,
    puanTablosuGetir,
    puanTablosuSifirla
};
