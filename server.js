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

    console.log("🔐 Entrando a BET30...");

    await page.goto(process.env.BET30_ADMIN_URL, {
      waitUntil: "networkidle2"
    });

    // LOGIN (AHORA USA VARIABLES DE RAILWAY)
    await page.type("#username", process.env.BET30_ADMIN_USER);
    await page.type("#password", process.env.BET30_ADMIN_PASSWORD);

    await page.click("#dologin");

    await page.waitForTimeout(5000);

    console.log("✅ Login correcto");

    // ⚠️ AQUÍ DEBES AJUSTAR LA URL REAL DE CREAR USUARIO
    await page.goto("https://agentes.bet30.biz/crear-usuario", {
      waitUntil: "networkidle2"
    });

    console.log("👤 Creando usuario...");

    // ⚠️ ESTO TAMBIÉN DEPENDE DEL HTML REAL
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);

    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

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
