// deploy-commands.js - Slash Komutları Kaydet
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if (command?.data?.toJSON) {
        commands.push(command.data.toJSON());
        console.log(`✅ Komut hazırlandı: ${command.data.name}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🔄 ${commands.length} slash komut kaydediliyor...`);

        // Global veya guild-specific komut kaydı
        if (process.env.GUILD_ID) {
            // Tek sunucuya kaydet (test için hızlı)
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log(`✅ Komutlar ${process.env.GUILD_ID} sunucusuna kaydedildi!`);
        } else {
            // Global olarak kaydet (tüm sunuculara, 1 saat sürer)
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log('✅ Komutlar global olarak kaydedildi!');
        }
    } catch (error) {
        console.error('❌ Komut kaydı hatası:', error);
    }
})();
