const axios = require("axios");
const yts = require("yt-search");

module.exports = {
    name: "video",
    alias: ["mp4", "vid"],
    category: "download",
    desc: "Télécharger des vidéos YouTube",
    async execute(conn, mek, args) {
        const from = mek.key.remoteJid;
        const q = args.join(" ");

        if (!q) return conn.sendMessage(from, { text: "❌ Indique un titre ou un lien vidéo !" }, { quoted: mek });

        try {
            // 1. Recherche Vidéo
            const search = await yts(q);
            const video = search.videos[0];
            if (!video) return conn.sendMessage(from, { text: "❌ Vidéo introuvable." }, { quoted: mek });

            // 2. Appel API (On utilise une API vidéo compatible)
            // Note: Assure-toi d'avoir une API qui supporte le format MP4
            const apiUrl = `https://www.laksidunimsara.com{encodeURIComponent(video.url)}&api_key=Lk8*Vf3!sA1pZ6Hd`;
            const { data } = await axios.get(apiUrl);

            if (data.status !== "success") {
                return conn.sendMessage(from, { text: "❌ Erreur de récupération vidéo." }, { quoted: mek });
            }

            let desc = `
╔═════✦⭒❖⭒✦═════╗
  🎬 *𝐌𝐀𝐑𝐂𝐎-𝐗𝐌𝐃 𝐕𝐈𝐃𝐄𝐎* 🎬
╚═════✦⭒❖⭒✦═════╝

➤ 🎥 *Titre:* ${video.title}
➤ ⏱️ *Durée:* ${video.timestamp}
➤ 👤 *Chaîne:* ${video.author.name}

╔═════✦⭒❖⭒✦═════╗
   ⬇️ *OPTIONS VIDEO* ⬇️
╚═════✦⭒❖⭒✦═════╝

│ ① 🎬 *Vidéo (MP4)*
│ ② 📄 *Document (Fichier)*

> *Répondez à ce message avec 1 ou 2.*
`;

            const sentMsg = await conn.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: desc
            }, { quoted: mek });

            // 3. Sauvegarde pour le Reply Handler
            conn.reply[sentMsg.key.id] = {
                downloadUrl: data.download,
                title: video.title,
                type: "video" // On précise le type pour events.js si besoin
            };

        } catch (e) {
            console.error(e);
            conn.sendMessage(from, { text: "❌ Erreur système vidéo." }, { quoted: mek });
        }
    }
};
