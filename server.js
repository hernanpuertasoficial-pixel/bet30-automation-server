const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();

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

    await page.goto("https://agentes.bet30.biz/", {
      waitUntil: "networkidle2"
    });

    // LOGIN REAL (ya corregido)
    await page.type("#username", "bot");
    await page.type("#password", "12345678a");

    await page.click("#dologin");

    await page.waitForNavigation();

    console.log("✅ Login correcto");

    // ⚠️ AQUÍ FALTA AÚN
    // navegar a "crear jugador"
    // NECESITO ESA PANTALLA

    console.log("👤 Creando usuario (pendiente configurar form)...");

    await browser.close();

    return res.json({
      success: true,
      message: "Login correcto, falta paso crear usuario"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Error en automatización"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
