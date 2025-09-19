import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import cors from "cors";

const app = express();
const upload = multer();
// const ai = new GoogleGenAI({});
// Inisialisasi model dengan API Key langsung
const ai = new GoogleGenAI({});
// -------------------------

// Fungsi bantuan untuk mengekstrak teks dari respons Google AI
function extractText(response) {
  try {
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return text;
    } else {
      console.warn("Could not extract text from response:", JSON.stringify(response, null, 2));
      return "Tidak dapat mengekstrak respons teks dari AI.";
    }
  } catch (e) {
    console.error("Error in extractText function:", e);
    return "Terjadi kesalahan saat memproses respons AI.";
  }
}

// inisialisasi model AI
const geminiModels = {
  text: "gemini-2.5-pro",
  image: "gemini-2.5-flash",
  audio: "gemini-2.5-flash",
  document: "gemini-2.5-flash-lite",
};

app.use(cors());
app.use(express.json());

app.post("/generate-text", async (req, res) => {
  // stateful chat history
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "Riwayat chat tidak valid." });
    }
    const resp = await ai.models.generateContent({
      model: geminiModels.text,
      contents: history.flatMap(item => item.parts),
    });
    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
        return res.status(400).json({ error: "File gambar tidak ditemukan." });
    }
    const { prompt } = req.body;
    const imageBase64 = req.file.buffer.toString("base64");
    const resp = await ai.models.generateContent({
      model: geminiModels.image,
      contents: [
        { text: prompt || "Jelaskan gambar ini." },
        { inlineData: { mimeType: req.file.mimetype, data: imageBase64 } },
      ],
    });
    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/generate-from-document", upload.single("document"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "File dokumen tidak ditemukan." });
        }
        const { prompt } = req.body;
        const docBase64 = req.file.buffer.toString("base64");
        const resp = await ai.models.generateContent({
            model: geminiModels.document,
            contents: [
                { text: prompt || "Ringkas dokumen berikut:" },
                { inlineData: { mimeType: req.file.mimetype, data: docBase64 } },
            ],
        });
        res.json({ result: extractText(resp) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "File audio tidak ditemukan." });
        }
        const { prompt } = req.body;
        const audioBase64 = req.file.buffer.toString("base64");
        const resp = await ai.models.generateContent({
            model: geminiModels.audio,
            contents: [
                { text: prompt || "Transkrip audio berikut:" },
                { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } },
            ],
        });
        res.json({ result: extractText(resp) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const port = 3000;
app.listen(port, () => {
  console.log("Server berjalan di port", port);
});