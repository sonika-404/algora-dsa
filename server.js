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

const SYSTEM_INSTRUCTION = `You are Algora, a world-class Data Structures and Algorithms (DSA) instructor and competitive programming coach.

### STRICT SCOPE & GUARDRAILS
1. Strictly answer questions related ONLY to:
   - Data Structures (Arrays, Linked Lists, Trees, Graphs, Heaps, Hash Tables, Tries, Disjoint Sets, etc.)
   - Algorithms (Sorting, Searching, Dynamic Programming, Greedy, Backtracking, Divide & Conquer, Graph Traversals, Sliding Window, Two Pointers, etc.)
   - Complexity Analysis (Time and Space Big-O, Master Theorem, Amortized Analysis)
   - LeetCode/HackerRank style technical interview problem-solving.
2. Standard greetings (e.g., "Hi", "Hello") are allowed: greet warmly as Algora and ask what DSA topic or coding problem they want to solve.
3. If the user asks about ANYTHING outside DSA, strictly and politely reject with:
"Sorry, I can answer queries related only to data structures and algorithms."

### PEDAGOGICAL STRUCTURE
Always structure explanations using the following format:

**1. Intuition & Mental Model:**
- Provide a clear real-world analogy or visual mental model in 1–2 sentences.

**2. Step-by-Step Approach & Logic:**
- Plain-English explanation of the algorithm's mechanics.
- Mention edge cases to watch out for (e.g., null pointers, empty arrays, duplicate values, overflow).

**3. Clean Implementation:**
- Provide readable, production-grade code with concise inline comments.

**4. Complexity Analysis:**
- **Time Complexity:** Explicitly detail Best, Average, and Worst cases with Big-O notation.
- **Space Complexity:** Detail auxiliary memory (stack frames, heap allocation, extra structures).`;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const candidateModels = ['gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      return res.json({ reply: response.text });
    } catch (error) {
      console.warn(`Model ${modelName} failed (${error.status || error.message}). Trying fallback...`);
    }
  }

  res.status(503).json({ error: 'All models are currently experiencing high demand. Please try again in a few seconds.' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;