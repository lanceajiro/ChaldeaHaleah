import axios from 'axios';

export const meta = {
  name: 'spotify',
  version: '1.0.1',
  aliases: ['spot', 'music'],
  description: 'Download Spotify songs by title',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'media',
  type: 'anyone',
  cooldown: 5,
  guide: ['<song name>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) {
    return await usages();
  }

  const query = args.join(' ');
  const loadingMsg = await response.reply(`🎵 Searching Spotify for *${query}*...`, { parse_mode: 'Markdown' });

  try {
    // call Nekolabs Spotify endpoint (uses global.api.nekolabs)
    if (!global.api?.nekolabs) {
      // try to edit the loading message via bot, fallback to delete+reply
      try {
        await response.editText(loadingMsg, '⚠️ Nekolabs API not configured. Set `global.api.nekolabs`.', { parse_mode: 'Markdown' });
      } catch (e) {
        try { await response.delete(loadingMsg); } catch {}
        await response.reply('⚠️ Nekolabs API not configured. Set `global.api.nekolabs`.', { parse_mode: 'Markdown' });
      }
      return;
    }

    const res = await axios.get(`${global.api.nekolabs}/downloader/spotify/play/v1?q=${encodeURIComponent(query)}`, { timeout: 15000 });
    const data = res.data;

    if (!data?.success || !data?.result) {
      try {
        await response.editText(loadingMsg, `❌ Failed to fetch Spotify data for *${query}*. Please try again later.`, { parse_mode: 'Markdown' });
      } catch (e) {
        try { await response.delete(loadingMsg); } catch {}
        await response.reply(`❌ Failed to fetch Spotify data for *${query}*. Please try again later.`, { parse_mode: 'Markdown' });
      }
      return;
    }

    // adjust based on Nekolabs response structure
    const metadata = data.result.metadata || {};
    const { title = 'Unknown', artist = 'Unknown', duration = 'Unknown', cover = null, url = '' } = metadata;
    const downloadUrl = data.result.downloadUrl || data.result.download_url || null;

    const caption = `
🎧 *Spotify Song Found!*

🎵 *Title:* ${title}
👤 *Artist:* ${artist}
⏱️ *Duration:* ${duration}
🔗 [Open in Spotify](${url || 'https://open.spotify.com'})
`;

    // delete the loading message before sending final response (best effort)
    try { await response.delete(loadingMsg); } catch (e) {}

    // send cover image (if available) with markdown caption
    if (cover) {
      await response.photo(cover, { caption, parse_mode: 'Markdown' });
    } else {
      // if no cover, send the caption as a normal reply
      await response.reply(caption, { parse_mode: 'Markdown' });
    }

    // send audio if download URL exists
    if (downloadUrl) {
      await response.audio(downloadUrl, {
        title: title,
        performer: artist
      });
    } else {
      // notify user that audio isn't available
      await response.reply('⚠️ Download URL not available for this track.', { parse_mode: 'Markdown' });
    }

  } catch (error) {
    // attempt to edit the loading message to show the error; fallback to delete+reply
    const errText = error?.response?.data?.message
      ? `⚠️ API error: ${error.response.data.message}`
      : `⚠️ An error occurred: ${error.message}`;

    try {
      await response.editText(loadingMsg, errText, { parse_mode: 'Markdown' });
    } catch (e) {
      try { await response.delete(loadingMsg); } catch {}
      await response.reply(errText, { parse_mode: 'Markdown' });
    }
  }
}
