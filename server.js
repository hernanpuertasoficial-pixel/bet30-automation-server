const express = require("express");
const cors = require("cors");

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const app = express();

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
      headless: false, // 🔥 IMPORTANTE PARA DEBUG
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    console.log("🔐 Entrando a BET30...");

    await page.goto(process.env.BET30_ADMIN_URL, {
      waitUntil: "networkidle2"
    });

    await delay(10000);

    // 🔥 LOGIN MÁS INTELIGENTE
    const inputs = await page.$$("input");

    console.log("Inputs detectados:", inputs.length);

    if (inputs.length < 2) {
      throw new Error("No se detectaron inputs de login");
    }

    await inputs[0].type(process.env.BET30_ADMIN_USER);
    await inputs[1].type(process.env.BET30_ADMIN_PASSWORD);

    // click login
    await page.evaluate(() => {
      const btn =
        document.querySelector("#dologin") ||
        [...document.querySelectorAll("button")]
          .find(b => b.innerText.toLowerCase().includes("iniciar"));
      if (btn) btn.click();
    });

    await delay(12000);

    console.log("✅ Login hecho");

    // 🔥 CLICK NUEVO JUGADOR
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("nuevo"));
      if (btn) btn.click();
    });

    await delay(5000);

    const inputs2 = await page.$$("input");

    if (inputs2.length < 2) {
      throw new Error("No se encontraron inputs del formulario");
    }

    await inputs2[inputs2.length - 2].type(username);
    await inputs2[inputs2.length - 1].type(password);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("guardar"));
      if (btn) btn.click();
    });

    await delay(8000);

    console.log("✅ Usuario creado");

    await browser.close();

    return res.json({
      success: true
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
