// commands/kelime-oyunu.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { oyunuSifirla, durumGetir, kanalBelirle, kanalSifirla, puanTablosuGetir, puanTablosuSifirla } = require('../games/sozcukturetme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kelime-oyunu')
        .setDescription('📝 Kelime türetme oyunu yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('durum')
                .setDescription('Mevcut oyun durumunu gösterir'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sifirla')
                .setDescription('Kelime türetme oyununu sıfırlar (Sadece yöneticiler)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kanal-belirle')
                .setDescription('Oyunun oynanacağı kanalı belirler (Sadece yöneticiler)')
                .addChannelOption(option =>
                    option
                        .setName('kanal')
                        .setDescription('Oyun kanalı')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kanal-sifirla')
                .setDescription('Oyun kanalı ayarını sıfırlar (tüm kanallarda oynanabilir) (Sadece yöneticiler)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('puan-tablosu')
                .setDescription('🏆 Tüm zamanlar puan tablosunu görüntüler'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('puan-tablosu-sifirla')
                .setDescription('Puan tablosunu sıfırlar (Sadece yöneticiler)')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'durum') {
            const durum = durumGetir();

            const embed = new EmbedBuilder()
                .setTitle('📝 Kelime Türetme Oyunu - Durum')
                .setColor('#00FF00')
                .setTimestamp();

            if (!durum.sonKelime) {
                embed.setDescription('🎯 Oyun henüz başlamadı! İlk kelimeyi yazmak için herhangi bir kelime yazın.');
            } else {
                embed.addFields(
                    { name: '📖 Son Kelime', value: `**${durum.sonKelime}**`, inline: true },
                    { name: '🔤 Sonraki Harf', value: `**${durum.sonHarf.toUpperCase()}**`, inline: true },
                    { name: '👤 Son Yazan', value: `<@${durum.sonKullaniciID}>`, inline: true }
                );
                
                // Oyuncuları göster
                if (durum.oyuncular && Object.keys(durum.oyuncular).length > 0) {
                    const oyuncuListesi = Object.entries(durum.oyuncular)
                        .map(([userId, stats]) => `<@${userId}>: **${stats.kelimeSayisi}** kelime`)
                        .join('\n');
                    embed.addFields({ name: '📊 Mevcut Skorlar', value: oyuncuListesi });
                }
                
                embed.setDescription('✨ Oyun devam ediyor! Sonraki kelimeyi yazmak için yukarıdaki harfle başlayan bir kelime yazın.');
            }

            if (durum.kanalID) {
                embed.addFields({ name: '📍 Oyun Kanalı', value: `<#${durum.kanalID}>`, inline: false });
            } else {
                embed.addFields({ name: '📍 Oyun Kanalı', value: 'Tüm kanallar', inline: false });
            }

            embed.setFooter({ text: '💡 Kurallar: Son harfle başla, TDK\'da olmalı, aynı kişi üst üste yazamaz' });

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'sifirla') {
            // Sadece yöneticiler sıfırlayabilir
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmanız gerekiyor!',
                    ephemeral: true
                });
            }

            const result = oyunuSifirla();

            const embed = new EmbedBuilder()
                .setTitle('🔄 Kelime Türetme Oyunu Sıfırlandı')
                .setDescription(result.message + '\n\n🎯 Yeni bir oyun başlatmak için herhangi bir kelime yazabilirsiniz!')
                .setColor('#FF9900')
                .setTimestamp()
                .setFooter({ text: `Sıfırlayan: ${interaction.user.tag}` });

            await interaction.reply({ embeds: [embed] });
            
        } else if (subcommand === 'kanal-belirle') {
            // Sadece yöneticiler belirleyebilir
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmanız gerekiyor!',
                    ephemeral: true
                });
            }

            const kanal = interaction.options.getChannel('kanal');
            const result = kanalBelirle(kanal.id);

            const embed = new EmbedBuilder()
                .setTitle('📍 Oyun Kanalı Belirlendi')
                .setDescription(`${result.message}\n\n✅ Artık kelime türetme oyunu sadece bu kanalda oynanabilir.`)
                .setColor('#00FF00')
                .setTimestamp()
                .setFooter({ text: `Ayarlayan: ${interaction.user.tag}` });

            await interaction.reply({ embeds: [embed] });
            
        } else if (subcommand === 'kanal-sifirla') {
            // Sadece yöneticiler sıfırlayabilir
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmanız gerekiyor!',
                    ephemeral: true
                });
            }

            const result = kanalSifirla();

            const embed = new EmbedBuilder()
                .setTitle('🔄 Oyun Kanalı Sıfırlandı')
                .setDescription(result.message)
                .setColor('#FF9900')
                .setTimestamp()
                .setFooter({ text: `Sıfırlayan: ${interaction.user.tag}` });

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'puan-tablosu') {
            const puanTablosu = puanTablosuGetir();

            const embed = new EmbedBuilder()
                .setTitle('🏆 Kelime Türetme - Tüm Zamanlar Puan Tablosu')
                .setColor('#FFD700')
                .setTimestamp();

            if (puanTablosu.length === 0) {
                embed.setDescription('📊 Henüz puan tablosunda kimse yok! İlk oyunu tamamlayın.');
            } else {
                let tabloMetni = '';
                puanTablosu.slice(0, 10).forEach((oyuncu, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    tabloMetni += `${medal} **${oyuncu.kullaniciAdi}**\n`;
                    tabloMetni += `   ├─ Toplam Puan: **${oyuncu.toplamPuan}**\n`;
                    tabloMetni += `   ├─ Kazanma: **${oyuncu.kazanilanOyunlar}** oyun\n`;
                    tabloMetni += `   └─ Toplam Kelime: **${oyuncu.toplamKelime}**\n\n`;
                });
                
                embed.setDescription(tabloMetni);
                embed.setFooter({ text: `Toplam ${puanTablosu.length} oyuncu` });
            }

            await interaction.reply({ embeds: [embed] });
            
        } else if (subcommand === 'puan-tablosu-sifirla') {
            // Sadece yöneticiler sıfırlayabilir
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmanız gerekiyor!',
                    ephemeral: true
                });
            }

            const result = puanTablosuSifirla();

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Puan Tablosu Sıfırlandı')
                .setDescription(result.message + '\n\n⚠️ Tüm oyuncu puanları sıfırlandı!')
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: `Sıfırlayan: ${interaction.user.tag}` });

            await interaction.reply({ embeds: [embed] });
        }
    }
};
