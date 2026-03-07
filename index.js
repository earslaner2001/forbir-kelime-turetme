// index.js - Förbır - Kelime Türetme Bot
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

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
client.once('ready', () => {
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
