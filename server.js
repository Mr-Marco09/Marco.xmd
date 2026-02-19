import express from "express";
import config from "./config.json" assert { type: "json" };
import { initSession } from "./session.js";
import { storage } from "./storage.js";

const app = express();
app.use(express.json());

app.post("/session", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "Missing phoneNumber" });

  await storage.createSession({ phoneNumber });
  const code = await initSession(phoneNumber);

  res.json({ pairingCode: code });
});

app.get("/sessions", async (req, res) => {
  const sessions = await storage.getSessions();
  res.json(sessions);
});

app.listen(process.env.PORT || config.port, () => {
  console.log("Server running on port", process.env.PORT || config.port);
});
