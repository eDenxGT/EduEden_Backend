const { GoogleGenerativeAI } = require("@google/generative-ai");

const ETHEN_AI_API_KEY =
  process.env.GEMINI_API_KEY_CHAT_BOT || process.env.GEMINI_API_KEY;

const ethenAi = new GoogleGenerativeAI(ETHEN_AI_API_KEY);

const ethenAiModel = ethenAi.getGenerativeModel({model: "gemini-1.5-flash"});

// const ethenAiModel = ethenAi.getGenerativeModel({model: "gemini-2.0-flash-exp"});

module.exports = ethenAiModel;
