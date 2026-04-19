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
    await page.goto(process.env.BET30_ADMIN_URL);

    await delay(15000); // 🔥 MUY IMPORTANTE

    console.log("🔎 Buscando inputs reales...");

    const inputs = await page.$$("input");

    if (inputs.length < 2) {
      throw new Error("No hay suficientes inputs en login");
    }

    // 🔥 PROBAR TODOS LOS INPUTS HASTA QUE FUNCIONE
    let loginSuccess = false;

    for (let i = 0; i < inputs.length - 1; i++) {
      try {
        console.log("Probando inputs:", i, i + 1);

        await inputs[i].click({ clickCount: 3 });
        await inputs[i].type(process.env.BET30_ADMIN_USER);

        await inputs[i + 1].click({ clickCount: 3 });
        await inputs[i + 1].type(process.env.BET30_ADMIN_PASSWORD);

        // click login
        const btn = await page.$("#dologin");
        if (btn) {
          await btn.click();
        } else {
          await page.evaluate(() => {
            const b = [...document.querySelectorAll("button")]
              .find(el => el.innerText.toLowerCase().includes("iniciar"));
            if (b) b.click();
          });
        }

        await delay(10000);

        // verificar si cambió la página
        const url = page.url();
        if (!url.includes("login")) {
          console.log("✅ LOGIN EXITOSO");
          loginSuccess = true;
          break;
        }

      } catch (e) {
        console.log("Intento fallido:", i);
      }
    }

    if (!loginSuccess) {
      throw new Error("No se pudo hacer login en BET30");
    }

    // 🔥 ESPERAR PANEL
    await delay(8000);

    console.log("🔎 Buscando botón Nuevo Jugador...");

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find(el => el.innerText.toLowerCase().includes("nuevo"));
      if (btn) btn.click();
    });

    await delay(6000);

    console.log("👤 Creando usuario...");

    const inputs2 = await page.$$("input");

    if (inputs2.length < 2) {
      throw new Error("No se encontraron inputs del formulario");
    }

    // usar últimos inputs visibles
    await inputs2[inputs2.length - 2].type(username);
    await inputs2[inputs2.length - 1].type(password);

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
