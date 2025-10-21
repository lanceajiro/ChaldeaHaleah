import axios from "axios";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

export const meta = {
  name: "downloader",
  keyword: [
    "https://vt.tiktok.com",
    "https://www.tiktok.com/",
    "https://www.facebook.com",
    "https://www.instagram.com/",
    "https://youtu.be/",
    "https://youtube.com/",
    "https://x.com/",
    "https://twitter.com/",
    "https://vm.tiktok.com",
    "https://fb.watch",
  ], // URLs to detect
  aliases: [],
  version: "1.0.1",
  author: "Dipto",
  description: "Auto downloads videos from social media platforms.",
  guide: ["[video_link]"],
  cooldown: 0,
  type: "anyone",
  category: "media",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function onStart({ bot, msg, chatId }) {
  await bot.sendMessage(chatId, "Send a video link, and I'll download it for you!", {
    parse_mode: "HTML",
  });
}

export async function onWord({ bot, msg, chatId, args }) {
  // prefer msg.text or msg.caption (if message is a captioned media)
  const messageText = (msg.text || msg.caption || "").trim();

  // find a supported URL anywhere in the message
  const detectedUrl = meta.keyword.find((url) => messageText.includes(url));
  if (!detectedUrl) return;

  const messageId = msg.message_id;
  let waitMessageId = null;

  try {
    // send processing message (we'll delete it later)
    const wait = await bot.sendMessage(chatId, "⏳ Processing your request...", {
      reply_to_message_id: messageId,
    });
    waitMessageId = wait.message_id;

    const tempDir = path.join(__dirname, "..", "..", "temp");
    // ensure temp dir exists
    fs.mkdirSync(tempDir, { recursive: true });

    const videoPath = path.join(tempDir, `downloaded_video_${Date.now()}.mp4`);

    // call downloader API (make sure global.api.dipto is defined in your environment)
    const apiUrl = `${global.api.dipto}/dipto/alldl?url=${encodeURIComponent(messageText)}`;
    const apiRes = await axios.get(apiUrl).catch((e) => {
      throw new Error("Failed to contact download API: " + (e.message || e));
    });

    const apiData = apiRes?.data;
    if (!apiData || !apiData.result) {
      throw new Error("Download API did not return a valid result URL.");
    }

    const downloadUrl = apiData.result;

    // fetch the actual video as arraybuffer
    const videoResp = await axios.get(downloadUrl, { responseType: "arraybuffer" });

    // write binary file
    fs.writeFileSync(videoPath, Buffer.from(videoResp.data));

    // delete processing message (best-effort)
    try {
      if (waitMessageId) await bot.deleteMessage(chatId, waitMessageId);
    } catch (e) {
      // ignore delete errors
    }

    // send the video file (using a stream/readable path). Pass options in one object.
    await bot.sendVideo(chatId, fs.createReadStream(videoPath), {
      caption: `${apiData.cp || ""} ✅`,
      reply_to_message_id: messageId,
      filename: "video.mp4",
      contentType: "video/mp4",
    });

    // cleanup
    try {
      fs.unlinkSync(videoPath);
    } catch (e) {
      // ignore cleanup errors
    }
  } catch (error) {
    // try to remove processing message if it exists
    try {
      if (waitMessageId) await bot.deleteMessage(chatId, waitMessageId);
    } catch (e) {
      // ignore
    }

    await bot.sendMessage(chatId, `❎ Error: ${error.message || String(error)}`);
  }
}
