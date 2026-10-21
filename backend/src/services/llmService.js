const { GoogleGenAI } = require('@google/genai');

const MODEL = process.env.LLM_MODEL || 'gemini-3.8-flash';
const TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 12000;

let client = null;
const getClient = () => {
  if (!process.env.LLM_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
  return client;
};

const isConfigured = () => Boolean(process.env.LLM_API_KEY);

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM request timed out')), ms)),
  ]);

/**
 * Generates plain text from the LLM. Throws on missing key, timeout or API error
 * so callers can fall back to deterministic logic.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
const generateText = async (prompt) => {
  const ai = getClient();
  if (!ai) throw new Error('LLM_API_KEY not configured');
  const interaction = await withTimeout(
    ai.interactions.create({ model: MODEL, input: prompt }),
    TIMEOUT_MS
  );
  const text = interaction.output_text;
  if (!text) throw new Error('Empty LLM response');
  return text.trim();
};

/**
 * Generates JSON from the LLM. Strips markdown fences and parses.
 * @param {string} prompt
 * @returns {Promise<any>}
 */
const generateJson = async (prompt) => {
  const text = await generateText(
    `${prompt}\n\nRespond with ONLY valid minified JSON. No markdown, no commentary.`
  );
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('LLM returned invalid JSON');
  }
};

module.exports = { generateText, generateJson, isConfigured };
