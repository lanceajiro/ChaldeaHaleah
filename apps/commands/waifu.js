import axios from 'axios';

export const meta = {
  name: "waifu",
  aliases: ["waifupic", "waifuphoto"],
  prefix: "both",
  version: "1.0.0",
  author: "ShawnDesu",
  description: "Sends a random waifu photo. Optionally, specify a tag. Use '/waifu categories' to see available tags.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "anime"
};

const availableCategories = [
  "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo", "kiss",
  "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold",
  "nom", "bite", "glomp", "slap", "kill", "kick", "happy", "wink", "poke", "dance", "cringe"
];

async function fetchWaifu(category = "waifu") {
  const apiUrl = `https://api.waifu.pics/sfw/${category}`;
  const response = await axios.get(apiUrl);
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  return response.data.url;
}

export async function onStart({ bot, msg, chatId, response }) {
  try {
    const args = msg.text.trim().split(/\s+/).slice(1);
    if (args[0] === "categories" || args[0] === "help") {
      const categoriesList = availableCategories.join(", ");
      return response.reply(`Available categories: ${categoriesList}`);
    }

    const category = (args[0] || "waifu").toLowerCase();
    if (!availableCategories.includes(category)) {
      return response.reply(`Invalid category "${category}". Use /waifu categories to see available options.`);
    }

    const url = await fetchWaifu(category);
    const caption = category.charAt(0).toUpperCase() + category.slice(1);
    const inlineKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "waifu",
            category: category,
            args: ["refresh"]
          }),
        },
      ],
    ];

    let sentMessage;
    try {
      sentMessage = await response.photo(url, {
        caption: caption,
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
    } catch (err) {
      return response.reply("Error sending waifu photo.");
    }

  } catch (error) {
    return response.reply(`An error occurred: ${error.message}`);
  }
}

async function onCallback({ bot, callbackQuery, chatId, messageId, payload }) {
  try {
    if (payload.command !== "waifu") return;

    const category = payload.category;
    const url = await fetchWaifu(category);
    const caption = category.charAt(0).toUpperCase() + category.slice(1);
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "waifu",
            category: category,
            args: ["refresh"]
          }),
        },
      ],
    ];

    await bot.editMessageMedia(
      {
        type: "photo",
        media: url,
        caption: caption
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: updatedKeyboard }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: `An error occurred: ${err.message}` });
    } catch (innerErr) {
      // Silently fail if callback answer fails
    }
  }
}

export { onCallback };