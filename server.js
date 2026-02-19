////// server.js //////

const express = require("express");
const path = require("path");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 10000;

// Map locale pour stocker les instances par numéro
const instances = new Map();

const startServer = (createBotInstance) => {
    
    // 1. AFFICHER TON DESIGN MATRIX
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // 2. LOGIQUE IDENTIQUE DE PAIRING
    app.get('/pair', async (req, res) => {

        const num = req.query.number;

        if (!num) 
            return res.status(400).json({ error: "Numéro requis" });

        try {

            let marcoInstance = instances.get(num);

            // Si aucune instance pour ce numéro → on en crée une
            if (!marcoInstance) {
                marcoInstance = await createBotInstance(num);
                instances.set(num, marcoInstance);
            }

            if (!marcoInstance)
                return res.status(503).json({ error: "Bot non prêt" });

            // EXACTEMENT la même logique que ton code original
            const code = await marcoInstance.requestPairingCode(num);

            res.status(200).json({ code: code });

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
