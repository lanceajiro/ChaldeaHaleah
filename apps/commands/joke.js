import axios from 'axios';

export const meta = {
  name: "joke",
  version: "1.0.0",
  aliases: ["telljoke", "randomjoke"],
  description: "Get a random joke to make you laugh!",
  author: "JokeBotDev",
  prefix: "both",
  category: "utility",
  type: "anyone",
  cooldown: 5,
  guide: ""
};

export async function onStart({ bot, chatId, args, response }) {
  try {
    const jokeResponse = await axios.get('https://official-joke-api.appspot.com/random_joke');
    const { setup, punchline } = jokeResponse.data;
    const jokeMessage = `${setup}\n\n${punchline}`;
    response.reply(jokeMessage);
  } catch (error) {
    response.reply("Oops, couldn't fetch a joke right now. Try again later!");
  }
}