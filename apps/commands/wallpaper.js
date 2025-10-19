import axios from 'axios';

export const meta = {
  name: 'wallpaper',
  version: '1.0.0',
  aliases: ['wp', 'wall'],
  description: 'Send a random wallpaper. Optionally provide a query and/or size (e.g. "space 2560x1440").',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 3,
  guide: ['[query] [widthxheight] — examples: "space", "mountains 1920x1080"']
};

function parseArgs(args) {
  // If last arg looks like WxH, use it as size
  let width = 1920, height = 1080;
  let query = args.join(' ').trim();

  if (!query) return { query: 'wallpaper', width, height };

  const parts = args.slice();
  const last = parts[parts.length - 1];
  const sizeMatch = /^(\d{2,4})x(\d{2,4})$/i.exec(last);
  if (sizeMatch) {
    width = Math.min(3840, parseInt(sizeMatch[1], 10));
    height = Math.min(2160, parseInt(sizeMatch[2], 10));
    parts.pop();
    query = parts.join(' ').trim() || 'wallpaper';
  }

  return { query, width, height };
}

export async function onStart({ bot, msg, args, response, usages }) {
  const { query, width, height } = parseArgs(args);
  const loadingMsg = await response.reply(`🖼️ Finding a *${width}x${height}* wallpaper for *${query}*...`, { parse_mode: 'Markdown' });

  try {
    // Primary source: Unsplash Source (no API key). This URL returns a redirect to the actual image.
    // If Unsplash fails (e.g. blocked), we'll attempt picsum.photos as fallback.
    const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;

    // Quick HEAD request to check availability and to get the final URL (some servers redirect).
    // Use axios with maxRedirects to follow; axios will return the final URL in request.res.responseUrl for Node fetch-like libs,
    // but to keep it robust across environments we simply rely on Telegram fetching the unsplashUrl directly.
    // We'll still attempt a small GET to guard against obvious errors.
    try {
      await axios.get(unsplashUrl, { timeout: 8000, responseType: 'stream', maxRedirects: 5 });
    } catch (e) {
      // If Unsplash request fails, we'll use picsum.photos fallback
    }

    // delete the loading message before final send (best-effort)
    try { await bot.deleteMessage(msg.chat.id, loadingMsg.message_id); } catch (e) {}

    // Send the Unsplash URL — Telegram will follow redirects and fetch the image.
    // Provide a short caption with attribution link to Unsplash.
    const caption = `
🖼️ *${query.charAt(0).toUpperCase() + query.slice(1)}* — ${width}x${height}
📷 Source: Unsplash
`;
    try {
      await response.photo(unsplashUrl, { caption, parse_mode: 'Markdown' });
      return;
    } catch (e) {
      // If sending unsplashUrl failed (some hosts block Telegram), fallback to picsum.photos
    }

    // Fallback: picsum.photos random image
    const picsumUrl = `https://picsum.photos/${width}/${height}`;
    try {
      await response.photo(picsumUrl, { caption: `${caption}\n(Fallback source)`, parse_mode: 'Markdown' });
      return;
    } catch (e) {
      throw new Error('Both primary and fallback wallpaper sources failed.');
    }

  } catch (error) {
    // Attempt to edit the loading message via bot.editMessageText; fallback to delete+reply
    const errText = error?.response?.status
      ? `⚠️ API error: received status ${error.response.status}`
      : `⚠️ An error occurred: ${error.message}`;

    try {
      await bot.editMessageText(errText, {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    } catch (e) {
      try { await bot.deleteMessage(msg.chat.id, loadingMsg.message_id); } catch (e2) {}
      await response.reply(errText, { parse_mode: 'Markdown' });
    }
  }
}
