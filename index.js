const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// Запускаем keep-alive сервер для Replit
if (process.env.REPLIT) {
  require('./keep-alive');
}

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Бот запущен как ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction);
  } else if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction);
  }
});

async function handleSelectMenu(interaction) {
  const categoryId = interaction.values[0];
  const category = config.categories.find(c => c.id === categoryId);
  
  if (!category) return;

  const modal = new ModalBuilder()
    .setCustomId(`ticket_${categoryId}`)
    .setTitle(category.name);

  category.fields.forEach((field, index) => {
    const textInput = new TextInputBuilder()
      .setCustomId(`field_${index}`)
      .setLabel(field.label)
      .setPlaceholder(field.placeholder)
      .setRequired(field.required)
      .setStyle(field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short);
    
    modal.addComponents(new ActionRowBuilder().addComponents(textInput));
  });

  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction) {
  const categoryId = interaction.customId.replace('ticket_', '');
  const category = config.categories.find(c => c.id === categoryId);
  
  if (!category) return;

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const ticketChannel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }
    ]
  });

  const embed = new EmbedBuilder()
    .setTitle(category.name)
    .setDescription(`**Система поддержки Burp Rust**\n\n⚠️ Эта форма получена приложением Burp Tickets. Не указывайте свои пароли и прочую конфиденциальную информацию.`)
    .setColor('#5865F2')
    .setTimestamp();

  if (category.icon) {
    embed.setThumbnail(category.icon);
  }

  category.fields.forEach((field, index) => {
    const value = interaction.fields.getTextInputValue(`field_${index}`);
    embed.addFields({ name: field.label, value: value || 'Не указано' });
  });

  await ticketChannel.send({ embeds: [embed] });
  await ticketChannel.send(`<@${interaction.user.id}> ваш тикет создан!`);

  await interaction.editReply({
    content: `✅ Тикет создан: ${ticketChannel}`,
    ephemeral: true
  });
}

async function sendTicketPanel(channelId) {
  const channel = await client.channels.fetch(channelId);
  
  const embed = new EmbedBuilder()
    .setTitle('Система поддержки')
    .setDescription('Если вам нужна помощь, нажмите на кнопку, соответствующую типу тикета, который вы хотите открыть.')
    .setImage('https://i.imgur.com/your-tickets-banner.png')
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
}

client.login(process.env.DISCORD_TOKEN);

module.exports = { sendTicketPanel };
