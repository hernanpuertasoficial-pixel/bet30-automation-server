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

    await delay(6000);

    // 🔥 DETECTAR SI HAY IFRAME
    let frame = page;

    const frames = await page.frames();
    if (frames.length > 1) {
      console.log("⚠️ Usando iframe");
      frame = frames.find(f => f.url().includes("bet30")) || page;
    }

    // 🔥 LOGIN ROBUSTO
    await frame.waitForSelector('input[name="username"]', { timeout: 30000 });
    await frame.type('input[name="username"]', process.env.BET30_ADMIN_USER);

    await frame.waitForSelector('input[name="password"]', { timeout: 30000 });
    await frame.type('input[name="password"]', process.env.BET30_ADMIN_PASSWORD);

    await frame.click("#dologin");

    await delay(8000);

    console.log("✅ Login correcto");

    // 🔥 IR A USUARIOS
    await page.goto("https://agentes.bet30.biz/users", {
      waitUntil: "networkidle2"
    });

    await delay(6000);

    // 🔥 CLICK NUEVO JUGADOR (robusto)
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("nuevo"));
      if (btn) btn.click();
    });

    await delay(4000);

    console.log("👤 Formulario abierto");

    // 🔥 INPUTS MODAL (más flexible)
    const inputs = await page.$$('input');

    if (inputs.length < 2) {
      throw new Error("No se encontraron inputs del formulario");
    }

    await inputs[0].type(username);
    await inputs[1].type(password);

    // 🔥 CLICK GUARDAR
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("guardar"));
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
