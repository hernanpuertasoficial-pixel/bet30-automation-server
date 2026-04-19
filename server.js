const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

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
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    console.log("🔐 Entrando a BET30...");

    await page.goto(process.env.BET30_ADMIN_URL, {
      waitUntil: "domcontentloaded"
    });

    // 🔥 esperar Angular
    await delay(10000);

    // 🔥 LOGIN ROBUSTO (SIN SELECTOR FRÁGIL)
    const inputsLogin = await page.$$('input');

    if (inputsLogin.length < 2) {
      throw new Error("No se encontraron inputs de login");
    }

    await inputsLogin[0].type(process.env.BET30_ADMIN_USER);
    await inputsLogin[1].type(process.env.BET30_ADMIN_PASSWORD);

    await page.click("#dologin");

    await delay(10000);

    console.log("✅ Login correcto");

    // 🔥 esperar panel cargado
    await delay(8000);

    // 🔥 CLICK "Nuevo Jugador"
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.includes("Nuevo Jugador"));
      if (btn) btn.click();
    });

    await delay(5000);

    console.log("👤 Formulario abierto");

    // 🔥 INPUTS DEL MODAL
    const inputs = await page.$$('input');

    if (inputs.length < 4) {
      throw new Error("No se encontraron inputs del formulario");
    }

    // normalmente los últimos 2 son los del modal
    await inputs[inputs.length - 2].type(username);
    await inputs[inputs.length - 1].type(password);

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
