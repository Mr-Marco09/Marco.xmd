const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const { startBot, sessions, commands } = require("./index");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Page principale ---
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// --- Endpoint pour générer le pairing code ---
app.post("/pair", async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: "Numéro requis" });

    try {
        // Si la session existe déjà, renvoie le code existant
        if (sessions.has(number)) {
            return res.json({ code: sessions.get(number).pairingCode });
        }

        // Crée la session et récupère le pairing code
        const code = await startBot(number);
        console.log(`🟢 Pairing code généré pour ${number}: ${code}`);
        return res.json({ code });
    } catch (err) {
        console.error(`Erreur création session ${number}:`, err);
        return res.status(500).json({ error: "Impossible de créer la session" });
    }
});

// --- Lancer le serveur ---
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Serveur de ${config.botName} en ligne sur le port ${PORT}`);
});

// --- Détecte automatiquement les sessions existantes au démarrage ---
const sessionsPath = path.join(__dirname, "session");
fs.ensureDirSync(sessionsPath);

fs.readdirSync(sessionsPath).forEach(dir => {
    const fullPath = path.join(sessionsPath, dir);
    if (fs.lstatSync(fullPath).isDirectory()) {
        startBot(dir).catch(err => console.error(`Erreur au démarrage de ${dir}:`, err));
    }
});
