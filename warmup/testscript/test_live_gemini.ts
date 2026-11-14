import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

async function testLiveKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment.");
    process.exit(1);
  }

  console.log(`🔑 Testing API Key: ${apiKey.slice(0, 10)}... (length: ${apiKey.length})`);
  const ai = new GoogleGenAI({ apiKey });

  const candidateModels = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  for (const model of candidateModels) {
    try {
      console.log(`\n▶ Pinging model '${model}'...`);
      const res = await ai.models.generateContent({
        model,
        contents: [{ text: "Hello! Return a JSON with { status: 'ONLINE', model: string }" }],
        config: {
          responseMimeType: "application/json"
        }
      });
      console.log(`✅ SUCCESS with '${model}':`, res.text);
      return;
    } catch (err: any) {
      console.warn(`⚠️ Model '${model}' call returned:`, err?.message || err);
    }
  }

  console.log("\nFinished probing candidate models.");
}

testLiveKey().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
