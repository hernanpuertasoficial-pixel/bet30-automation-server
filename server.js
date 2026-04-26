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
    await page.goto(process.env.BET30_ADMIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await delay(8000);

    // Ver que hay en la pagina
    const html = await page.content();
    console.log("HTML primeros 300 chars:", html.substring(0, 300));

    const inputs = await page.$$("input");
    console.log("Inputs encontrados:", inputs.length);

    const allText = await page.evaluate(() => document.body.innerText.substring(0, 200));
    console.log("Texto pagina:", allText);

    if (inputs.length < 2) {
      await delay(10000);
      const inputs2 = await page.$$("input");
      console.log("Inputs despues espera extra:", inputs2.length);
      if (inputs2.length < 2) {
        throw new Error("No aparecen inputs en la pagina");
      }
    }

    const freshInputs = await page.$$("input");
    await freshInputs[0].click({ clickCount: 3 });
    await freshInputs[0].type(process.env.BET30_ADMIN_USER, { delay: 80 });
    await freshInputs[1].click({ clickCount: 3 });
    await freshInputs[1].type(process.env.BET30_ADMIN_PASSWORD, { delay: 80 });

    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const btn = btns.find(b => b.innerText.toUpperCase().includes("INICIAR"));
      if (btn) btn.click();
    });

    console.log("Login enviado, esperando panel...");
    await delay(10000);

    const urlDespuesLogin = page.url();
    console.log("URL despues login:", urlDespuesLogin);

    const textoDespuesLogin = await page.evaluate(() => document.body.innerText.substring(0, 200));
    console.log("Texto despues login:", textoDespuesLogin);

    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const btn = btns.find(b => b.innerText.toUpperCase().includes("NUEVO"));
      if (btn) btn.click();
    });

    console.log("Click en Nuevo Jugador, esperando modal...");
    await delay(4000);

    const inputsModal = await page.$$("input");
    console.log("Inputs en modal:", inputsModal.length);

    if (inputsModal.length < 2) throw new Error("No aparecio el modal");

    const userInput = inputsModal[inputsModal.length - 2];
    const passInput = inputsModal[inputsModal.length - 1];

    await userInput.click({ clickCount: 3 });
    await userInput.type(username, { delay: 80 });
    await passInput.click({ clickCount: 3 });
    await passInput.type(password, { delay: 80 });

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
