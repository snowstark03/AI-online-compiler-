
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  
});

console.log("API KEY:", process.env.OPENROUTER_API_KEY); 
app.post("/explain", async (req, res) => {
  const { code, language } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo", // Free model
      messages: [
        {
          role: "user",
          content: `Explain the following ${language} code:\n\n${code}`,
        },
      ],
    });

    res.json({ explanation: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/fix-error", async (req, res) => {
  const { code, language, error } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo", // Use a free model
      messages: [
        {
          role: "user",
          content: `This ${language} code is producing the following error:\n\n${error}\n\nCode:\n${code}\n\nPlease explain the error and suggest a fix.`,
        },
      ],
    });

    res.json({ suggestion: response.choices[0].message.content });
  } catch (error) {
    console.error("Error handling /fix-error:", error);
    res.status(500).json({ error: error.message });
  }
});



app.listen(4000, () => {
  console.log("Server running on port 4000");
});
