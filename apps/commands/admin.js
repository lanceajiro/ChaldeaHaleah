import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'admin',
  version: '1.0.3',
  aliases: [],
  description: 'Manage bot admins (list / add / remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'admin',
  type: 'anyone', // visible to anyone; add/remove restricted to admins
  cooldown: 2,
  guide: [
    '- show this guide',
    'list - list current admins',
    'add <uid> - add admin (or reply to a user message)',
    'remove <uid> - remove admin (or reply to a user message)'
  ]
};

// Strict single path: <cwd>/setup/settings.json
const SETTINGS_PATH = path.resolve(process.cwd(), 'setup', 'settings.json');

/** Ensure directory exists for the settings path. */
function ensureSettingsDir() {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load settings.json. If missing or invalid, create a minimal file { admin: [] }
 * and return that object. This ensures the file is always detectable at the single path.
 */
function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      ensureSettingsDir();
      const minimal = { admin: [] };
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(minimal, null, 2), 'utf8');
      return minimal;
    }
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.admin)) parsed.admin = [];
    return parsed;
  } catch (err) {
    // If reading/parsing fails, attempt to restore minimal file
    try {
      ensureSettingsDir();
      const minimal = { admin: [] };
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(minimal, null, 2), 'utf8');
      return minimal;
    } catch (e) {
      // Last resort: return in-memory minimal (file may still be unreadable)
      return { admin: [] };
    }
  }
}

/**
 * Save settings.json.
 * If file exists, merge admin array into existing object (preserve other fields).
 * If file does not exist, create a minimal file with only admin.
 */
function saveSettings(settings) {
  try {
    let toWrite = settings;
    if (fs.existsSync(SETTINGS_PATH)) {
      const existingRaw = fs.readFileSync(SETTINGS_PATH, 'utf8');
      let existing = {};
      try {
        existing = JSON.parse(existingRaw);
      } catch (e) {
        existing = {};
      }
      existing.admin = Array.isArray(settings.admin) ? settings.admin : existing.admin || [];
      toWrite = existing;
    } else {
      ensureSettingsDir();
      toWrite = { admin: Array.isArray(settings.admin) ? settings.admin : [] };
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(toWrite, null, 2), 'utf8');
  } catch (err) {
    throw err;
  }
}

/** Normalize given id into digit string or null */
function normalizeId(id) {
  if (typeof id === 'number') return String(id);
  if (!id) return null;
  const match = String(id).match(/-?\d+/);
  return match ? match[0] : null;
}

/** Check admin membership (settings.admin stored as strings) */
function isAdmin(settings, userId) {
  if (!settings || !Array.isArray(settings.admin)) return false;
  const uid = normalizeId(userId);
  if (!uid) return false;
  return settings.admin.map(String).includes(uid);
}

/**
 * Build a human-friendly display name from a user object.
 * Accepts Telegram user/chat object (first_name, last_name, username).
 */
function buildNameFromUserObj(user) {
  if (!user) return null;
  const parts = [];
  if (user.first_name) parts.push(user.first_name);
  if (user.last_name) parts.push(user.last_name);
  let name = parts.join(' ').trim();
  if (!name && user.username) name = `@${user.username}`;
  // Append username if exists and not already included
  if (user.username && !name.includes(`@${user.username}`)) {
    name += name ? ` (@${user.username})` : `@${user.username}`;
  }
  return name || null;
}

/**
 * Attempt to get a display name for a user id.
 * Priority:
 *  - If a userObj is provided, use it (reply case).
 *  - Otherwise call bot.getChat(userId) to fetch profile.
 * Returns: { name: string|null, id: string }
 */
async function getDisplayForId(bot, userId, userObj = null) {
  const uid = normalizeId(userId);
  if (!uid) return { name: null, id: null };

  // If we have a user object (reply), prefer it
  if (userObj) {
    const built = buildNameFromUserObj(userObj);
    if (built) return { name: built, id: uid };
  }

  // Try to fetch via bot.getChat
  try {
    const chat = await bot.getChat(uid);
    // chat might be a user or chat object
    const built = buildNameFromUserObj(chat);
    if (built) return { name: built, id: uid };
  } catch (e) {
    // can't fetch — ignore and fallback to id
  }

  // fallback to id only
  return { name: null, id: uid };
}

/** Build admin list message (attempts to resolve display names). */
async function buildAdminListMessage(bot, settings) {
  if (!settings || !Array.isArray(settings.admin) || settings.admin.length === 0) {
    return `👑 No admins currently set.\n\nSettings file: \`${SETTINGS_PATH}\``;
  }

  const lines = [];
  for (let i = 0; i < settings.admin.length; i++) {
    const id = String(settings.admin[i]);
    try {
      const disp = await getDisplayForId(bot, id);
      if (disp.name) {
        lines.push(`${i + 1}. ${disp.name} — \`${disp.id}\``);
      } else {
        lines.push(`${i + 1}. \`${disp.id}\``);
      }
    } catch (e) {
      // on any failure just show the id
      lines.push(`${i + 1}. \`${id}\``);
    }
  }

  return `👑 *Admin list:*\n\n${lines.join('\n')}`;
}

export async function onStart({ bot, msg, args, response, usages }) {
  // ensure settings exist and are readable (loadSettings will create minimal if needed)
  const settings = loadSettings();

  // No args -> show usages/guide
  if (!args.length) {
    if (typeof usages === 'function') return await usages();
    return await response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
  }

  const sub = String(args[0] || '').toLowerCase();

  // LIST
  if (sub === 'list') {
    const listMsg = await buildAdminListMessage(bot, settings);
    return await response.reply(listMsg, { parse_mode: 'Markdown' });
  }

  // ADD / REMOVE -> admin-only
  if (sub === 'add' || sub === 'remove') {
    const requesterId = msg.from?.id ?? msg.from?.user_id ?? null;

    if (!isAdmin(settings, requesterId)) {
      return await response.reply('⚠️ Only bot admins can use this command.', { parse_mode: 'Markdown' });
    }

    // Determine target: prefer replied user object (so we can use their name)
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

    const alreadyAdmin = isAdmin(settings, targetId);

    if (sub === 'add') {
      if (alreadyAdmin) {
        // Attempt to show name
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`ℹ️ User ${who} is already an admin.`, { parse_mode: 'Markdown' });
      }

      // Add and save
      settings.admin.push(String(targetId));
      settings.admin = Array.from(new Set(settings.admin.map(String)));
      try {
        saveSettings(settings);
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`✅ Added admin: ${who}.`, { parse_mode: 'Markdown' });
      } catch (err) {
        return await response.reply(`⚠️ Failed to save settings: ${err.message}`, { parse_mode: 'Markdown' });
      }
    } else {
      // remove
      if (!alreadyAdmin) {
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`ℹ️ User ${who} is not an admin.`, { parse_mode: 'Markdown' });
      }

      settings.admin = settings.admin.map(String).filter((x) => x !== String(targetId));
      try {
        saveSettings(settings);
        const disp = await getDisplayForId(bot, targetId, repliedUserObj);
        const who = disp.name ? `${disp.name} (\`${disp.id}\`)` : `\`${disp.id}\``;
        return await response.reply(`✅ Removed admin: ${who}.`, { parse_mode: 'Markdown' });
      } catch (err) {
        return await response.reply(`⚠️ Failed to save settings: ${err.message}`, { parse_mode: 'Markdown' });
      }
    }
  }

  // Unknown subcommand -> show guide
  return await response.reply(meta.guide.join('\n'), { parse_mode: 'Markdown' });
}
