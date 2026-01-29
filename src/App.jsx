import { useState } from "react";
import { GoogleGenAI } from "@google/genai";

import "./App.css";

function App() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_URL });
  const handleSubmit = (e) => {
    e.preventDefault();
    const newExpense = { title, desc, amount: parseFloat(amount), date };
    setExpenses([...expenses, newExpense]);
    setTitle("");
    setDesc("");
    setAmount("");
    setDate("");
  };

  const handleAddAi = async (inputText) => {
    const text = inputText || aiInput;

    // Exit early if no text
    if (!text) {
      setLoading(false);
      return;
    }

    setLoading(true); // start loading

    try {
      const today = new Date().toISOString().split("T")[0];
      const prompt = `
      You are an expense extraction assistant.
      Extract details in JSON format from the text: "${text}".
      Include:
      - title (short name of expense)
      - amount (in number)
      - category (like Food, Travel, etc.)
      - description (short summary)
      - date (use current date: ${today})
    `;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      console.log("Raw response:", response.text);

      const cleanedText = (response.text || "")
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(cleanedText);
      console.log("Parsed object:", data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false); // always stop loading
    }
  };

  return (
    <div
      className="Container"
      style={{ padding: "20px", maxWidth: "600px", marginLeft: "10px" }}
    >
      <h1>Expense Tracker</h1>

      {/* Expense Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: "20px",
          border: "2px solid #333",
          padding: "15px",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button
          type="submit"
          style={{
            color: "Blue",
            border: "1px solid black",
            marginLeft: "10px",
          }}
        >
          Add Expense
        </button>
      </form>
      {/*Expense With AI */}
      <h1>Expense Tracker With Ai-Voice</h1>

      <form 
       onSubmit={(e) => { e.preventDefault() }}

        style={{
          marginBottom: "20px",
          border: "2px solid #333",
          padding: "15px",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <input
          type="text"
          placeholder="e.g. 100 rupees biryani, or say it aloud"
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          required
          style={{
            marginBottom: "10px",
            display: "block",
            width: "95%",
            alignItems: "center",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            outline: "none",
          }}
        />
        <button
          style={{
            color: "green",
            border: "1px solid black",
            marginLeft: "10px",
          }}
          >
          Add Expense With AI
        </button>
      </form>

      {/* Expense List */}
      <h2>Expenses</h2>
      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        expenses.map((exp, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              margin: "10px 0",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <h3>{exp.title}</h3>
            <p>{exp.desc}</p>
            <p>💰 Amount: ${exp.amount}</p>
            <p>📅 Date: {exp.date}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
