import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'vip',
  version: '1.0.2',
  aliases: [],
  description: 'Manage VIP users (list / add / remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'admin',
  type: 'anyone',
  cooldown: 2,
  guide: [
    '- show this guide',
    'list - list current VIPs',
    'add <uid> - add VIP (or reply to a user message)',
    'remove <uid> - remove VIP (or reply to a user message)'
  ]
};

// Paths
const VIP_PATH = path.resolve(process.cwd(), 'setup', 'vip.json');
const SETTINGS_PATH = path.resolve(process.cwd(), 'setup', 'settings.json');

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Load vip.json. If missing or invalid, create minimal { uid: [] } and return it.
 * If exists, ensure uid is an array and preserve other keys.
 */
function loadVip() {
  try {
    if (!fs.existsSync(VIP_PATH)) {
      ensureDirFor(VIP_PATH);
      const minimal = { uid: [] };
      fs.writeFileSync(VIP_PATH, JSON.stringify(minimal, null, 2), 'utf8');
      return minimal;
    }
    const raw = fs.readFileSync(VIP_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.uid)) parsed.uid = [];
    return parsed;
  } catch (err) {
    // attempt to recreate minimal file
    try {
      ensureDirFor(VIP_PATH);
      const minimal = { uid: [] };
      fs.writeFileSync(VIP_PATH, JSON.stringify(minimal, null, 2), 'utf8');
      return minimal;
    } catch (e) {
      return { uid: [] };
    }
  }
}

/**
 * Save vip.json.
 * If file exists, merge uid array into existing object (preserve other fields).
 * If not, create minimal with uid array.
 */
function saveVip(vipObj) {
  try {
    let toWrite = vipObj;
    if (fs.existsSync(VIP_PATH)) {
      const existingRaw = fs.readFileSync(VIP_PATH, 'utf8');
      let existing = {};
      try {
        existing = JSON.parse(existingRaw);
      } catch (e) {
        existing = {};
      }
      existing.uid = Array.isArray(vipObj.uid) ? vipObj.uid : existing.uid || [];
      toWrite = existing;
    } else {
      ensureDirFor(VIP_PATH);
      toWrite = { uid: Array.isArray(vipObj.uid) ? vipObj.uid : [] };
    }
    fs.writeFileSync(VIP_PATH, JSON.stringify(toWrite, null, 2), 'utf8');
  } catch (err) {
    throw err;
  }
}

/**
 * Load admin list from settings.json.
 * Do NOT create/modify settings.json. If missing/invalid, return null.
 */
function loadAdmins() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return null;
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.admin)) parsed.admin = [];
    return parsed.admin.map(String);
  } catch (err) {
    return null;
  }
}

/** Normalize ID to digit string or null */
function normalizeId(id) {
  if (typeof id === 'number') return String(id);
  if (!id) return null;
  const m = String(id).match(/-?\d+/);
  return m ? m[0] : null;
}

/** Check admin membership given adminArray (or null) */
function isAdmin(adminArray, userId) {
  if (!Array.isArray(adminArray)) return false;
  const uid = normalizeId(userId);
  if (!uid) return false;
  return adminArray.map(String).includes(uid);
}

/** Build readable name from Telegram user/chat object */
function buildNameFromUserObj(user) {
  if (!user) return null;
  const parts = [];
  if (user.first_name) parts.push(user.first_name);
  if (user.last_name) parts.push(user.last_name);
  let name = parts.join(' ').trim();
  if (!name && user.username) name = `@${user.username}`;
  if (user.username && !name.includes(`@${user.username}`)) {
    name += name ? ` (@${user.username})` : `@${user.username}`;
  }
  return name || null;
}

/**
 * Try to resolve display name for an id.
 * Priority: userObj (reply) -> bot.getChat(id) -> fallback to id
 * Returns { name, id }.
 */
async function getDisplayForId(bot, id, userObj = null) {
  const uid = normalizeId(id);
  if (!uid) return { name: null, id: null };

  if (userObj) {
    const built = buildNameFromUserObj(userObj);
    if (built) return { name: built, id: uid };
  }

  try {
    const chat = await bot.getChat(uid);
    const built = buildNameFromUserObj(chat);
    if (built) return { name: built, id: uid };
  } catch (e) {
    // ignore
  }

  return { name: null, id: uid };
}

/** Build VIP list message, resolving names when possible */
async function buildVipListMessage(bot, vipObj) {
  if (!vipObj || !Array.isArray(vipObj.uid) || vipObj.uid.length === 0) {
    return `👑 No VIPs currently set.\n\nVIP file: \`${VIP_PATH}\``;
  }
  const lines = [];
  for (let i = 0; i < vipObj.uid.length; i++) {
    const id = String(vipObj.uid[i]);
    try {
      const disp = await getDisplayForId(bot, id);
      if (disp.name) lines.push(`${i + 1}. ${disp.name} — \`${disp.id}\``);
      else lines.push(`${i + 1}. \`${disp.id}\``);
    } catch (e) {
      lines.push(`${i + 1}. \`${id}\``);
    }
  }
  return `👑 *VIP list:*\n\n${lines.join('\n')}`;
}

export async function onStart({ bot, msg, args, response, usages }) {
  // load vip.json (creates minimal if missing), and try to load admins (must exist to allow add/remove)
  const vipData = loadVip();
  const admins = loadAdmins();

  // No args -> usages/guide
  if (!args.length) {
    if (typeof usages === 'function') return await usages();
    return await response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
  }

  const sub = String(args[0] || '').toLowerCase();

  // LIST
  if (sub === 'list') {
    const msgText = await buildVipListMessage(bot, vipData);
    return await response.reply(msgText, { parse_mode: 'Markdown' });
  }

  // ADD / REMOVE -> admin-only
  if (sub === 'add' || sub === 'remove') {
    const requesterId = msg.from?.id ?? msg.from?.user_id ?? null;

    // If we couldn't load admins, deny (do not create/modify settings.json)
    if (!Array.isArray(admins)) {
      return await response.reply(
        `⚠️ Cannot verify admin permissions: settings file not found or invalid.\nExpected: \`${SETTINGS_PATH}\` with an "admin" array.`,
        { parse_mode: 'Markdown' }
      );
    }

    if (!isAdmin(admins, requesterId)) {
      return await response.reply('⚠️ Only bot admins can use this command.', { parse_mode: 'Markdown' });
    }

    // Determine target: prefer replied user object
    let targetId = null;
    let repliedUserObj = null;
    if (msg.reply_to_message?.from?.id) {
      targetId = normalizeId(msg.reply_to_message.from.id);
      repliedUserObj = msg.reply_to_message.from;
    } else if (args[1]) {
      targetId = normalizeId(args[1]);
    }

    if (!targetId) {
      return await response.reply('⚠️ Missing target user. Use `add <uid>` or reply to a user message with `add`.', { parse_mode: 'Markdown' });
    }

    const isAlreadyVip = Array.isArray(vipData.uid) && vipData.uid.map(String).includes(String(targetId));

    if (sub === 'add') {
      if (isAlreadyVip) {
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`ℹ️ User ${who} is already a VIP.`, { parse_mode: 'Markdown' });
      }

      vipData.uid.push(String(targetId));
      vipData.uid = Array.from(new Set(vipData.uid.map(String)));
      try {
        saveVip(vipData);
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`✅ Added VIP: ${who}.`, { parse_mode: 'Markdown' });
      } catch (err) {
        return await response.reply(`⚠️ Failed to save VIP file: ${err.message}`, { parse_mode: 'Markdown' });
      }
    } else {
      // remove
      if (!isAlreadyVip) {
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`ℹ️ User ${who} is not a VIP.`, { parse_mode: 'Markdown' });
      }

      vipData.uid = vipData.uid.map(String).filter((x) => x !== String(targetId));
      try {
        saveVip(vipData);
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`✅ Removed VIP: ${who}.`, { parse_mode: 'Markdown' });
      } catch (err) {
        return await response.reply(`⚠️ Failed to save VIP file: ${err.message}`, { parse_mode: 'Markdown' });
      }
    }
  }

  // Unknown sub -> guide
  return await response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
}
