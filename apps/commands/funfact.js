import axios from 'axios';

export const meta = {
  name: "funfact",
  version: "1.0.0",
  aliases: ["fact", "randomfact"],
  description: "Get a random fun fact to brighten your day!",
  author: "FunFactBotDev",
  prefix: "both",
  category: "utility",
  type: "anyone",
  cooldown: 5,
  guide: ""
};

export async function onStart({ bot, chatId, args, response }) {
  try {
    const factResponse = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
    const fact = factResponse.data.text;
    response.reply(`🧠 Did you know? ${fact}`);
  } catch (error) {
    response.reply("Oops, couldn't fetch a fun fact right now. Try again later!");
  }
}