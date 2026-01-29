
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Persistence Layer (Simple JSON File DB) ---

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ tasks: [], projects: [] }, null, 2));
}

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Read DB Error:", err);
    return { tasks: [], projects: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Write DB Error:", err);
    return false;
  }
};

// --- Routes: Data ---

app.get('/api/data', (req, res) => {
  const data = readDB();
  res.json(data);
});

app.post('/api/data', (req, res) => {
  const { tasks, projects } = req.body;
  if (!tasks || !projects) {
    return res.status(400).json({ error: 'Missing tasks or projects data' });
  }
  
  // Merge or Overwrite? For this simple version, we overwrite (sync state)
  writeDB({ tasks, projects });
  res.json({ success: true, message: 'Data saved successfully' });
});

// --- Routes: LLM Proxy ---

app.post('/api/chat', async (req, res) => {
  const { provider, modelId, messages, systemInstruction, jsonMode, apiKey: clientKey } = req.body;

  // Priority: Client Key (if testing) > Server Env Key
  // This allows the server to act as a secure proxy hiding the real key
  const API_KEY = clientKey || process.env.API_KEY; 

  try {
    let resultText = "";

    if (provider === 'gemini') {
      if (!API_KEY) throw new Error("Server missing API_KEY for Gemini");
      
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      // Construct contents from messages
      const lastUserMsg = messages[messages.length - 1].content;
      
      const response = await ai.models.generateContent({
        // Fix: Update default model to gemini-3-flash-preview
        model: modelId || 'gemini-3-flash-preview',
        contents: lastUserMsg,
        config: {
          responseMimeType: jsonMode ? "application/json" : "text/plain",
          systemInstruction: systemInstruction,
        },
      });
      resultText = response.text;

    } else if (provider === 'openai-compatible') {
      const baseUrl = req.body.baseUrl || 'https://api.openai.com/v1';
      // If server is hosting the key, use it. Otherwise expect client key.
      const token = clientKey || process.env.OPENAI_API_KEY; 

      const payload = {
        model: modelId,
        messages: [
          { role: "system", content: systemInstruction || "You are a helpful assistant." },
          ...messages
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined
      };

      const apiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        throw new Error(`Provider API Error: ${apiRes.status} ${errText}`);
      }

      const data = await apiRes.json();
      resultText = data.choices[0]?.message?.content;
    }

    res.json({ text: resultText });

  } catch (error) {
    console.error("LLM Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MarketingFlow Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database file: ${DB_FILE}`);
});
