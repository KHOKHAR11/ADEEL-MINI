const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

let runningJobs = {};
let usedSongs = new Set();

module.exports = {
  name: "autosong",
  category: "music",
  desc: "Auto play Hindi / Pakistani / Coke Studio songs",
  usage: ".autosong on <jid> / .autosong off",

  async execute(context) {
    const { sock, reply, args, react, config } = context;

    if (!args.length) {
      return reply("Usage:\n.autosong on <jid>\n.autosong off");
    }

    const mode = args[0].toLowerCase();

    if (mode === "off") {
      runningJobs = {};
      usedSongs = new Set();
      return reply("Auto Song Stopped.");
    }

    if (mode !== "on") {
      return reply("Invalid command. Use:\n.autosong on <jid>");
    }

    const targetJid = args[1];
    if (!targetJid) {
      return reply("Please provide JID.\nExample:\n.autosong on 12036xxxxx@newsletter");
    }

    if (runningJobs[targetJid]) {
      return reply("Already Running for this JID.");
    }

    runningJobs[targetJid] = true;

    reply(`Auto Song Scheduler Started for:\n${targetJid}\nAllowed: Hindi / Pakistani / Coke Studio\nBlocked: Ghazal / Qawwali / Poetry / Naat / Sad Urdu`);

    const loop = async () => {
      if (!runningJobs[targetJid]) return;

      try {
        await react("🎧");

        const allowedKeywords = [
          "hindi song",
          "bollywood hit",
          "bollywood romantic",
          "pakistani song",
          "pakistani pop",
          "coke studio pakistan",
          "atif aslam",
          "rahat fateh ali khan",
          "arijit singh",
          "jubin nautiyal"
        ];

        const blacklist = [
          "ghazal",
          "qawwali",
          "naat",
          "poetry",
          "sad urdu",
          "urdu",
          "gham",
          "mehfil"
        ];

        const query = allowedKeywords[Math.floor(Math.random() * allowedKeywords.length)];

        const search = await yts(query);
        if (!search?.videos?.length) return;

        const video = search.videos.find(
          v =>
            v.seconds >= 60 &&
            v.seconds <= 600 &&
            !usedSongs.has(v.videoId) &&
            !blacklist.some(b => v.title.toLowerCase().includes(b))
        );

        if (!video) return;

        usedSongs.add(video.videoId);

        const apiKey = config?.ZAYNIX_API || "zaynixapi";
        const apiUrl = `https://zaynixapi12.vercel.app/api/ytmp3-fixed?url=${encodeURIComponent(video.url)}&apiKey=${apiKey}`;

        const { data: apiRes } = await axios.get(apiUrl, { timeout: 60000 });

        const mp3Url =
          apiRes?.result?.download ||
          apiRes?.result?.url ||
          apiRes?.mp3 ||
          apiRes?.url;

        if (!mp3Url) return;

        const id = Date.now();
        const mp3 = path.join(__dirname, `auto_${id}.mp3`);
        const opus = path.join(__dirname, `auto_${id}.opus`);

        const buffer = await axios.get(mp3Url, { responseType: "arraybuffer" });
        fs.writeFileSync(mp3, Buffer.from(buffer.data));

        await new Promise((resolve, reject) => {
          ffmpeg(mp3)
            .audioCodec("libopus")
            .audioBitrate("64k")
            .audioChannels(1)
            .audioFrequency(48000)
            .outputOptions(["-application", "voip", "-vn", "-map_metadata", "-1"])
            .format("opus")
            .on("end", resolve)
            .on("error", reject)
            .save(opus);
        });

        const caption = `
🎶 Auto Song start 

🎧 ${video.title}
⏱ ${video.timestamp}

Languages: Hindi / Pakistani / Coke Studio
        `.trim();

        await sock.sendMessage(targetJid, {
          image: { url: video.thumbnail },
          caption
        });

        await sock.sendMessage(targetJid, {
          audio: fs.readFileSync(opus),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        });

        fs.unlinkSync(mp3);
        fs.unlinkSync(opus);

        await react("✅");

      } catch (err) {
        console.log("AutoSong Error:", err);
      }

      if (runningJobs[targetJid]) {
        setTimeout(loop, 10 * 60 * 1000);
      }
    };

    loop();
  }
};
