const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: "csend",
  aliases: ["channelsend", "cvn"],
  category: "music",
  desc: "Send YouTube song as a WhatsApp channel-playable voice note",
  usage: ".csend <jid> <song name>",

  async execute(context) {
    const {
      sock,
      m,
      reply,
      args,
      sender,
      react,
      config,
      sessionConfig
    } = context;

    const cleanUp = (...files) => {
      for (const file of files) {
        if (file && fs.existsSync(file)) fs.unlinkSync(file);
      }
    };

    try {
      if (!args || args.length < 2) {
        return reply(
          "❌ *Invalid Usage*\n\nExample:\n.csend 120363xxxx@newsletter Tum Hi Ho"
        );
      }

      await react("🎧");

      const targetJid = args[0].trim();
      const query = args.slice(1).join(" ").trim();

      const search = await yts(query);
      if (!search?.videos?.length) {
        return reply("❌ No results found on YouTube.");
      }

      const video = search.videos[0];

      // Extract duration safely
      const videoDuration =
        Number(video.seconds) ||
        Number(video.duration?.seconds) ||
        0;

      // FIXED: convert config duration to number
      const maxDuration = Number(config?.MAX_AUDIO_DURATION) || 600;

      if (videoDuration > maxDuration) {
        return reply(
          `❌ Audio too long.\nMax allowed: ${Math.floor(
            maxDuration / 60
          )} minutes`
        );
      }

      await react("⬇️");

      const apiUrl = `https://zaynixapi12.vercel.app/api/ytmp3-fixed?url=${encodeURIComponent(
        video.url
      )}&apiKey=${config?.ZAYNIX_API || "zaynixapi"}`;

      const { data: apiRes } = await axios.get(apiUrl, {
        timeout: 60000
      });

      const downloadUrl =
        apiRes?.result?.download ||
        apiRes?.result?.url ||
        apiRes?.result?.mp3 ||
        apiRes?.url ||
        apiRes?.mp3;

      if (!downloadUrl) {
        console.error("API RESPONSE:", apiRes);
        return reply("❌ Failed to fetch MP3 from API.");
      }

      const uid = Date.now();
      const mp3Path = path.join(__dirname, `csend_${uid}.mp3`);
      const opusPath = path.join(__dirname, `csend_${uid}.ogg`);

      const mp3Buffer = await axios.get(downloadUrl, {
        responseType: "arraybuffer"
      });
      fs.writeFileSync(mp3Path, Buffer.from(mp3Buffer.data));

      await react("🔄");

      await new Promise((resolve, reject) => {
        ffmpeg(mp3Path)
          .noVideo()
          .audioCodec("libopus")
          .audioChannels(1)
          .audioFrequency(48000)
          .audioBitrate("64k")
          .outputOptions([
            "-application voip",
            "-map_metadata -1",
            "-vn"
          ])
          .format("ogg")
          .on("end", resolve)
          .on("error", reject)
          .save(opusPath);
      });

      let targetName = targetJid;
      try {
        const meta = await sock.newsletterMetadata("jid", targetJid);
        if (meta?.name) targetName = meta.name;
      } catch {}

      const caption = `
🎶 *Now Playing*
━━━━━━━━━━━━━━━
🎧 *Title:* ${video.title}
👤 *Channel:* ${video.author?.name || "YouTube"}
👁️ *Views:* ${video.views.toLocaleString()}
⏱️ *Duration:* ${video.timestamp}
📅 *Uploaded:* ${video.ago}

${sessionConfig?.SONG_FOOTER || config?.SONG_FOOTER || "Powered by Adeel Music"}

🔗 Sent to: *${targetName}*
━━━━━━━━━━━━━━━
      `.trim();

      await sock.sendMessage(targetJid, {
        image: { url: video.thumbnail },
        caption
      });

      await sock.sendMessage(targetJid, {
        audio: fs.readFileSync(opusPath),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      });

      await sock.sendMessage(sender, {
        text: `✅ *${video.title}* successfully delivered to *${targetName}*`
      });

      await react("✅");

      cleanUp(mp3Path, opusPath);

    } catch (err) {
      console.error("csend fatal error:", err);
      await react("❌");
      reply("❌ Failed to process the request. Please try again later.");
    }
  }
};
