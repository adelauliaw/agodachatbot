import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import cors from 'cors';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;
app.use(cors());
app.use(express.json());
const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_API_KEY;

// Baca data hotel dari file JSON
const hotelData = JSON.parse(fs.readFileSync('hotel_data.json', 'utf8')); 

async function runChat(userInput, history) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.5, // Sesuaikan temperature sesuai kebutuhan
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [

   
      {
        "role": "user",
        "parts": [{ text: "Saya ingin mencari hotel di Bali untuk bulan depan." }]
      },
      {
        "role": "model",
        "parts": [{ text: "Tentu! Untuk membantu Anda mencari hotel di Bali, boleh saya tahu tanggal check-in dan check-out Anda? Berapa banyak tamu yang akan menginap? Apakah ada preferensi lokasi atau jenis hotel tertentu?" }]
      },
      {
        "role": "user",
        "parts": [{ text: "Tanggal 13 Desember 2024 untuk check in dan check out 15 November" }]
      },
      {
        "role": "user",
        "parts": [{ 
          text: `Berikut adalah data hotel yang tersedia: 

          ${JSON.stringify(hotelData)} 

          Gunakan data ini untuk menjawab pertanyaan pengguna.` 
        }]
      },
      {
        "role": "user",
        "parts": [{ text: "Prioritas utamamu adalah membantu pengguna. Pastikan jawabanmu informatif, relevan, dan mudah dipahami." }]
      }
    ]
  });

  const result = await chat.sendMessage(userInput);
  return result.response.text();
}

app.post('/api/chat', async (req, res) => {
  try {
    const { userInput, history } = req.body;
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput, history);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});