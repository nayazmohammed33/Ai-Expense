import { useState } from "react";
import Groq from "groq-sdk";

import "./App.css";

function App() {
  // const [title, setTitle] = useState("");
  // const [desc, setDesc] = useState("");
  // const [amount, setAmount] = useState("");
  // const [date, setDate] = useState("");

  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });

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
      
      Return ONLY valid JSON, no additional text.
    `;

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      });

      console.log("Raw response:", response.choices[0].message.content);

      const cleanedText = (response.choices[0].message.content || "")
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(cleanedText);
      console.log("Parsed object:", data);

      // Add the parsed expense to the expenses list
      const newExpense = {
        title: data.title || "Expense",
        desc: data.description || data.category || "",
        amount: parseFloat(data.amount) || 0,
        date: data.date || today,
      };

      setExpenses([...expenses, newExpense]);
      setAiInput(""); // Clear the input after successful addition
    } catch (error) {
      console.error("Error:", error);
      
      // Handle quota exceeded error
      if (error?.error?.code === 429) {
        alert("🚫 API Quota Exceeded!\n\nYou've hit the free tier limit for Google Gemini API.\n\nTo continue:\n1. Upgrade to a paid plan: https://ai.google.dev/pricing\n2. Or add a valid credit card to your Google Cloud account");
      } else if (error?.error?.code === 401 || error?.error?.code === 403) {
        alert("❌ API Key Error!\n\nPlease check your VITE_API_URL in the .env file is correct.");
      } else {
        alert("❌ Failed to process expense. Please try again.\n\nError: " + (error?.message || "Unknown error"));
      }
    } finally {
      setLoading(false); // always stop loading
    }
  };

  return (
    <div
      className="Container"
      style={{ padding: "20px", maxWidth: "600px", marginLeft: "10px" }}
    >
      
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
          onClick={() => handleAddAi()}
          disabled={loading}
          style={{
            color: "green",
            border: "1px solid black",
            marginLeft: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
          >
          {loading ? "Processing..." : "Add Expense With AI"}
        </button>
      </form>

      {/* Expense List */}
      <h2>Expenses</h2>
      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {expenses.map((exp, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: "12px",
                padding: "10px",
                backgroundColor: "#f5f5f5",
                borderLeft: "4px solid #4CAF50",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <div>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                  {exp.title}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>{exp.desc}</div>
              </div>
              <div style={{ textAlign: "right", fontWeight: "600", color: "#2196F3" }}>
                ₹{exp.amount}
              </div>
              <div style={{ fontSize: "12px", color: "#999", minWidth: "80px", textAlign: "right" }}>
                {exp.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
