const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BET30 automation server running");
});

async function runPuppeteerBot({ username, password }) {
  const BOT_URL = 'https://doubleclub-bot.loca.lt/create-user'
  console.log(`Enviando solicitud al bot externo para: ${username}`)

  const response = await fetch(BOT_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': 'true'
    },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(110000)
  })

  const result = await response.json()
  console.log('Respuesta del bot externo:', result)

  return {
    success: !!result.success,
    username,
    error: result.error || null,
    message: result.error || result.message || null,
  }
}

app.post("/api/create-player", async (req, res) => {
  const username = req.body?.username || req.body?.player?.username;
  const password = req.body?.password || req.body?.player?.password;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  console.log("Nueva solicitud:", username);
  
  try {
    const result = await runPuppeteerBot({ username, password });
    return res.json(result);
  } catch (error) {
    console.error("ERROR:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/create-user", async (req, res) => {
  const username = req.body?.username || req.body?.user;
  const password = req.body?.password || req.body?.pass;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  console.log("Nueva solicitud create-user:", username);

  try {
    const result = await runPuppeteerBot({ username, password });
    return res.json(result);
  } catch (error) {
    console.error("ERROR:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
