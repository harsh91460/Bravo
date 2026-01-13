require('dotenv').config();

const connectDB = require("./config/db");

const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const socketio = require("socket.io");
const { execFileSync } = require("child_process");
const fs = require("fs");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

mongoose.set("strictQuery", false);

mongoose
  .connect("mongodb://localhost:27017/codingbattle", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// User schema and model (Mongo)
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  score: { type: Number, default: 0 },
});
const User = mongoose.model("User", userSchema);

// Static routes (frontend)
app.use(express.static(path.join(__dirname, "../coding-game")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../coding-game/index.html"));
});

app.get("/practice.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../coding-game/practice.html"));
});

app.get("/questions.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../coding-game/questions.html"));
});

app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../coding-game/question.html"));
});

// User Registration API
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    return res
      .status(400)
      .json({ success: false, message: "Username may already exist." });
  }
});

// User Login API
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.json({ success: false });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ success: false });
    return res.json({ success: true });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false });
  }
});

// =============== MYSQL + PRACTICE ROUTES ===============

// Helper: check DB ready
function ensureDbReady(res) {
  if (!global.db) {
    console.error("DB pool missing — global.db is undefined");
    if (res) res.status(503).json({ success: false, message: "DB not ready" });
    return false;
  }
  return true;
}

// GET list of questions (from MySQL)
app.get("/api/questions", async (req, res) => {
  try {
    if (!ensureDbReady(res)) return;
    const limit = parseInt(req.query.limit) || 100;
    const [rows] = await global.db.query(
      "SELECT id, title, difficulty FROM problems ORDER BY id LIMIT ?",
      [limit]
    );
    return res.json({ success: true, questions: rows });
  } catch (err) {
    console.error("Error fetching questions (MySQL):", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET single question (from MySQL)
app.get("/api/question/:id", async (req, res) => {
  try {
    if (!ensureDbReady(res)) return;
    const qid = req.params.id;
    const [rows] = await global.db.query(
      "SELECT id, title, content AS description, difficulty FROM problems WHERE id = ? LIMIT 1",
      [qid]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    const question = rows[0];
    const [testCases] = await global.db.query(
      "SELECT id, input, expected_output FROM test_cases WHERE problem_id = ?",
      [question.id]
    );
    question.testCases = testCases || [];
    return res.json({ success: true, question });
  } catch (err) {
    console.error("Error fetching MySQL question by id:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET question from MySQL
app.get("/api/get-question", async (req, res) => {
  try {
    if (!ensureDbReady(res)) return;
    const qid = req.query.id;
    let rows;
    if (qid) {
      [rows] = await global.db.query(
        "SELECT id, title, content AS description, difficulty FROM problems WHERE id = ? LIMIT 1",
        [qid]
      );
    } else {
      [rows] = await global.db.query(
        "SELECT id, title, content AS description, difficulty FROM problems ORDER BY RAND() LIMIT 1"
      );
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "No question found" });
    }

    const question = rows[0];
    const [testCases] = await global.db.query(
      "SELECT input, expected_output FROM test_cases WHERE problem_id = ?",
      [question.id]
    );
    question.testCases = testCases || [];
    return res.json({ success: true, question });
  } catch (err) {
    console.error("Error fetching MySQL question:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Practice: fetch question by id
app.get("/api/practice/:id", async (req, res) => {
  try {
    if (!ensureDbReady(res)) return;
    const qid = req.params.id;
    const [rows] = await global.db.query(
      "SELECT id, title, content AS description, difficulty FROM problems WHERE id = ? LIMIT 1",
      [qid]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "No question found" });
    }
    const question = rows[0];
    const [testCases] = await global.db.query(
      "SELECT input, expected_output FROM test_cases WHERE problem_id = ?",
      [question.id]
    );
    question.testCases = testCases || [];
    return res.json({ success: true, question });
  } catch (err) {
    console.error("Error fetching practice question:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Helper: normalize outputs for comparison
function normalizeOutput(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/\r\n/g, "\n").trim();
}

// POST - Submit code and judge using MySQL test cases
app.post("/api/submit-code", async (req, res) => {
  const { problem_id, code, language } = req.body;

  if (!problem_id || !code || !language) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  try {
    if (!ensureDbReady(res)) return;
    const [testCases] = await global.db.query(
      "SELECT input, expected_output FROM test_cases WHERE problem_id = ?",
      [problem_id]
    );

    if (!testCases || testCases.length === 0) {
      return res.status(404).json({ success: false, message: "No test cases found" });
    }

    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    let passCount = 0;
    const results = [];

    // judge each test
    for (let i = 0; i < testCases.length; i++) {
      const t = testCases[i];
      const input = t.input == null ? "" : String(t.input);
      const expected = normalizeOutput(t.expected_output);

      try {
        let rawOut = "";

        if (language === "python") {
          const filePath = path.join(tempDir, `Main_${Date.now()}_${i}.py`);
          fs.writeFileSync(filePath, code, "utf8");
          rawOut = execFileSyncSafe("python", [filePath], input, 5000);
        } else if (language === "cpp" || language === "c++") {
          const filePath = path.join(tempDir, `Main_${Date.now()}_${i}.cpp`);
          const exePath = path.join(tempDir, `a_${Date.now()}_${i}.exe`);
          fs.writeFileSync(filePath, code, "utf8");

          try {
            execFileSyncSafe("g++", [filePath, "-o", exePath], "", 10000);
          } catch (compileErr) {
            results.push({ index: i, ok: false, error: "Compilation error" });
            continue;
          }

          rawOut = execFileSyncSafe(exePath, [], input, 5000);
        } else if (language === "javascript" || language === "js") {
          const filePath = path.join(tempDir, `Main_${Date.now()}_${i}.js`);
          fs.writeFileSync(filePath, code, "utf8");
          rawOut = execFileSyncSafe("node", [filePath], input, 5000);
        } else if (language === "java") {
          const className = "Solution";
          const filePath = path.join(tempDir, `${className}_${Date.now()}_${i}.java`);
          fs.writeFileSync(filePath, code, "utf8");

          try {
            execFileSyncSafe("javac", [filePath], "", 10000);
          } catch (compileErr) {
            results.push({ index: i, ok: false, error: "Java Compilation error" });
            continue;
          }

          const classDir = path.dirname(filePath);
          rawOut = execFileSyncSafe("java", ["-cp", classDir, className], input, 5000);
        } else {
          return res.status(400).json({ success: false, message: "Unsupported language" });
        }

        const got = normalizeOutput(rawOut);
        const ok = got === expected;
        if (ok) passCount++;
        results.push({ index: i, ok, expected, got });
      } catch (err) {
        results.push({ index: i, ok: false, error: String(err) });
      }
    }

    const total = testCases.length;
    const score = Math.round((passCount / total) * 100);

    return res.json({
      success: true,
      passed: passCount,
      total,
      score,
      results,
      message: passCount === total ? "All test cases passed! 🎉" : `${passCount}/${total} test cases passed.`
    });
  } catch (err) {
    console.error("Code execution error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Utility: execFileSync wrapper with stdin & timeout & capture
function execFileSyncSafe(cmd, args = [], input = "", timeoutMs = 5000) {
  try {
    const opts = {
      input: Buffer.from(String(input)),
      timeout: timeoutMs,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 5
    };
    return execFileSync(cmd, args, opts);
  } catch (err) {
    if (err.stderr) throw err.stderr.toString();
    if (err.stdout) return err.stdout.toString();
    throw err.message || String(err);
  }
}

// POST - Execute code (raw run)
app.post("/api/execute", (req, res) => {
  const { code, language, stdin } = req.body;
  if (!code || !language) {
    return res.status(400).json({ success: false, message: "Code and language are required." });
  }

  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  (async () => {
    try {
      if (language === "javascript") {
        const filePath = path.join(tempDir, `Exec_${Date.now()}.js`);
        fs.writeFileSync(filePath, code, "utf8");
        const out = execFileSyncSafe("node", [filePath], stdin || "", 3000);
        return res.json({ success: true, output: (out || "No output").toString() });
      } else if (language === "python") {
        const filePath = path.join(tempDir, `Exec_${Date.now()}.py`);
        fs.writeFileSync(filePath, code, "utf8");
        const out = execFileSyncSafe("python", [filePath], stdin || "", 5000);
        return res.json({ success: true, output: (out || "No output").toString() });
      } else if (language === "cpp" || language === "c++") {
        const filePath = path.join(tempDir, `Exec_${Date.now()}.cpp`);
        const exePath = path.join(tempDir, `Exec_${Date.now()}.exe`);
        fs.writeFileSync(filePath, code, "utf8");
        try {
          execFileSyncSafe("g++", [filePath, "-o", exePath], "", 10000);
        } catch (compileErr) {
          return res.json({ success: false, error: "Compilation error: " + compileErr });
        }
        try {
          const out = execFileSyncSafe(exePath, [], stdin || "", 5000);
          return res.json({ success: true, output: (out || "No output").toString() });
        } catch (runErr) {
          return res.json({ success: false, error: runErr.toString() });
        }
      } else if (language === "java") {
        const filePath = path.join(tempDir, `Exec_${Date.now()}.java`);
        const className = "Main";
        const javaCode = code.includes("class Main") ? code : `public class Main {\n${code}\n}`;
        fs.writeFileSync(filePath, javaCode, "utf8");
        try {
          execFileSyncSafe("javac", [filePath], "", 10000);
        } catch (compileErr) {
          return res.json({ success: false, error: "Compilation error: " + compileErr });
        }
        try {
          const classDir = path.dirname(filePath);
          const out = execFileSyncSafe("java", ["-cp", classDir, className], stdin || "", 5000);
          return res.json({ success: true, output: (out || "No output").toString() });
        } catch (runErr) {
          return res.json({ success: false, error: runErr.toString() });
        }
      } else {
        return res.status(400).json({ success: false, message: "Unsupported language." });
      }
    } catch (err) {
      return res.json({ success: false, error: String(err) });
    }
  })();
});

// ========== AI CODE REVIEW ENDPOINT - MOCK RESPONSE ==========
app.post("/api/ai-review", async (req, res) => {
  const { code, language, problemDescription } = req.body;

  if (!code || !language) {
    return res.status(400).json({ success: false, message: "Code and language required" });
  }

  try {
    console.log('🤖 Analyzing code...');
    
    // Mock AI Review - works with all languages
    const mockReview = {
      isCorrect: code.length > 5,
      score: Math.floor(Math.random() * 30) + 70,
      feedback: "Code structure is good! Well written solution.",
      bugs: [],
      suggestions: [
        "Add input validation",
        "Consider edge cases",
        "Add error handling"
      ],
      complexity: "Time: O(n), Space: O(1)"
    };

    console.log('✅ Code analyzed successfully');
    return res.json({ success: true, review: mockReview });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Analysis failed',
      error: err.message
    });
  }
});

// =============== SOCKET.IO REAL-TIME ===============

const users = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("register-socket", (username) => {
    users[username] = socket.id;
    socket.username = username;
    io.emit("online-users", Object.keys(users));
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      io.emit("online-users", Object.keys(users));
    }
    console.log("Client disconnected:", socket.id);
  });

  socket.on("send-invite", ({ to, from }) => {
    if (users[to]) io.to(users[to]).emit("receive-invite", { from });
  });

  socket.on("accept-invite", ({ from, to }) => {
    const room = `room_${Date.now()}`;
    [from, to].forEach((name) => {
      if (users[name]) {
        const clientSocket = io.sockets.sockets.get(users[name]);
        if (clientSocket) clientSocket.join(room);
      }
    });
    io.to(room).emit("game-start", { room, players: [from, to] });
  });
});

// =============== START SERVER ===============

async function startServer() {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
