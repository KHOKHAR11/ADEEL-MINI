const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

let autoSongTimer = null;
let targetJid = null;
let sentToday = new Set();
let lastDate = new Date().toDateString();
let lastSentVideoId = null;

module.exports = {
  name: "autosong",
  aliases: ["asong"],
  category: "download",
  desc: "Auto send Hindi, Urdu & Pakistani songs (1-9 min) every 10 minutes",
  usage: ".autosong <jid> | .autosong stop",

  async execute(context) {
    const { sock, socket, reply, args, react, config, from } = context;
    const client = sock || socket;

    try {
      if (args[0] === "stop") {
        if (autoSongTimer) {
          clearInterval(autoSongTimer);
          autoSongTimer = null;
          targetJid = null;
          lastSentVideoId = null;
          await react("🛑");
          return reply("🛑 AutoSong stopped successfully.");
        }
        return reply("ℹ️ AutoSong is not running.");
      }

      if (args[0] === "status") {
        if (autoSongTimer && targetJid) {
          return reply(`📊 *AutoSong Status*\n\n✅ Running\n📍 Target: ${targetJid}\n🎵 Songs sent today: ${sentToday.size}`);
        }
        return reply("❌ AutoSong is not currently running.");
      }

      if (!args[0]) {
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🎵 *AUTO SONG*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .autosong <jid>
┃  .autosong stop
┃  .autosong status
┃━━━━━━━━━━━━━━━
┃  📌 *Example:*
┃  .autosong 120363...@newsletter
╰━━━━━━━━━━━━━━━╯`);
      }

      if (autoSongTimer) {
        return reply("⚠️ AutoSong already running. Stop it first with .autosong stop");
      }

      targetJid = args[0].trim();
      if (!targetJid.includes("@")) {
        return reply("❌ Invalid JID format. Use format like: 0029VbBmz4V5vKAIaWfYPT0C@newsletter or 923xxxxxxxxx@s.whatsapp.net");
      }

      const isNewsletter = targetJid.endsWith("@newsletter");
      const INTERVAL_MIN = 10;
      const INTERVAL_MS = INTERVAL_MIN * 60 * 1000;

      await react("▶️");
      await reply(
        `╭━━━━━━━━━━━━━━━╮
┃  🎶 *AUTOSONG STARTED*
┃━━━━━━━━━━━━━━━
┃  ⏱ Interval: 10 minutes
┃  📍 Target: ${isNewsletter ? "Channel" : "Chat"}
┃  🎵 Duration: 1-9 min
┃  ✅ Status: Running
╰━━━━━━━━━━━━━━━╯

> Powered by Adeel-mini`
      );

      const sendSong = async () => {
        try {
          const today = new Date().toDateString();
          if (today !== lastDate) {
            sentToday.clear();
            lastDate = today;
          }

          const keywords = [
            "latest hindi song",
            "romantic hindi song",
            "bollywood hit song",
            "lofi hindi song",
            "urdu romantic song",
            "urdu ghazal",
            "urdu love song",
            "pakistani song",
            "pakistani romantic song",
            "coke studio pakistan",
            "pakistani ost",
            "atif aslam song",
            "rahat fateh ali khan song"
          ];

          const query = keywords[Math.floor(Math.random() * keywords.length)];
          const search = await yts(query);
          
          if (!search?.videos?.length) {
            console.log("AutoSong: No videos found for query:", query);
            return;
          }

          const candidates = search.videos.filter(v =>
            v.seconds >= 60 &&
            v.seconds <= 540 &&
            !sentToday.has(v.videoId) &&
            v.videoId !== lastSentVideoId
          );

          if (!candidates.length) {
            console.log("AutoSong: No suitable candidates found");
            return;
          }

          const video = candidates[Math.floor(Math.random() * candidates.length)];
          lastSentVideoId = video.videoId;
          
          const apiUrl = `https://zaynixapi12.vercel.app/api/ytmp3-fixed?url=${encodeURIComponent(video.url)}&apiKey=${config?.ZAYNIX_API || "zaynixapi"}`;

          const { data } = await axios.get(apiUrl, { timeout: 60000 });
          const mp3Url = data?.result?.download || data?.result?.url || data?.result?.mp3 || data?.url || data?.mp3;

          if (!mp3Url) {
            console.log("AutoSong: No MP3 URL found in API response");
            return;
          }

          const audioResponse = await axios.get(mp3Url, {
            responseType: "arraybuffer",
            timeout: 120000
          });
          const audioBuffer = Buffer.from(audioResponse.data);

          const caption = `╭━━━━━━━━━━━━━━━╮
┃  🎶 *AUTO SONG*
┃━━━━━━━━━━━━━━━
┃  🎧 ${video.title.substring(0, 40)}
┃  ⏱ Duration: ${video.timestamp}
┃  📅 ${video.ago}
┃  🔁 Next: 10 minutes
╰━━━━━━━━━━━━━━━╯

> Powered by Adeel-mini`;

          if (isNewsletter) {
            try {
              await client.sendMessage(targetJid, {
                document: audioBuffer,
                mimetype: "audio/mpeg",
                fileName: `${video.title.replace(/[^\w\s-]/g, '').substring(0, 50)}.mp3`,
                caption: caption
              });
            } catch (channelErr) {
              console.log("AutoSong: Channel send failed:", channelErr.message);
            }
          } else {
            await client.sendMessage(targetJid, {
              audio: audioBuffer,
              mimetype: "audio/mpeg",
              ptt: false,
              contextInfo: {
                externalAdReply: {
                  title: video.title.substring(0, 40),
                  body: `Duration: ${video.timestamp}`,
                  thumbnailUrl: video.thumbnail,
                  mediaType: 2,
                  sourceUrl: video.url
                }
              }
            });
          }

          sentToday.add(video.videoId);
          console.log(`AutoSong: Sent "${video.title}" to ${targetJid}`);

        } catch (err) {
          console.error("AutoSong error:", err.message);
        }
      };

      await sendSong();
      autoSongTimer = setInterval(sendSong, INTERVAL_MS);

    } catch (error) {
      console.error("AutoSong execute error:", error);
      await reply(`❌ Error: ${error.message}`);
    }
  }
};
