import axios from "axios";

export const meta = {
  name: "quiz",
  version: "1.1.0",
  aliases: ["trivia", "question"],
  description: "Get a random quiz question from Open Trivia Database",
  author: "AjiroDesu",
  prefix: "both",
  category: "random",
  type: "anyone",
  cooldown: 5,
  guide: [""],
};

// Temporary in-memory map for short callback IDs
const quizCache = new Map();

function decodeHtml(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&eacute;/g, "é")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”");
}

export async function onStart({ bot, msg, response }) {
  const loadingMsg = await response.reply("🧠 *Fetching a random quiz question...*", {
    parse_mode: "Markdown",
  });

  try {
    const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple", {
      headers: { Accept: "application/json" },
    });

    const quiz = res.data?.results?.[0];
    if (!quiz) {
      await bot.editMessageText("⚠️ Could not retrieve a quiz question from the API.", {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: "Markdown",
      });
      return;
    }

    const question = decodeHtml(quiz.question);
    const correctAnswer = decodeHtml(quiz.correct_answer);
    const options = [...quiz.incorrect_answers.map(decodeHtml), correctAnswer].sort(
      () => Math.random() - 0.5
    );

    // Generate a short random ID
    const quizId = Math.random().toString(36).slice(2, 10);
    quizCache.set(quizId, { correct: correctAnswer });

    // Inline keyboard buttons with short data
    const inlineKeyboard = options.map((opt) => [
      {
        text: opt,
        callback_data: `quiz:${quizId}:${Buffer.from(opt).toString("base64").slice(0, 32)}`,
      },
    ]);

    const text = `🎯 *Quiz Time!*\n\n❓ *Question:* ${question}\n\nSelect the correct answer below:`;

    await bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to fetch quiz: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: "Markdown",
    });
  }
}

export async function onCallback({ bot, chatId, messageId, payload, callbackQuery }) {
  try {
    const parts = callbackQuery.data.split(":");
    if (parts.length < 3) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid data format." });
      return;
    }

    const quizId = parts[1];
    const chosen = Buffer.from(parts[2], "base64").toString("utf8");
    const quizData = quizCache.get(quizId);

    if (!quizData) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "This quiz expired. Try again!" });
      return;
    }

    const { correct } = quizData;
    const isCorrect = chosen === correct;
    const emoji = isCorrect ? "✅" : "❌";
    const feedback = isCorrect
      ? `🎉 *Correct!* The answer is *${correct}*`
      : `😢 *Wrong!* You chose *${chosen}*\n\n✅ The correct answer was *${correct}*`;

    await bot.editMessageText(`${emoji} ${feedback}`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
    });

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: isCorrect ? "Correct!" : "Wrong!",
      show_alert: false,
    });

    // Clean up old quiz data
    quizCache.delete(quizId);
  } catch (err) {
    console.error("Error in quiz callback:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "An error occurred while processing your answer.",
      show_alert: true,
    });
  }
}
