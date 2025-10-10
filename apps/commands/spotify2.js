import axios from 'axios';

export const meta = {
  name: "spotify2",
  version: "0.0.1",
  aliases: [],
  description: "Play a music from Spotify",
  author: "ShawnDesu",
  prefix: "both",
  category: "music",
  type: "anyone",
  cooldown: 5,
  guide: "[search query]"
};

export async function onStart({ bot, args, response, msg, usages }) {
  try {
    const query = args.join(" ");
    if (!query) {
      return usages();
    }

    // Search for tracks
    const searchResponse = await axios.get(`${global.api.neko}/search/spotify?q=${encodeURIComponent(query)}`);
    const tracks = searchResponse.data.result;
    if (!tracks || tracks.length === 0) {
      return response.reply("No tracks found for your query.");
    }

    const firstTrack = tracks[0];
    const spotifyUrl = firstTrack.url;

    // Get download URL using the downloader API
    const downloadResponse = await axios.get(`${global.api.neko}/downloader/spotify?url=${encodeURIComponent(spotifyUrl)}`);
    const downloadData = downloadResponse.data.result;
    if (!downloadData || !downloadData.downloadUrl) {
      return response.reply("Failed to get the download URL.");
    }

    const downloadUrl = downloadData.downloadUrl;
    const caption = `Title: ${downloadData.title}\nArtist: ${downloadData.artist}\nDuration: ${downloadData.duration}\nListen on Spotify: ${downloadData.link}`;

    // Send audio
    return response.audio(downloadUrl, { caption });
  } catch (error) {
    console.error(`[ ${meta.name} ] »`, error);
    return response.reply(`[ ${meta.name} ] » An error occurred while processing your request.`);
  }
}