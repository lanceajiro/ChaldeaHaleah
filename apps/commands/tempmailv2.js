import axios from 'axios';

export const meta = {
  name: 'tempmailv2',
  version: '1.0.0',
  aliases: ['genv2', 'tempv2'],
  description: 'Generate a temporary email account with Mail.tm API',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 8,
  guide: ['']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const loadingMsg = await response.reply('📧 *Generating a temporary email account...*', { parse_mode: 'Markdown' });

  try {
    // Step 1: Get a random domain
    const domainRes = await axios.get('https://api.mail.tm/domains');
    const domains = domainRes.data['hydra:member'];
    if (!domains?.length) throw new Error('No domains available.');
    const domain = domains[Math.floor(Math.random() * domains.length)].domain;

    // Step 2: Generate random email + password
    const randomString = Math.random().toString(36).substring(2, 12);
    const email = `${randomString}@${domain}`;
    const password = randomString;

    // Step 3: Create account
    const accountRes = await axios.post(
      'https://api.mail.tm/accounts',
      { address: email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const account = accountRes.data;

    // Step 4: Get token
    const tokenRes = await axios.post(
      'https://api.mail.tm/token',
      { address: email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const token = tokenRes.data;

    if (!token?.token || !account?.address) {
      throw new Error('Failed to create or authenticate temp mail account.');
    }

    const text = `📮 *Temporary Mail Account Generated!*\n\n` +
      `📧 *Email:* \`${account.address}\`\n🔑 *Password:* \`${password}\`\n🆔 *ID:* \`${account.id}\`\n\n` +
      `🪪 *Token:* \`${token.token}\`\n\n⚠️ *Note:* Save these details if you want to check incoming mail via Mail.tm API.`;

    // Edit loading message to success
    await bot.editMessageText('✅ *Temp mail account created successfully!*', {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Send email info to user
    await bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });

  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to generate temp mail account: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}
