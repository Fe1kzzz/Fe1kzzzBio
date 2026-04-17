const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log(`✅ Бот подключен как ${client.user.tag}`);
  
  const channelId = process.env.TICKET_CHANNEL_ID;
  
  if (!channelId) {
    console.error('❌ TICKET_CHANNEL_ID не указан в переменных окружения!');
    process.exit(1);
  }

  try {
    const channel = await client.channels.fetch(channelId);
    
    const embed = new EmbedBuilder()
      .setTitle('Система поддержки')
      .setDescription('Если вам нужна помощь, нажмите на кнопку, соответствующую типу тикета, который вы хотите открыть.')
      .setImage('https://i.imgur.com/placeholder.png')
      .setColor('#5865F2')
      .setFooter({ text: 'Система поддержки Burp Rust' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Выберите категорию...');

    config.categories.forEach(cat => {
      selectMenu.addOptions({
        label: cat.name,
        description: cat.description,
        value: cat.id,
        emoji: cat.emoji
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await channel.send({ embeds: [embed], components: [row] });
    
    console.log('✅ Панель тикетов успешно отправлена в канал!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при отправке панели:', error);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
