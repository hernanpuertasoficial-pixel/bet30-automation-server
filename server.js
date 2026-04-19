const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BET30 automation server running 🚀");
});

app.post("/api/create-player", async (req, res) => {
  const { username, password } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    console.log("🔐 Entrando a BET30...");

    await page.goto("https://agentes.bet30.biz/", {
      waitUntil: "networkidle2"
    });

    // LOGIN
    await page.type('input[name="username"]', "bot");
    await page.type('input[name="password"]', "12345678a");

    await page.click('button[type="submit"]');

    await page.waitForNavigation();

    console.log("✅ Login correcto");

    // ⚠️ ESTO HAY QUE AJUSTAR SEGÚN LA WEB REAL
    // intenta ir a crear jugador
    await page.goto("https://agentes.bet30.biz/crear-usuario", {
      waitUntil: "networkidle2"
    });

    console.log("👤 Creando usuario...");

    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);

    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    await browser.close();

    return res.json({
      success: true,
      message: "Usuario creado en BET30"
    });

  } catch (error) {
    console.error("❌ ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Error en automatización"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
