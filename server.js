const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();

// 🔥 función delay (reemplazo de waitForTimeout)
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

    console.log("🔐 Login BET30...");

    await page.goto(process.env.BET30_ADMIN_URL, {
      waitUntil: "networkidle2"
    });

    // 🔥 ESPERAR QUE CARGUE
    await delay(3000);

    // LOGIN
    await page.waitForSelector("#username", { timeout: 10000 });
    await page.type("#username", process.env.BET30_ADMIN_USER);

    await page.waitForSelector("#password", { timeout: 10000 });
    await page.type("#password", process.env.BET30_ADMIN_PASSWORD);

    await page.click("#dologin");

    await delay(6000);

    console.log("✅ Login correcto");

    // 🔥 CLICK EN "Nuevo Jugador"
    await page.click('text/Nuevo Jugador');

    await delay(3000);

    console.log("👤 Abriendo formulario...");

    // ESCRIBIR DATOS
    await page.waitForSelector('input[placeholder="Username"]', { timeout: 10000 });
    await page.type('input[placeholder="Username"]', username);

    await page.waitForSelector('input[placeholder="Password"]', { timeout: 10000 });
    await page.type('input[placeholder="Password"]', password);

    // CLICK GUARDAR
    await page.click('text/GUARDAR');

    await delay(5000);

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
