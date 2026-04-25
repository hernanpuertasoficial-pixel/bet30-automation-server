const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const app = express();
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BET30 automation server running");
});

async function runBot(username, password, attempt = 1) {
  let browser;
  try {
    console.log(`Intento ${attempt} para: ${username}`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
    await page.setViewport({ width: 1366, height: 768 });

    console.log("Abriendo BET30...");
    await page.goto(process.env.BET30_ADMIN_URL, { waitUntil: "networkidle2", timeout: 60000 });
    await delay(10000);

    let inputs = await page.$$("input");
    console.log("Inputs encontrados:", inputs.length);

    if (inputs.length < 2) throw new Error("No se detectaron inputs de login");

    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(process.env.BET30_ADMIN_USER, { delay: 50 });
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type(process.env.BET30_ADMIN_PASSWORD, { delay: 50 });

    await page.evaluate(() => {
      const btn = document.querySelector("#dologin") ||
        [...document.querySelectorAll("button")].find(b => b.innerText.toLowerCase().includes("iniciar"));
      if (btn) btn.click();
    });

    console.log("Login enviado");
    await delay(12000);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(el => el.innerText.toLowerCase().includes("nuevo"));
      if (btn) btn.click();
    });

    await delay(6000);
    console.log("Formulario abierto");

    let inputs2 = await page.$$("input");
    console.log("Inputs formulario:", inputs2.length);

    if (inputs2.length < 2) throw new Error("No se encontraron inputs del formulario");

    const userInput = inputs2[inputs2.length - 2];
    const passInput = inputs2[inputs2.length - 1];

    await userInput.click({ clickCount: 3 });
    await userInput.type(username, { delay: 50 });
    await passInput.click({ clickCount: 3 });
    await passInput.type(password, { delay: 50 });

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(el => el.innerText.toLowerCase().includes("guardar"));
      if (btn) btn.click();
    });

    await delay(8000);
    console.log(`Usuario creado: ${username}`);
    await browser.close();

  } catch (error) {
    console.error(`ERROR intento ${attempt}:`, error.message);
    if (browser) await browser.close();
    if (attempt < 2) {
      console.log("Reintentando...");
      await delay(5000);
      return runBot(username, password, attempt + 1);
    }
    console.log("Fallo definitivo");
  }
}

app.post("/api/create-player", async (req, res) => {
  const username = req.body?.username || req.body?.player?.username
  const password = req.body?.password || req.body?.player?.password

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  console.log("Nueva solicitud:", username);

  res.json({ success: true, message: "Bot ejecutandose" });

  runBot(username, password);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
