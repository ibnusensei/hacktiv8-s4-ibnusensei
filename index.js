import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import cors from "cors";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({});

// inisialisasi model AI
const geminiModels = {
    text: "gemini-2.5-flash-lite",
    image: "gemini-2.5-flash",
    audio: "gemini-2.5-flash",
    document: "gemini-2.5-flash-lite"
};

// inisialisasi aplikasi back-end/server
app.use(cors()); // .use() --> panggil/bikin middleware
// app.use(() => {}); --> pakai middleware sendiri
app.use(express.json()); // --> untuk membolehkan kita menggunakan 'Content-Type: application/json' di header

// inisialisasi route-nya
// .get(), .post(), .put(), .patch(), .delete() --> yang paling umum dipakai
// .options() --> lebih jarang dipakai, karena ini lebih ke preflight (untuk CORS umumnya)

app.post('/generate-text', async (req, res) => {
    // handle bagaimana request diterima oleh user
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
        res.status(400).json({ message: "Pesan tidak ada atau format-nya tidak sesuai." });
        return; // keluar lebih awal dari handler
    }

    const response = await ai.models.generateContent({
        contents: message,
        model: geminiModels.text
    });

    res.status(200).json({
        reply: response.text
    });
});

// /generate-from-image
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    // handle bagaimana request diterima oleh user
    const image = req.file;

    if (!image) {
        res.status(400).json({ message: "Gambar tidak ada atau format-nya tidak sesuai." });
        return; // keluar lebih awal dari handler
    }

    // simpan file-nya ke local storage (sementara)
    const imagePath = `./uploads/${Date.now()}-${image.originalname}`;
    await fs.writeFile(imagePath, image.buffer);

    const response = await ai.models.generateContent({
        contents: imagePath,
        model: geminiModels.image
    });

    // hapus file-nya dari local storage
    await fs.unlink(imagePath);

    res.status(200).json({
        reply: response.text
    });
});

// /generate-from-document
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    // handle bagaimana request diterima oleh user
    const document = req.file;

    if (!document) {
        res.status(400).json({ message: "Dokumen tidak ada atau format-nya tidak sesuai." });
        return; // keluar lebih awal dari handler
    }

    // simpan file-nya ke local storage (sementara)
    const documentPath = `./uploads/${Date.now()}-${document.originalname}`;
    await fs.writeFile(documentPath, document.buffer);

    const response = await ai.models.generateContent({
        contents: documentPath,
        model: geminiModels.document
    });

    // hapus file-nya dari local storage
    await fs.unlink(documentPath);

    res.status(200).json({
        reply: response.text
    });
});

// /generate-from-audio
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    // handle bagaimana request diterima oleh user
    const audio = req.file;

    if (!audio) {
        res.status(400).json({ message: "Audio tidak ada atau format-nya tidak sesuai." });
        return; // keluar lebih awal dari handler
    }

    // simpan file-nya ke local storage (sementara)
    const audioPath = `./uploads/${Date.now()}-${audio.originalname}`;
    await fs.writeFile(audioPath, audio.buffer);

    const response = await ai.models.generateContent({
        contents: audioPath,
        model: geminiModels.audio
    });

    // hapus file-nya dari local storage
    await fs.unlink(audioPath);

    res.status(200).json({
        reply: response.text
    });
});

// panggil si app-nya di sini
const port = 3000;

app.listen(port, () => {
    console.log("I LOVE YOU", port);
});
