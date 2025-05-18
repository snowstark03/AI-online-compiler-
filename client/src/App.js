import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import "./App.css";

const languageMap = {
  cpp: 54,
  python: 71,
  c: 50,
  java: 62
};

const defaultCodes = {
  python: `print("Hello from Python!")`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello from C++!";\n  return 0;\n}`,
  c: `#include <stdio.h>\nint main() {\n  printf("Hello from C!\\n");\n  return 0;\n}`,
  java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Java!");\n  }\n}`
};

const fileExtensions = {
  python: "py",
  cpp: "cpp",
  c: "c",
  java: "java"
};

function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(defaultCodes["python"]);
  const [output, setOutput] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [codeBeforeChange, setCodeBeforeChange] = useState(defaultCodes["python"]);

  const [aiErrorPanelOpen, setAiErrorPanelOpen] = useState(false);
  const [aiErrorResponse, setAiErrorResponse] = useState("");

  const [errorSuggestion, setErrorSuggestion] = useState("");
  const [errorPanelOpen, setErrorPanelOpen] = useState(false);


  const isErrorOutput = (text) => {
    if (!text) return false;
    const errorKeywords = ["error", "exception", "traceback", "compile_error", "stderr"];
    const lowerText = text.toLowerCase();
    return errorKeywords.some(keyword => lowerText.includes(keyword));
  };



  const editorRef = useRef(null);

  const handleRun = async () => {
    setIsRunning(true);
    const language_id = languageMap[language];

    try {
      //const response = await fetch("http://localhost:2358/submissions?base64_encoded=false&wait=true", {
      
      const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
        method: "POST",


        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "6d4b58492cmsh04b53d4f18e4102p1eb04ajsn5da0ec82659b",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: code,
          language_id,
          stdin: userInput
        })
      });

      const data = await response.json();
      setOutput(data.stdout || data.stderr || data.compile_output || "No output received.");
    } catch (err) {
      setOutput("Something went wrong: " + err.message);
    }
    setIsRunning(false);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleUndo = () => {
    editorRef.current?.trigger("keyboard", "undo", null);
  };

  const handleRedo = () => {
    editorRef.current?.trigger("keyboard", "redo", null);
  };

  const handleReset = () => {
    const originalCode = defaultCodes[language];
    if (code !== originalCode && !window.confirm("Are you sure you want to reset the code? Unsaved changes will be lost.")) return;
    setCode(originalCode);
    editorRef.current?.setValue(originalCode);
  };

  const handleLanguageChange = (lang) => {
    if (code !== codeBeforeChange) {
      const confirmSwitch = window.confirm("Are you sure you want to switch the languages? Unsaved changes will be lost.");
      if (!confirmSwitch) return;
    }
    setLanguage(lang);
    const newCode = defaultCodes[lang];
    setCode(newCode);
    setCodeBeforeChange(newCode);
    editorRef.current?.setValue(newCode);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const ext = fileExtensions[language] || "txt";
    const fileName = `main.${ext}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleAiExplain = async () => {
    setAiPanelOpen(true);
    setAiResponse("Thinking...");

    try {
      //const response = await fetch("http://localhost:4000/explain", {
      const response = await fetch("https://ai-online-compiler-backend.onrender.com/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      setAiResponse(data.explanation || "No explanation received.");
    } catch (err) {
      setAiResponse("AI explanation failed: " + err.message);
    }

  };

  const handleErrorFix = async () => {
    setErrorPanelOpen(true);
    setErrorSuggestion("Thinking...");

    try {

      //const response = await fetch("http://localhost:4000/fix-error", {
      const response = await fetch("https://ai-online-compiler-backend.onrender.com/fix-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language,
          error: output
        })
      });

      const data = await response.json();
      setErrorSuggestion(data.suggestion || "No suggestion received.");
    } catch (err) {
      setErrorSuggestion("Error analyzing the issue: " + err.message);
    }
  };





  return (
    <div className={`container ${theme}`}>
      <div className="header">
        <h2>🧠 Online Code Compiler</h2>

        <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        <button onClick={handleUndo}>Undo ↺</button>
        <button onClick={handleRedo}>Redo ↻</button>
        <button onClick={handleReset}>Reset 🔄</button>
        <button onClick={downloadCode}>Save 💾</button>
        <button onClick={handleRun} disabled={isRunning}>
          {isRunning ? "Running..." : "Run ▶"}
        </button>
        <button onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div style={{ position: "relative" }}>
        <Editor
          height="50vh"
          theme={theme === "dark" ? "vs-dark" : "light"}
          defaultLanguage={language}
          language={language}
          value={code}
          onMount={handleEditorMount}
          onChange={(value) => setCode(value)}
        />
        <button
          onClick={handleAiExplain}
          className="ai-button"
        >
          AI 🤖
        </button>
      </div>

      <div className="stdin">
        <h3>Standard Input (stdin):</h3>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={4}
          cols={50}
          placeholder="Enter input for your program here"
        />
      </div>

      <div className={`output-container ${errorPanelOpen ? "split" : "single"}`}>
        <div className="output child">
          <div>
            <h3>Output:</h3>
            <p style={{textWrap: "pretty"}}>
              {output}
            </p>
          </div>
          {isErrorOutput(output) && (
            <button onClick={handleErrorFix} className="ai-button ai-fix-button">
              AI Fix 🔧
            </button>
          )}
        </div>

        <div className={`ai-panel ai-panel-fix ${errorPanelOpen ? "open" : ""} child`}>
          <div className="ai-header">
            <h3>AI Error Fix</h3>
            <button onClick={() => setErrorPanelOpen(false)}>✖</button>
          </div>
          <div className="ai-content">
            {errorSuggestion}
          </div>
        </div>
      </div>

      {/* {aiErrorPanelOpen && (
  <div className="ai-error-panel">
    <div className="ai-header">
      <h3>AI Error Explanation</h3>
      <button onClick={() => setAiErrorPanelOpen(false)}>✖</button>
    </div>
    <div className="ai-content">
      <pre>{aiErrorResponse}</pre>
    </div>
  </div>
)} */}

      <div className="ai-panel-container">
        <div className={`ai-panel ai-panel-explain ${aiPanelOpen ? "open" : ""}`}>
          <div className="ai-header">
            <h3>AI Code Explanation</h3>
            <button onClick={() => setAiPanelOpen(false)}>✖</button>
          </div>
          <div className="ai-content">
            <text>{aiResponse}</text>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
