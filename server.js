import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;


app.post("/api/murf", async (req, res) => {
const { text, voiceType } = req.body;

const voiceId = voiceType === "female"
  ? process.env.MURF_FEMALE_VOICE
  : process.env.MURF_MALE_VOICE;

  try {
    const murfRes = await axios.post(
      "https://api.murf.ai/v1/speech/generate",
      {
        text,
        voiceId,
        format: "mp3",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": process.env.MURF_API_KEY,
        },
      }
    );

    res.json({ audioUrl: murfRes.data.audioFile });
  } catch (err) {
    console.error("Murf API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Murf API failed" });
  }
});


app.post('/api/gemini', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1000, 
          temperature: 0.9,      
          topP: 1,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, no reply.';
    res.json({ reply });

  } catch (error) {
    console.error('Gemini error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Gemini response' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
