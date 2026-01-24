require("dotenv").config();

// Helper: parse list values safely
const parseList = (envVar, fallback) => {
  if (!envVar) return fallback;
  try {
    return JSON.parse(envVar);
  } catch {
    return envVar
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
};

module.exports = {
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb+srv://romekxd01_db_user:XdovTX5ceCurqQqm@zaynix.nxnvqdk.mongodb.net",
  AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || "true",
  AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "false",
  AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
  ANTICALL: process.env.ANTICALL || "false",
  ANTIEDIT: process.env.ANTIEDIT || "false",
  ANTIDELETE: process.env.ANTIDELETE || "false",

  AUTO_LIKE_EMOJI: parseList(
    process.env.AUTO_LIKE_EMOJI,
    ["💋", "🍬", "🫆", "💗", "🎈", "🎉", "🥳", "❤️", "🧫", "🐭"]
  ),

  PREFIX: process.env.PREFIX || ".",
  MODE: process.env.MODE || "public", // public | private
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || "3", 10),

  ADMIN_LIST_PATH: process.env.ADMIN_LIST_PATH || "./lib/admin.json",
  SESSION_BASE_PATH: process.env.SESSION_BASE_PATH || "./session",
  NUMBER_LIST_PATH: process.env.NUMBER_LIST_PATH || "./numbers.json",

  XD_IMAGE_PATH: process.env.XD_IMAGE_PATH || "./data/Adeel.jpg",
  CAPTION: process.env.CAPTION || "ADEEL-MINI :)",

  NEWSLETTER_JID: (
    process.env.NEWSLETTER_JID || "120363403380688821@newsletter"
  ).trim(),

  CHANNEL_LINK:
    process.env.CHANNEL_LINK ||
    "https://whatsapp.com/channel/0029VbBmz4V5vKAIaWfYPT0C",


  OTP_EXPIRY: parseInt(process.env.OTP_EXPIRY || "300000", 10), // ms
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923035512967",

  ZAYNIX_API: process.env.ZAYNIX_API || "zaynixapi",
  SONG_FOOTER:
    process.env.SONG_FOOTER || "🎶 Powered by Adeel Music",

  MAX_AUDIO_DURATION: parseInt(
    process.env.MAX_AUDIO_DURATION || "600",
    10
  ), // seconds

  GROUP_INVITE_LINK:
    process.env.GROUP_INVITE_LINK ||
    "https://chat.whatsapp.com/Lgzkk6HHuZICvYFMigyFrZ?mode=wwt",
  PM2_NAME: process.env.PM2_NAME || "Zaynix-PRIME",
  
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "8174600854:AAHE65a8mCURJc79K0gvmMb5Se16yxa8wqQ",
  TELEGRAM_OWNER_ID: process.env.TELEGRAM_OWNER_ID || "8174600854",
  ALLOWED_USERS: process.env.TELEGRAM_ALLOWED_USERS
    ? process.env.TELEGRAM_ALLOWED_USERS.split(",")
    : ["8174600854"],
  CHAT_ID: process.env.TELEGRAM_CHAT_ID || "8174600854",

  SESSION_SAFETY: {
    RATE_LIMIT_DELAY: parseInt(process.env.RATE_LIMIT_DELAY || "1500", 10),
    MAX_MESSAGES_PER_MINUTE: parseInt(process.env.MAX_MESSAGES_PER_MINUTE || "20", 10),
    ANTI_SPAM_DELAY: parseInt(process.env.ANTI_SPAM_DELAY || "2000", 10),
    CONNECTION_RETRY_DELAY: parseInt(process.env.CONNECTION_RETRY_DELAY || "5000", 10),
  },

  BOT_NAME: process.env.BOT_NAME || "ADEEL-MINI",
  FOUNDER_NAME: process.env.FOUNDER_NAME || "ADEEL",

  DEBUG: process.env.DEBUG === "true"
};
