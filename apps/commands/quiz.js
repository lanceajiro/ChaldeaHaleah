import axios from 'axios';

export const meta = {
  name: 'quiz',
  version: '1.0.0',
  aliases: ['trivia', 'question'],
  description: 'Get a random quiz question from Open Trivia Database',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const loadingMsg = await response.reply('🧠 *Fetching a random quiz question...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', {
      headers: { Accept: 'application/json' }
    });

    const quiz = res.data?.results?.[0];
    if (!quiz) {
      await bot.editMessageText('⚠️ Could not retrieve a quiz question from the API.', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    const options = [...quiz.incorrect_answers, quiz.correct_answer].sort(() => Math.random() - 0.5);
    const question = quiz.question
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&eacute;/g, "é");

    const formattedOptions = options.map((opt, i) => `*${i + 1}.* ${opt}`).join('\n');

    const text = `🎯 *Quiz Time!*\n\n❓ *Question:* ${question}\n\n${formattedOptions}\n\n💡 *Answer:* ||${quiz.correct_answer}||`;

    // Edit the loading message with the quiz content
    await bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Also send as a normal message for interaction consistency
    await bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });

  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to fetch quiz: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}
