const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// Запускаем keep-alive сервер для Replit
if (process.env.REPLIT) {
  require('./keep-alive');
}

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Хранилище активных тикетов
const activeTickets = new Map();

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
    if (interaction.customId === 'rating_select') {
      await handleRatingSelect(interaction);
    } else {
      await handleSelectMenu(interaction);
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'close_ticket_modal') {
      await handleCloseModal(interaction);
    } else {
      await handleModalSubmit(interaction);
    }
  } else if (interaction.isButton()) {
    await handleButton(interaction);
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
  
  // Проверяем количество активных тикетов
  const userTickets = Array.from(activeTickets.values()).filter(t => t.userId === interaction.user.id && !t.closed);
  
  const ticketChannel = await guild.channels.create({
    name: `${categoryId}-${interaction.user.username}`,
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
    .setAuthor({ 
      name: `Тикет (${category.name})`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setDescription(`Спасибо за обращение.\n${category.id === 'unban' ? 'Вашу заявку на разбан скоро рассмотрят.' : category.id === 'questions' ? 'Опишите вашу проблему или предложение и ожидайте ответа.' : 'Ваша заявка будет рассмотрена в ближайшее время.'}`)
    .setColor('#5865F2')
    .setTimestamp();

  if (category.icon) {
    embed.setThumbnail(category.icon);
  }

  embed.addFields({ name: 'Взял в работу', value: 'Этот тикет ещё никто не взял в работу!', inline: false });

  category.fields.forEach((field, index) => {
    const value = interaction.fields.getTextInputValue(`field_${index}`);
    embed.addFields({ name: `❓ ${field.label}`, value: value || 'Не указано' });
  });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Закрыть тикет')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('claim_ticket')
      .setLabel('Взять в работу')
      .setEmoji('👋')
      .setStyle(ButtonStyle.Success)
  );

  const ticketMessage = await ticketChannel.send({ embeds: [embed], components: [buttons] });

  // Сохраняем информацию о тикете
  activeTickets.set(ticketChannel.id, {
    userId: interaction.user.id,
    categoryId: categoryId,
    categoryName: category.name,
    messageId: ticketMessage.id,
    claimedBy: null,
    closed: false,
    createdAt: Date.now()
  });

  // Предупреждение о большом количестве тикетов
  if (userTickets.length >= 2) {
    const warningEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('⚠️ Обнаружено много активных тикетов!')
      .setDescription('В связи с большим количеством открытых обращений, время ответа может быть увеличено.\n\nБлагодарим за терпение! Мы поможем вам в ближайшее время.\nСпасибо за понимание.')
      .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    
    await ticketChannel.send({ embeds: [warningEmbed] });
  }

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

async function handleButton(interaction) {
  const ticketData = activeTickets.get(interaction.channel.id);
  
  if (!ticketData) {
    return interaction.reply({ content: '❌ Данные тикета не найдены.', ephemeral: true });
  }

  if (interaction.customId === 'claim_ticket') {
    if (ticketData.claimedBy) {
      return interaction.reply({ content: '❌ Этот тикет уже взят в работу!', ephemeral: true });
    }

    ticketData.claimedBy = interaction.user.id;
    activeTickets.set(interaction.channel.id, ticketData);

    const message = await interaction.channel.messages.fetch(ticketData.messageId);
    const embed = message.embeds[0];
    
    const newEmbed = EmbedBuilder.from(embed);
    const fields = newEmbed.data.fields;
    const workField = fields.find(f => f.name === 'Взял в работу');
    if (workField) {
      workField.value = `<@${interaction.user.id}> взял тикет в работу!`;
    }

    await message.edit({ embeds: [newEmbed] });
    await interaction.reply({ content: `✅ Вы взяли тикет в работу!`, ephemeral: false });

  } else if (interaction.customId === 'close_ticket') {
    const modal = new ModalBuilder()
      .setCustomId('close_ticket_modal')
      .setTitle('Закрытие тикета');

    const reasonInput = new TextInputBuilder()
      .setCustomId('close_reason')
      .setLabel('Причина закрытия')
      .setPlaceholder('Укажите причину закрытия тикета')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
    await interaction.showModal(modal);
  }
}

async function handleRatingSelect(interaction) {
  const rating = interaction.values[0];
  await interaction.reply({ content: `✅ Спасибо за оценку: ${rating} ⭐`, ephemeral: false });
  await interaction.message.edit({ components: [] });
}

async function handleCloseModal(interaction) {
  const ticketData = activeTickets.get(interaction.channel.id);
  if (!ticketData) {
    return interaction.reply({ content: '❌ Данные тикета не найдены.', ephemeral: true });
  }

  const reason = interaction.fields.getTextInputValue('close_reason');
  
  ticketData.closed = true;
  ticketData.closeReason = reason;
  ticketData.closedBy = interaction.user.id;
  ticketData.closedAt = Date.now();
  activeTickets.set(interaction.channel.id, ticketData);

  const closeEmbed = new EmbedBuilder()
    .setTitle('Тикет закрыт')
    .setDescription(`Ваш тикет закрыт через час на сервере BURP RUST | Сервера Rust\nПричина: ${reason}`)
    .setColor('#5865F2')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  closeEmbed.addFields(
    { name: '📋 Детали тикета', value: `Категория: ${ticketData.categoryName}\nПричина закрытия: ${reason}\nЗакрыто: <@${interaction.user.id}> ${interaction.user.username}.\nВзял в работу: ${ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : 'Не взят в работу'}\nВсего сообщений: ${interaction.channel.messages.cache.size}`, inline: false }
  );

  const ratingMenu = new StringSelectMenuBuilder()
    .setCustomId('rating_select')
    .setPlaceholder('Выберите отзыв...')
    .addOptions([
      { label: '5 Star', value: '5', emoji: '⭐' },
      { label: '4 Star', value: '4', emoji: '⭐' },
      { label: '3 Star', value: '3', emoji: '⭐' },
      { label: '2 Star', value: '2', emoji: '⭐' },
      { label: '1 Star', value: '1', emoji: '⭐' }
    ]);

  const row = new ActionRowBuilder().addComponents(ratingMenu);

  await interaction.reply({ embeds: [closeEmbed], components: [row] });

  // Закрываем канал через 1 час
  setTimeout(async () => {
    try {
      await interaction.channel.delete();
      activeTickets.delete(interaction.channel.id);
    } catch (error) {
      console.error('Ошибка при удалении канала:', error);
    }
  }, 3600000); // 1 час
}
}

client.login(process.env.DISCORD_TOKEN);

module.exports = { sendTicketPanel };
