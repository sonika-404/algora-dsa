import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

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
- Intuition & Mental Model
- Step-by-Step Approach & Logic (including edge cases)
- Clean Implementation (with comments)
- Complexity Analysis (Time & Space in Big-O)`;

async function askDSA(prompt) {
  const candidateModels = ["gemini-3.7-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      console.log(response.text);
      return;
    } catch (err) {
      console.warn(`Model ${model} failed (${err.message}). Trying fallback...`);
    }
  }

  console.error("All models failed to respond. Please check your API key and network connection.");
}

askDSA("Explain the Sliding Window technique with an example problem.");