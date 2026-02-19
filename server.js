const express = require("express");
const path = require("path");

function startServer(commands, sessions, startBot) {
    const app = express();
    const PORT = process.env.PORT || 10000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- Page principale ---
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "index.html"));
    });

    // --- Endpoint pour générer un pairing code ---
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
            return res.json({ code });
        } catch (err) {
            console.error(`Erreur création session ${number}:`, err);
            return res.status(500).json({ error: "Impossible de créer la session" });
        }
    });

    // --- Lancer le serveur ---
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌍 Serveur en ligne sur le port ${PORT}`);
    });
}

module.exports = { startServer };
