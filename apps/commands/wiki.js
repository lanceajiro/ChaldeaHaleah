export const meta = {
  name: "wiki",
  version: "1.0.0",
  aliases: ["wikipedia", "wp"],
  description: "Search Wikipedia and return page summary / links",
  author: "assistant",
  prefix: "both",       // true = only with prefix, false = no prefix, "both" = both allowed
  category: "tools",
  type: "anyone",
  cooldown: 5,
  guide: "<search query>"
};

export async function onStart({ bot, args, response, msg, usages }) {
  if (!args.length) return usages();

  const query = args.join(" ").trim();

  // ensure fetch is available (works in Node 18+ or browsers). If not, dynamic import node-fetch
  let _fetch = typeof fetch !== "undefined" ? fetch : null;
  if (!_fetch) {
    try {
      // dynamic import for ESM environments that don't provide global fetch
      const mod = await import('node-fetch');
      _fetch = mod.default;
    } catch (err) {
      console.error('Fetch is not available and node-fetch failed to import:', err);
      return response.reply('❌ Cannot perform network requests in this environment.');
    }
  }

  try {
    // Step 1: search for relevant pages (top 5)
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*`;
    const sres = await _fetch(searchUrl, { headers: { 'User-Agent': 'ChaldeaBot/1.0 (https://example.com)' } });
    const sjson = await sres.json();
    const searchResults = (sjson.query && sjson.query.search) || [];

    if (!searchResults.length) {
      return response.reply(`❌ No Wikipedia pages found for: ${query}`);
    }

    // pick the top result to show summary for
    const top = searchResults[0];
    const title = top.title;

    // Step 2: fetch the REST summary for the top page
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const pres = await _fetch(summaryUrl, { headers: { 'User-Agent': 'ChaldeaBot/1.0 (https://example.com)' } });

    if (!pres.ok) {
      // fallback: just show search titles
      const titlesList = searchResults.map((r, i) => `${i + 1}. ${r.title}`).join('\n');
      return response.reply(`⚠️ Couldn't fetch page summary, but here are top matches:\n${titlesList}`);
    }

    const pjson = await pres.json();

    // Build a clean message
    const lines = [];
    lines.push(`📚 *${pjson.title || title}*`);

    if (pjson.description) lines.push(`_${pjson.description}_`);

    // If the page is a disambiguation, indicate that and list top matches
    if (pjson.type === 'disambiguation') {
      lines.push('— This is a disambiguation page. Here are top matches:');
      const titlesList = searchResults.map((r, i) => `${i + 1}. ${r.title}`).join('\n');
      lines.push(titlesList);
      lines.push(`\nFull page: ${pjson.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`}`);

      // Send as plain text (some bot frameworks support markdown; if yours doesn't, remove asterisks/underscores)
      return response.reply(lines.join('\n'), { parse_mode: 'Markdown' });
    }

    // Add extract (truncate if too long)
    const EXTRACT_LIMIT = 3000;
    let extract = pjson.extract || '';
    if (extract.length > EXTRACT_LIMIT) extract = extract.slice(0, EXTRACT_LIMIT) + '\n\n[...truncated]';
    if (extract) lines.push('\n' + extract);

    // Provide links and additional info
    const pageUrl = pjson.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    lines.push(`\n🔗 ${pageUrl}`);

    if (pjson.thumbnail && pjson.thumbnail.source) {
      lines.push(`🖼️ Thumbnail: ${pjson.thumbnail.source}`);
    }

    // If there were other useful matches, present them briefly
    if (searchResults.length > 1) {
      const others = searchResults.slice(1).map((r, i) => `${i + 2}. ${r.title}`).join('\n');
      lines.push('\nOther top matches:\n' + others);
    }

    // Send the result. Some bot frameworks accept an options object; if yours doesn't, it will ignore it.
    return response.reply(lines.join('\n'), { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('Wiki command error:', err);
    return response.reply(`❌ Error while searching Wikipedia:\n${err.message}`);
  }
}
