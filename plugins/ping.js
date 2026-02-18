const config = require("../config.json");

module.exports = {
    name: "ping",
    alias: ["speed"],
    category: "main",
    desc: "Vérifie la vitesse du bot",
    async execute(conn, mek, args) {
        const from = mek.key.remoteJid;

        // 1. Création du "Fake Quoted" (le message de statut stylé)
        const fakeStatus = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                conversation: `🕒 𝐃𝐀𝐓𝐄 : ${new Date().toLocaleDateString()}`
            }
        };

        try {
            const startTime = Date.now();
            
            // 2. Premier message pour calculer la latence
            const { key } = await conn.sendMessage(from, { text: '> *ᴘɪɴɢɪɴɢ...*' });
            
            const endTime = Date.now();
            const ping = endTime - startTime;

            // 3. Envoi du résultat avec ton style
            await conn.sendMessage(from, { 
                text: `> *𝐌𝐚𝐫𝐜𝐨 𝐗𝐌𝐃 𝐒ᴘᴇᴇᴅ : ${ping}ms 🍷*` 
            }, { quoted: fakeStatus });

        } catch (e) {
            console.error(e);
            conn.sendMessage(from, { text: "❌ Erreur de ping." });
        }
    }
};
