import axios from 'axios';

export const meta = {
  name: "venice",
  version: "0.0.1",
  aliases: [],
  description: "Ask Venice AI anything",
  author: "ShawnDesu",
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
      `${global.api.neko}/ai/veniceai?text=${encodeURIComponent(question)}`
    );

    if (apiResponse.data && apiResponse.data.status && apiResponse.data.result) {
      const formatted = apiResponse.data.result.replace(
        /\*\*(.+?)\*\*/g,
        (_, content) => `*${content}*`
      );
      return response.reply(formatted, { parse_mode: "Markdown" });
    } else {
      return response.reply(
        "Venice AI couldn't generate a response. Please try again later."
      );
    }
  } catch (error) {
    console.error(`[ ${meta.name} ] »`, error);
    return response.reply(
      `[ ${meta.name} ] » An error occurred while connecting to Venice AI.`
    );
  }
}