import axios from "axios";

export const meta = {
  name: "grok",
  version: "1.0.0",
  aliases: [],
  description: "Ask Grok AI anything",
  author: "@nekorinnn",
  prefix: "both",
  category: "ai",
  type: "anyone",
  cooldown: 5,
  guide: "[your question]"
};

export async function onStart({ bot, args, response, msg, usages }) {
  try {
    const question = args.join(" ");
    if (!question) {
      return usages();
    }

    const apiResponse = await axios.get(
      `${global.api.neko}/ai/grok-3?text=${encodeURIComponent(question)}`
    );

    if (apiResponse.data && apiResponse.data.result) {
      // Replace any **word** with *word* for Telegram Markdown bold
      const formatted = apiResponse.data.result.replace(
        /\*\*(.+?)\*\*/g,
        (_, content) => `*${content}*`
      );
      return response.reply(formatted, { parse_mode: "Markdown" });
    } else {
      return response.reply(
        "Grok AI couldn't generate a response. Please try again later."
      );
    }
  } catch (error) {
    console.error(`[ ${meta.name} ] »`, error);
    return response.reply(
      `[ ${meta.name} ] » An error occurred while connecting to Grok AI.`
    );
  }
}
