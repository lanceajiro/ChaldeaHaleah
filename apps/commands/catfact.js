import axios from 'axios';

export const meta = {
  name: 'catfact',
  version: '1.0.0',
  aliases: ['catfacts'],
  description: 'Get a random cat fact from catfact.ninja',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, args, response, usages }) {
  // show loading message
  const loadingMsg = await response.reply('🐾 *Fetching a cat fact...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get('https://catfact.ninja/fact', {
      headers: { Accept: 'application/json' }
    });

    const fact = res.data?.fact;
    if (!fact) {
      await response.editText(loadingMsg, '⚠️ Could not retrieve a cat fact from the API.', { parse_mode: 'Markdown' });
      return;
    }

    // edit the loading message to show the fact
    await response.editText(loadingMsg, `✨ *Cat Fact:*\n\n_${fact}_`, { parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch cat fact: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
