const express = require("express");
const path = require("path");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 10000;

const startServer = (sessions, startBot) => {

    // 1. AFFICHER TON DESIGN MATRIX
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // 2. LOGIQUE DE PAIRING (MULTI-INSTANCE SANS CASSER LE PAIRING CODE)
    app.get('/pair', async (req, res) => {

        const num = req.query.number;

        if (!num) return res.status(400).json({ error: "Numéro requis" });

        try {

            let marcoInstance = sessions.get(num);

            // Si la session n'existe pas → création
            if (!marcoInstance) {
                marcoInstance = await startBot(num);
                sessions.set(num, marcoInstance);
            }

            // ⚠️ IMPORTANT :
            // On NE DOIT PAS attendre connection "open"
            // Le pairing code doit être demandé pendant la phase connecting
            const code = await marcoInstance.requestPairingCode(num);

            res.status(200).json({ code });

        } catch (err) {
            console.error("Erreur Pairing:", err);
            res.status(500).json({ error: "Erreur lors de la génération" });
        }
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌍 Serveur de ${config.botName} en ligne sur le port ${PORT}`);
    });
};

module.exports = { startServer };
