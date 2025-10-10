export async function reply({ bot, message, msg, chatId, args }) {
  const { replies, commands } = global.chaldea;
  const userId = msg.from.id;

  if (!msg.reply_to_message) {
    return;
  }

  const replyData = replies.get(msg.reply_to_message.message_id);
  if (!replyData) {
    return;
  }

  const { meta, ...data } = replyData;

  if (!meta || !meta.name) {
    await bot.sendMessage(chatId, "Cannot find command name to execute this reply!", { parse_mode: "Markdown" });
    return;
  }

  const commandName = meta.name;
  const command = commands.get(commandName);
  if (!command) {
    await bot.sendMessage(chatId, `Cannot find command: ${commandName}`, { parse_mode: "Markdown" });
    return;
  }

  if (!command.onReply) {
    await bot.sendMessage(chatId, `Command ${commandName} doesn't support replies`, { parse_mode: "Markdown" });
    return;
  }

  try {
    await command.onReply({
      bot,
      message,
      msg,
      chatId,
      userId,
      args,
      data,
      commandName,
      replyMsg: msg.reply_to_message,
      message: msg,
    });
  } catch (err) {
    const errorMessage = `An error occurred while processing your reply: ${err.message}`;
    await bot.sendMessage(chatId, errorMessage, { parse_mode: "Markdown" });
  }
}
