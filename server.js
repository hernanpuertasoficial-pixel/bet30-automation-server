const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("BET30 automation server running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/create-player", (req, res) => {
  console.log("Create player:", req.body);

  return res.json({
    success: true,
    message: "Player creado correctamente (mock)"
  });
});

app.post("/api/credit-balance", (req, res) => {
  console.log("Credit balance:", req.body);

  return res.json({
    success: true,
    message: "Balance acreditado (mock)"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
