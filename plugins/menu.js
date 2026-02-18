const config = require("../config.json");

module.exports = {
    name: "menu",
    alias: ["h", "help"],
    category: "main",
    async execute(conn, mek, args) {
        const from = mek.key.remoteJid;
        
        const uptime = process.uptime();
        const runtime = `${Math.floor(uptime / 60)} minute(s), ${Math.floor(uptime % 60)} seconde(s)`;

        let menuText = `╭━━━━━━〔 *${config.botName.toUpperCase()}* 〕━━━━━━┈⊷
┃ 👤 *Owner:* ${config.ownerName}
┃ 📦 *Commands:* 312
┃ ⏳ *Runtime:* ${runtime}
┃ 🔘 *Prefix:* ${config.prefix}
┃ 🔒 *Mode:* ${config.privateMode ? 'Private' : 'Public'}
╰━━━━━━━━━━━━━━━━━━━━━━┈⊷

「 *DOWNLOAD* 」
┌───────────────────
┝ ➩ .play (Audio/Musique)
┝ ➩ .video (Clip Vidéo)
┝ ➩ .song (Alias Musique)
└───────────────────

> *𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐌𝐑 𝐌𝐀𝐑𝐂𝐎* 🛡️`;

        await conn.sendMessage(from, {
            image: { url: config.botLogo }, // Envoie l'image seule (propre)
            caption: menuText,             // Ton texte en dessous
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                // C'est ce bloc qui crée le BOUTON CLIQUABLE vert en bas
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363233306161477@newsletter", // ID fictif de canal
                    serverMessageId: 100,
                    newsletterName: "Voir la chaîne" // Texte du bouton
                }
            }
        }, { quoted: mek });
    }
};
