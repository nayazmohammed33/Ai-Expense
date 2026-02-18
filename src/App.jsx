import { useState, useRef, useEffect } from "react";
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

  // UI tabs and speech state
  const [activeTab, setActiveTab] = useState("text");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

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

  // Initialize SpeechRecognition (if available)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = "en-IN"; // set to Indian English by default
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.trim();
      setTranscript(text);
      // Automatically add expense when final result received
      handleAddAi(text);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recog.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch (e) {}
      recognitionRef.current = null;
    };
  }, []);

  const startListening = async () => {
    const recog = recognitionRef.current;
    if (!recog) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    setTranscript("");

    // Ask for mic permission before starting
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("Microphone permission denied or error:", err);
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
        setIsListening(false);
        return;
      }
    }

    setIsListening(true);
    try {
      recog.start();
    } catch (e) {
      // ignore start errors when already started
    }
  };

  const stopListening = () => {
    const recog = recognitionRef.current;
    if (!recog) return;
    try {
      recog.stop();
    } catch (e) {}
    setIsListening(false);
  };

  return (
    <div
      className="Container"
      style={{ padding: "20px", maxWidth: "600px", marginLeft: "10px" }}
    >
      
      {/*Expense With AI */}
      <h1>Expense Tracker With Ai-Voice</h1>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <button
            onClick={() => setActiveTab("text")}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: activeTab === "text" ? "2px solid #1976D2" : "1px solid #ccc",
              background: activeTab === "text" ? "#E3F2FD" : "#fff",
              cursor: "pointer",
            }}
          >
            Text
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: activeTab === "voice" ? "2px solid #1976D2" : "1px solid #ccc",
              background: activeTab === "voice" ? "#E3F2FD" : "#fff",
              cursor: "pointer",
            }}
          >
            Voice
          </button>
        </div>

        {activeTab === "text" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
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
        )}

        {activeTab === "voice" && (
          <div
            style={{
              marginBottom: "12px",
              border: "2px solid #333",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <div style={{ marginBottom: "8px", fontSize: "14px" }}>
              Speak now and I'll add an expense for you (auto-add on final result).
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => (isListening ? stopListening() : startListening())}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #1976D2",
                  background: isListening ? "#FFEBEE" : "#E3F2FD",
                  cursor: "pointer",
                }}
              >
                {isListening ? "Stop Listening" : "Start Listening"}
              </button>

              <div style={{ fontSize: "13px", color: "#333", minWidth: "200px" }}>
                {transcript || "No transcript yet."}
              </div>
            </div>
          </div>
        )}
      </div>

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
