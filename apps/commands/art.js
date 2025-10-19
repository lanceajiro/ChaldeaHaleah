import axios from 'axios';

export const meta = {
  name: 'art',
  version: '1.0.0',
  aliases: ['arts', 'randomart', 'artwork'],
  description: 'Send a random artwork (public domain) from the Art Institute of Chicago',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 3,
  guide: []
};

const IIIF_BASE = 'https://www.artic.edu/iiif/2';

async function fetchRandomArtwork(attempt = 0) {
  // Try to get total pages first (small request)
  const limit = 1;
  const baseUrl = `https://api.artic.edu/api/v1/artworks`;
  const infoRes = await axios.get(`${baseUrl}?limit=1`);
  const totalPages = (infoRes.data && infoRes.data.pagination && infoRes.data.pagination.total_pages) || 1000;
  // choose a random page between 1 and totalPages (clamp to reasonable upper bound)
  const rndPage = Math.max(1, Math.floor(Math.random() * Math.min(totalPages, 5000)) + 1);

  const res = await axios.get(`${baseUrl}?page=${rndPage}&limit=${limit}&fields=id,title,artist_display,date_display,image_id`);
  const art = res.data && res.data.data && res.data.data[0] ? res.data.data[0] : null;

  // If there's no image_id, retry a few times
  if (!art || !art.image_id) {
    if (attempt < 4) {
      return fetchRandomArtwork(attempt + 1);
    }
    // final fallback: return null so caller can handle
    return null;
  }

  const imageUrl = `${IIIF_BASE}/${art.image_id}/full/843,/0/default.jpg`;

  return {
    title: art.title || 'Untitled',
    artist: art.artist_display || 'Unknown',
    date: art.date_display || 'Unknown date',
    imageUrl
  };
}

export async function onStart({ bot, msg, args, response, usages }) {
  const loadingMsg = await response.reply('🖼️ Finding a random artwork for you...', { parse_mode: 'Markdown' });

  try {
    const art = await fetchRandomArtwork();

    if (!art) {
      // Couldn't find a suitable artwork after retries
      try { await bot.deleteMessage(msg.chat.id, loadingMsg.message_id); } catch (e) {}
      await response.reply('❌ Sorry — couldn\'t find a random artwork right now. Try again in a bit.');
      return;
    }

    const caption = `
🖼️ *${art.title}*
👤 ${art.artist}
📅 ${art.date}
`;

    // delete loading message before final send
    try { await bot.deleteMessage(msg.chat.id, loadingMsg.message_id); } catch (e) {}

    // send artwork image with caption
    await response.photo(art.imageUrl, { caption, parse_mode: 'Markdown' });

  } catch (error) {
    // best-effort cleanup and friendly error
    try {
      await bot.deleteMessage(msg.chat.id, loadingMsg.message_id);
    } catch (e) {}

    const errText = error?.response?.status
      ? `⚠️ API error: received status ${error.response.status}`
      : `⚠️ An error occurred: ${error.message}`;

    await response.reply(errText);
  }
}
