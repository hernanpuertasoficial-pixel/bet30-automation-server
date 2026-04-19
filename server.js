const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();

// delay helper
const delay = ms => new Promise(res => setTimeout(res, ms));

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

    await page.goto(process.env.BET30_ADMIN_URL, {
      waitUntil: "networkidle2"
    });

    // 🔥 esperar que Angular cargue bien
    await delay(5000);

    // ✅ LOGIN (corregido usando name)
    await page.waitForSelector('input[name="username"]', { timeout: 20000 });
    await page.type('input[name="username"]', process.env.BET30_ADMIN_USER);

    await page.type('input[name="password"]', process.env.BET30_ADMIN_PASSWORD);

    await page.click("#dologin");

    // esperar login completo
    await delay(8000);

    console.log("✅ Login correcto");

    // 🔥 IR A USUARIOS (por si no está ya ahí)
    await page.goto("https://agentes.bet30.biz/users", {
      waitUntil: "networkidle2"
    });

    await delay(5000);

    // 🔥 CLICK BOTÓN "Nuevo Jugador"
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.includes("Nuevo Jugador"));
      if (btn) btn.click();
    });

    await delay(4000);

    console.log("👤 Formulario abierto");

    // 🔥 INPUTS DEL MODAL (más robusto)
    await page.waitForSelector('input[placeholder="Username"]', { timeout: 20000 });
    await page.type('input[placeholder="Username"]', username);

    await page.waitForSelector('input[placeholder="Password"]', { timeout: 20000 });
    await page.type('input[placeholder="Password"]', password);

    // 🔥 CLICK GUARDAR
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.includes("GUARDAR"));
      if (btn) btn.click();
    });

    await delay(6000);

    console.log("✅ Usuario creado en BET30");

    await browser.close();

    return res.json({
      success: true,
      message: "Usuario creado en BET30"
    });

  } catch (error) {
    console.error("❌ ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
