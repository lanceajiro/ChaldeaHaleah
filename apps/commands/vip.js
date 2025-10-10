import fs from 'fs';
import path from 'path';

// Command configuration
export const meta = {
  name: "vip",
  aliases: [],
  version: "0.0.1",
  type: "anyone",
  category: "system",
  description: "VIP management command",
  cooldown: 0,
  guide: "[add/list/remove]",
  author: "ShawnDesu"
};

// Command initialization
export async function onStart({ bot, response, msg, args, usages }) {
  // Define the path to the vip.json file in the setup folder
  const vipPath = path.join(process.cwd(), 'setup', 'vip.json');

  // Read the vip file
  let vip;
  try {
    vip = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
  } catch (error) {
    console.error("Error reading vip.json:", error);
    return response.reply("An error occurred while accessing the VIP list.");
  }

  let vipList = vip.uid || [];
  let admins = global.settings.admin || [];
  const command = args[0];
  let targetId = args[1] || (msg.reply_to_message ? msg.reply_to_message.from.id : null);

  // Extract user ID from reply or args
  if (msg.reply_to_message && !targetId) {
    targetId = msg.reply_to_message.from.id;
  } else if (args.length > 1) {
    targetId = args[1];
  }

  // Helper: fetch user info
  async function getUserInfo(userId) {
    try {
      return await bot.getChat(userId);
    } catch (err) {
      console.error("Error fetching user info:", err);
      return null;
    }
  }

  // LIST
  if (command === "list") {
    if (vipList.length === 0) {
      return response.reply("There are currently no VIPs.");
    }
    let output = "List of VIPs:\n\n";
    for (let id of vipList) {
      const userInfo = await getUserInfo(id);
      if (userInfo) {
        const name = userInfo.first_name + ' ' + (userInfo.last_name || '');
        output += `${global.settings.symbols || ''} ${name}\n` +
                  `https://t.me/${userInfo.username || id}\n\n`;
      }
    }
    return response.reply(output);
  }

  // ADD
  if (["add", "-a", "a"].includes(command)) {
    if (!admins.includes(msg.from.id.toString())) {
      return response.reply("You don't have permission to use this command. Only admins can use this method.");
    }
    const id = parseInt(targetId);
    if (isNaN(id)) {
      return response.reply("⚠️ The ID provided is invalid.");
    }
    if (vipList.includes(id.toString())) {
      return response.reply("This user is already a VIP.");
    }
    vipList.push(id.toString());
    vip.uid = vipList;

    // Save
    try {
      fs.writeFileSync(vipPath, JSON.stringify(vip, null, 2), 'utf8');
    } catch (err) {
      console.error("Error writing vip.json:", err);
      return response.reply("Failed to update VIP list.");
    }

    const userInfo = await getUserInfo(id);
    const name = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return response.reply(`${name} has been successfully added as a VIP.`);
  }

  // REMOVE
  if (["remove", "-r", "r"].includes(command)) {
    if (!admins.includes(msg.from.id.toString())) {
      return response.reply("You don't have permission to use this command. Only admins can use this method.");
    }
    if (vipList.length === 0) {
      return response.reply("There are no VIPs to remove.");
    }
    const id = parseInt(targetId);
    if (isNaN(id)) {
      return response.reply("⚠️ The ID provided is invalid.");
    }
    if (!vipList.includes(id.toString())) {
      return response.reply("This user is not a VIP.");
    }
    vip.uid = vipList.filter(v => v !== id.toString());

    // Save
    try {
      fs.writeFileSync(vipPath, JSON.stringify(vip, null, 2), 'utf8');
    } catch (err) {
      console.error("Error writing vip.json:", err);
      return response.reply("Failed to update VIP list.");
    }

    const userInfo = await getUserInfo(id);
    const name = userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'User';
    return response.reply(`${name} has been successfully removed as a VIP.`);
  }

  // Unknown
  return usages();
}
