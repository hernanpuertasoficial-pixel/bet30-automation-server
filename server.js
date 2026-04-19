const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BET30 automation server running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/create-player", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("🟡 Creating player:", username);

    // 🔐 LOGIN EN BET30
    const loginRes = await axios.post(
      `${process.env.BET30_ADMIN_URL}/login`,
      {
        username: process.env.BET30_ADMIN_USER,
        password: process.env.BET30_ADMIN_PASSWORD,
      },
      {
        withCredentials: true,
      }
    );

    console.log("🟢 Login success");

    const cookies = loginRes.headers["set-cookie"];

    // 👤 CREAR USUARIO EN BET30
    const createRes = await axios.post(
      `${process.env.BET30_ADMIN_URL}/create-user`,
      {
        username,
        password,
      },
      {
        headers: {
          Cookie: cookies,
        },
      }
    );

    console.log("🟢 BET30 response:", createRes.data);

    return res.json({
      success: true,
      data: createRes.data,
    });
  } catch (error) {
    console.error("🔴 ERROR:", error.response?.data || error.message);

    return res.json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

app.post("/api/credit-balance", (req, res) => {
  console.log("Credit balance:", req.body);

  return res.json({
    success: true,
    message: "Balance acreditado (mock)",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
