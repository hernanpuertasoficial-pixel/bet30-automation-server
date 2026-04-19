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
      headless: false, // 🔥 IMPORTANTE (debug real)
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    console.log("🔐 Entrando a BET30...");
    await page.goto(process.env.BET30_ADMIN_URL);

    await delay(15000);

    // 🔥 DEBUG: ver HTML real
    const content = await page.content();
    console.log("HTML LENGTH:", content.length);

    // 🔥 DETECTAR IFRAME
    const frames = page.frames();
    console.log("FRAMES:", frames.length);

    let frame = page;

    if (frames.length > 1) {
      frame = frames.find(f => f.url().includes("bet30")) || page;
      console.log("🧠 Usando iframe:", frame.url());
    }

    await delay(5000);

    // 🔥 BUSCAR INPUTS EN FRAME
    const inputs = await frame.$$("input");

    console.log("INPUTS ENCONTRADOS:", inputs.length);

    if (inputs.length < 2) {
      throw new Error("⚠️ Puppeteer NO ve los inputs → posible protección o iframe oculto");
    }

    // 🔥 LOGIN
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(process.env.BET30_ADMIN_USER);

    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type(process.env.BET30_ADMIN_PASSWORD);

    // botón login
    await frame.evaluate(() => {
      const btn = document.querySelector("#dologin") ||
        [...document.querySelectorAll("button")]
          .find(b => b.innerText.toLowerCase().includes("iniciar"));
      if (btn) btn.click();
    });

    await delay(12000);

    console.log("✅ Login intentado");

    // 🔥 DEBUG: screenshot
    await page.screenshot({ path: "debug.png" });

    // 🔥 CLICK NUEVO JUGADOR
    await frame.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("nuevo"));
      if (btn) btn.click();
    });

    await delay(6000);

    // 🔥 FORMULARIO
    const inputs2 = await frame.$$("input");

    if (inputs2.length < 2) {
      throw new Error("No se encontraron inputs del formulario");
    }

    await inputs2[inputs2.length - 2].type(username);
    await inputs2[inputs2.length - 1].type(password);

    await frame.evaluate(() => {
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
