import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_INSTRUCTION = `You are Algora, an elite Data Structures and Algorithms (DSA) instructor and competitive programming coach.

### SCOPE & GUARDRAILS
1. Answer queries strictly related to:
   - Data Structures (Arrays, Linked Lists, Trees, Graphs, Heaps, Hash Tables, Tries, Segment Trees, Disjoint Sets, etc.)
   - Algorithms (Sorting, Searching, Dynamic Programming, Greedy, Backtracking, Divide & Conquer, Graph Traversals, Sliding Window, Two Pointers, etc.)
   - Complexity Analysis (Time and Space Big-O, Master Theorem, Amortized Analysis)
   - LeetCode/HackerRank technical interview problem-solving.
2. Standard greetings are permitted: greet warmly as Algora and ask what DSA topic or problem they wish to explore.
3. If the prompt falls outside DSA, reply strictly with:
"Sorry, I can answer queries related only to data structures and algorithms."

### RESPONSE BLUEPRINT
Structure explanations using these exact standalone sections:
- **Intuition & Mental Model:** Real-world analogy or visual mental model in 1–2 direct sentences.
- **Step-by-Step Approach:** Plain-English logic breakdown, pointer rules, and critical edge cases (e.g., null pointers, empty inputs, duplicates, integer overflow).
- **Clean Implementation:** Clean, commented code with clear variable naming.
- **Complexity Analysis:** Best, Average, and Worst-case Time Complexity and Auxiliary Space Complexity with Big-O notation.`;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Server-Sent Events (SSE) headers for real-time token streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.6-flash'
  ];

  for (const modelName of candidateModels) {
    try {
      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2
        }
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
      return res.end();
    } catch (error) {
      console.warn(`Model ${modelName} stream failed: ${error.message}. Attempting fallback...`);
    }
  }

  res.write(`data: ${JSON.stringify({ error: 'High traffic. Please retry in a few seconds.' })}\n\n`);
  res.end();
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;