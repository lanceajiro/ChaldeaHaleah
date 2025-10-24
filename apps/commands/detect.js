export const meta = {
  name: "detect",
  keyword: ["lance", "wataru", "pastebin.com"],
  aliases: [],
  version: "0.0.1",
  author: "Lance Cochangco",
  description: "Detects admin name mentions and privately notifies them with details.",
  guide: ["Detects keywords in messages and alerts owners."],
  prefix: "both",
  cooldown: 0,
  type: "anyone",
  category: "hidden"
};

export async function onStart({ bot, msg, response }) {
  await response.reply("Hello! You've activated the detect command.");
}

export async function onWord({ bot, msg, response }) {
  // Skip if no message text
  if (!msg?.text) return;

  // Detect case-insensitive whole-word matches
  const detectedKeywords = meta.keyword.filter(keyword =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(msg.text)
  );
  if (!detectedKeywords.length) return;

  // Get owners from global settings (fallback to admin)
  const owners = Array.isArray(global.settings?.owner)
    ? global.settings.owner
    : Array.isArray(global.settings?.admin)
      ? global.settings.admin
      : [];
  if (!owners.length) return;

  // Build sender details
  const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ').trim() || 'Unknown';
  const senderUsername = msg.from?.username ? ` (@${msg.from.username})` : '';
  const senderId = msg.from?.id ?? 'Unknown';

  // Build chat details
  const chatTitle = msg.chat?.title || 'Private Chat';
  const chatId = msg.chat?.id ?? 'Unknown';

  // Construct alert message
  const details = `
<b>Owner Alert</b>
Mention of <b>${detectedKeywords.join(', ')}</b> detected.

<b>Chat Details:</b>
• Chat ID: <code>${chatId}</code>
• Chat Title: <b>${chatTitle}</b>

<b>User Details:</b>
• Name: <b>${senderName}</b>${senderUsername}
• User ID: <code>${senderId}</code>

<b>Message Details:</b>
• Message ID: <code>${msg.message_id ?? 'Unknown'}</code>
• Message Text: <i>${msg.text}</i>
  `;

  try {
    // Notify each owner
    await response.forOwner(details, { parse_mode: "HTML" });
  } catch (error) {
    console.error(`Failed to notify owners: ${error.message}`);
  }
}