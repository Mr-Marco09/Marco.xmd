//////server.js////

const express = require("express");
const path = require("path"); // Ajout nécessaire pour envoyer le fichier HTML
const config = require("./config.json");
const app = express();
const PORT = process.env.PORT || 10000;

const startServer = (marcoInstance) => {
    
    // 1. AFFICHER TON DESIGN MATRIX
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // 2. CORRECTION DE LA LOGIQUE DE PAIRING
    app.get('/pair', async (req, res) => {
        // On utilise 'number' pour être en accord avec ton fichier HTML
        const num = req.query.number; 
        
        if (!num) return res.status(400).json({ error: "Numéro requis" });

        if (!marcoInstance) return res.status(503).json({ error: "Bot non prêt" });

        try {
            const code = await marcoInstance.requestPairingCode(num);
            // On renvoie 'code' car ton HTML attend data.code
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
