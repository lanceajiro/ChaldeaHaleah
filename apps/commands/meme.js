import axios from 'axios';

export const meta = {
  name: "meme",
  aliases: ["memes", "randommeme"],
  prefix: "both",
  version: "1.0.0",
  author: "ShawnDesu",
  description: "Sends a random meme.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "fun"
};

async function fetchMeme() {
  const apiUrl = "https://meme-api.com/gimme/memes";
  const response = await axios.get(apiUrl);
  return response.data;
}

export async function onStart({ bot, msg, chatId, log, response }) {
  try {
    const meme = await fetchMeme();
    // Build inline keyboard with a refresh button (placeholder for message id)
    const inlineKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "meme",
            gameMessageId: null,
            args: ["refresh"]
          }),
        },
      ],
    ];

    let sentMessage;
    try {
      sentMessage = await response.photo(meme.url, {
        caption: meme.title,
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
    } catch (err) {
      console.error("Error sending photo: " + err);
      return response.reply("Error sending meme.");
    }

    // Update inline keyboard with actual message id
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "meme",
            gameMessageId: sentMessage.message_id,
            args: ["refresh"]
          }),
        },
      ],
    ];

    try {
      await response.editMarkup(sentMessage, { inline_keyboard: updatedKeyboard });
    } catch (err) {
      console.error("Failed to update inline keyboard: " + err.message);
    }
  } catch (error) {
    console.error("Error fetching meme: " + error);
    return response.reply("An error occurred while fetching the meme.");
  }
}

async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload.command !== "meme") return;
    if (!payload.gameMessageId || callbackQuery.message.message_id !== payload.gameMessageId) return;

    const meme = await fetchMeme();
    if (!meme) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Error fetching meme." });
      return;
    }

    // Build updated inline keyboard retaining the refresh button
    const updatedKeyboard = [
      [
        {
          text: "🔁",
          callback_data: JSON.stringify({
            command: "meme",
            gameMessageId: payload.gameMessageId,
            args: ["refresh"]
          }),
        },
      ],
    ];

    await response.editMedia({ chatId: callbackQuery.message.chat.id, messageId: payload.gameMessageId }, {
      type: "photo",
      media: meme.url,
      caption: meme.title
    }, { reply_markup: { inline_keyboard: updatedKeyboard } });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("Error in meme callback: " + err.message);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." });
    } catch (innerErr) {
      console.error("Failed to answer callback query: " + innerErr.message);
    }
  }
}

export { onCallback };