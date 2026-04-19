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

// 🔥 FUNCIÓN SEPARADA (background)
async function runBot(username, password) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
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

    await delay(8000);

    const inputs = await page.$$("input");

    if (inputs.length < 2) {
      throw new Error("No se detectaron inputs de login");
    }

    await inputs[0].type(process.env.BET30_ADMIN_USER);
    await inputs[1].type(process.env.BET30_ADMIN_PASSWORD);

    await page.evaluate(() => {
      const btn =
        document.querySelector("#dologin") ||
        [...document.querySelectorAll("button")]
          .find(b => b.innerText.toLowerCase().includes("iniciar"));
      if (btn) btn.click();
    });

    await delay(10000);

    console.log("✅ Login hecho");

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("nuevo"));
      if (btn) btn.click();
    });

    await delay(5000);

    const inputs2 = await page.$$("input");

    if (inputs2.length >= 2) {
      await inputs2[inputs2.length - 2].type(username);
      await inputs2[inputs2.length - 1].type(password);
    }

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("guardar"));
      if (btn) btn.click();
    });

    await delay(6000);

    console.log("✅ Usuario creado");

    await browser.close();

  } catch (err) {
    console.error("❌ BOT ERROR:", err.message);
  }
}

// 🔥 ENDPOINT (RESPUESTA RÁPIDA)
app.post("/api/create-player", async (req, res) => {
  const { username, password } = req.body;

  // ⚡ responder rápido (evita 502)
  res.json({
    success: true,
    message: "Proceso iniciado"
  });

  // 🔥 ejecutar en background
  runBot(username, password);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
