import axios from 'axios';

export const meta = {
  name: "spotify",
  version: "0.0.1",
  aliases: [],
  description: "Play a Spotify track",
  author: "ShawnDesu",
  prefix: "both",
  category: "music",
  type: "anyone",
  cooldown: 5,
  guide: "[song name]"
};

export async function onStart({ bot, args, response, msg, usages }) {
  try {
    const songName = args.join(' ').trim();
    if (!songName) {
      return usages();
    }

    await bot.sendChatAction(response.chatId, 'upload_audio');

    const apiUrl = `${global.api.neko}/downloader/spotifyplay?q=${encodeURIComponent(songName)}`;
    const apiResponse = await axios.get(apiUrl, { timeout: 10000 });

    if (!apiResponse.data.status || !apiResponse.data.result || !apiResponse.data.result.metadata || !apiResponse.data.result.downloadUrl) {
      return response.reply('Failed to retrieve track data.');
    }

    const metadata = apiResponse.data.result.metadata;
    const downloadUrl = apiResponse.data.result.downloadUrl;

    const caption = `**${metadata.title}** by ${metadata.artist} (${metadata.duration})\n[Listen on Spotify](${metadata.url})`;

    await response.audio(downloadUrl, { caption, parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`[ ${meta.name} ] »`, error);
    return response.reply(`[ ${meta.name} ] » An error occurred while processing your request.`);
  }
}