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
      waitUntil: "networkidle2"
    });

    // 🔥 ESPERAR BIEN (clave)
    await delay(12000);

    // 🔥 ESPERAR QUE EXISTA CUALQUIER INPUT
    await page.waitForSelector("input", { timeout: 30000 });

    // 🔥 DETECTAR INPUTS VISIBLES
    const inputsLogin = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input"))
        .filter(i => i.offsetParent !== null) // solo visibles
        .map((_, i) => i);
    });

    if (inputsLogin.length < 2) {
      throw new Error("No hay suficientes inputs visibles para login");
    }

    const allInputs = await page.$$("input");

    // 🔥 ESCRIBIR LOGIN
    await allInputs[inputsLogin[0]].type(process.env.BET30_ADMIN_USER);
    await allInputs[inputsLogin[1]].type(process.env.BET30_ADMIN_PASSWORD);

    // 🔥 CLICK LOGIN
    await page.evaluate(() => {
      const btn = document.querySelector("#dologin") ||
        [...document.querySelectorAll("button")]
          .find(b => b.innerText.toLowerCase().includes("iniciar"));
      if (btn) btn.click();
    });

    await delay(12000);

    console.log("✅ Login correcto");

    // 🔥 ESPERAR PANEL
    await delay(8000);

    // 🔥 CLICK NUEVO JUGADOR
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("nuevo"));
      if (btn) btn.click();
    });

    await delay(6000);

    console.log("👤 Formulario abierto");

    // 🔥 INPUTS DEL MODAL (VISIBLES)
    const modalInputsIndex = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input"))
        .map((el, i) => ({ el, i }))
        .filter(obj => obj.el.offsetParent !== null)
        .map(obj => obj.i);
    });

    const modalInputs = await page.$$("input");

    if (modalInputsIndex.length < 2) {
      throw new Error("No se encontraron inputs del modal");
    }

    // usar últimos visibles
    const userIndex = modalInputsIndex[modalInputsIndex.length - 2];
    const passIndex = modalInputsIndex[modalInputsIndex.length - 1];

    await modalInputs[userIndex].type(username);
    await modalInputs[passIndex].type(password);

    // 🔥 CLICK GUARDAR
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("guardar"));
      if (btn) btn.click();
    });

    await delay(8000);

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
