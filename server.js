const express = require("express");
const path = require("path");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 10000;

// On utilise JSON et URL Encoded pour POST si besoin
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Démarrage du serveur avec multi-numéros ---
function startServer(sessions, startBot, commands) {

    // Page principale
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "index.html"));
    });

    // Endpoint pour récupérer le pairing code pour un numéro
    app.get("/pair", async (req, res) => {
        const number = req.query.number;
        if (!number) return res.status(400).json({ error: "Numéro requis" });

        try {
            // Si la session existe déjà, on renvoie l’instance existante
            let marcoInstance = sessions.get(number);
            if (!marcoInstance) {
                // Crée la session si elle n’existe pas
                marcoInstance = await startBot(number);
            }

            // --- Utilisation du vrai pairing code WhatsApp ---
            const code = await marcoInstance.requestPairingCode(number);

            res.status(200).json({ code });
        } catch (err) {
            console.error(`Erreur Pairing pour ${number}:`, err);
            res.status(500).json({ error: "Erreur lors de la génération du code" });
        }
    });

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌍 Serveur de ${config.botName} en ligne sur le port ${PORT}`);
    });
}

module.exports = { startServer };
