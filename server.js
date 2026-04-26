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
    await delay(5000);

    // Esperar que aparezcan los inputs de login
    console.log("Esperando inputs de login...");
    await page.waitForSelector("input", { timeout: 30000 });

    const inputs = await page.$$("input");
    console.log("Inputs encontrados:", inputs.length);

    // Login
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(process.env.BET30_ADMIN_USER, { delay: 80 });
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type(process.env.BET30_ADMIN_PASSWORD, { delay: 80 });

    // Buscar boton INICIAR SESION
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const btn = btns.find(b => b.innerText.toUpperCase().includes("INICIAR"));
      if (btn) btn.click();
    });

    console.log("Login enviado, esperando panel...");
    await delay(8000);

    // Esperar que cargue el panel
    await page.waitForSelector("button", { timeout: 30000 });

    // Buscar boton Nuevo Jugador
    console.log("Buscando boton Nuevo Jugador...");
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const btn = btns.find(b => b.innerText.toUpperCase().includes("NUEVO"));
      if (btn) btn.click();
    });

    console.log("Modal abierto, esperando formulario...");
    await delay(3000);

    // Esperar el modal con los inputs Username y Password
    await page.waitForSelector("input[placeholder='Username'], input[placeholder='username']", { timeout: 15000 });

    const userInput = await page.$("input[placeholder='Username']") || await page.$("input[placeholder='username']");
    const passInput = await page.$("input[placeholder='Password']") || await page.$("input[placeholder='password']");

    if (!userInput || !passInput) throw new Error("No se encontraron inputs del modal");

    await userInput.click({ clickCount: 3 });
    await userInput.type(username, { delay: 80 });
    await passInput.click({ clickCount: 3 });
    await passInput.type(password, { delay: 80 });

    console.log("Datos ingresados, guardando...");

    // Buscar boton GUARDAR
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const btn = btns.find(b => b.innerText.toUpperCase().includes("GUARDAR"));
      if (btn) btn.click();
    });

    await delay(5000);
    console.log(`Usuario creado exitosamente: ${username}`);
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
  const username = req.body?.username || req.body?.player?.username;
  const password = req.body?.password || req.body?.player?.password;

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
