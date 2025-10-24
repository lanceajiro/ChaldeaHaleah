import axios from 'axios';

export const meta = {
  name: 'weather',
  version: '1.0.1',
  aliases: ['w', 'wt', 'wthr'],
  description: 'Get current weather by city name (uses wttr.in, no API key required)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 3,
  guide: ['<city name>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) {
    return await usages();
  }

  const query = args.join(' ');
  const loadingMsg = await response.reply(`🌤️ Searching weather for *${query}*...`, { parse_mode: 'Markdown' });

  try {
    // Use wttr.in free JSON API (no key required)
    const url = `https://wttr.in/${encodeURIComponent(query)}?format=j1`;
    const res = await axios.get(url, { timeout: 10000 });
    const data = res.data;

    // basic validation
    if (!data || !data.current_condition || !data.current_condition.length) {
      // edit the loading message using response
      try {
        await response.editText(loadingMsg, `❌ City *${query}* not found or wttr.in returned no data.`, { parse_mode: 'Markdown' });
      } catch (e) {
        // fallback: try deleting then reply
        try { await response.delete(loadingMsg); } catch {}
        await response.reply(`❌ City *${query}* not found or wttr.in returned no data.`, { parse_mode: 'Markdown' });
      }
      return;
    }

    const current = data.current_condition[0];
    const area = (data.nearest_area && data.nearest_area[0]) || null;
    const placeName = area?.areaName?.[0]?.value || query;
    const country = area?.country?.[0]?.value || '';
    const description = current.weatherDesc?.[0]?.value || 'N/A';
    const iconUrl = current.weatherIconUrl?.[0]?.value || 'https://wttr.in/favicon.png'; // fallback
    const tempC = current.temp_C ?? 'N/A';
    const feelsLikeC = current.FeelsLikeC ?? 'N/A';
    const humidity = current.humidity ?? 'N/A';
    const windKmph = current.windspeedKmph ?? 'N/A';
    const windDir = current.winddir16Point ?? 'N/A';

    // sunrise/sunset: wttr.in provides them within `weather[0].astronomy[0]` (for today)
    const astronomy = (data.weather && data.weather[0] && data.weather[0].astronomy && data.weather[0].astronomy[0]) || {};
    const sunrise = astronomy.sunrise || 'N/A';
    const sunset = astronomy.sunset || 'N/A';

    const caption = `
🌆 *Location:* ${placeName}${country ? `, ${country}` : ''}
☁️ *Weather:* ${description}
🌡️ *Temp:* ${tempC}°C (feels like ${feelsLikeC}°C)
💧 *Humidity:* ${humidity}%
💨 *Wind:* ${windKmph} km/h (${windDir})
🌅 *Sunrise:* ${sunrise}  🌇 *Sunset:* ${sunset}
`;

    // delete the loading message before sending final response
    try { await response.delete(loadingMsg); } catch (e) {}

    // send weather icon as photo with caption
    await response.photo(iconUrl, { caption, parse_mode: 'Markdown' });

  } catch (error) {
    // try to update the loading message using response
    const errText = error?.response?.status
      ? `⚠️ API error: received status ${error.response.status}`
      : `⚠️ An error occurred: ${error.message}`;

    try {
      await response.editText(loadingMsg, errText, { parse_mode: 'Markdown' });
    } catch (e) {
      try { await response.delete(loadingMsg); } catch {}
      await response.reply(errText, { parse_mode: 'Markdown' });
    }
  }
}
