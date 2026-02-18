const axios = require("axios");
const yts = require("yt-search");

module.exports = {
    name: "play",
    alias: ["song", "musique", "audio"], // Les alias sont bien ici
    category: "download",
    desc: "Recherche et télécharge de la musique YouTube",
    async execute(conn, mek, args) {
        const from = mek.key.remoteJid;
        const q = args.join(" ");

        if (!q) return conn.sendMessage(from, { text: "❌ Précise un titre ou un lien YouTube." }, { quoted: mek });

        try {
            // 1. Recherche sur YouTube
            const search = await yts(q);
            const video = search.videos[0]; // On prend le premier résultat
            if (!video) return conn.sendMessage(from, { text: "❌ Aucun résultat trouvé." }, { quoted: mek });

            // 2. Appel à l'API (Utilisation de la clé fournie dans ton code précédent)
            const apiUrl = `https://www.laksidunimsara.com{encodeURIComponent(video.url)}&api_key=Lk8*Vf3!sA1pZ6Hd`;
            const { data } = await axios.get(apiUrl);

            if (data.status !== "success") {
                return conn.sendMessage(from, { text: "❌ Erreur lors de la récupération du lien via l'API." }, { quoted: mek });
            }

            // 3. Design du message
            let desc = `
╔═════✦⭒❖⭒✦═════╗
  🎶 *𝐌𝐀𝐑𝐂𝐎-𝐗𝐌𝐃 𝐏𝐋𝐀𝐘* 🎶
╚═════✦⭒❖⭒✦═════╝

➤ 🎧 *Titre:* ${video.title}
➤ ⏱️ *Durée:* ${video.timestamp}
➤ 👤 *Chaîne:* ${video.author.name}
➤ 🔗 *Lien:* ${video.url}

╔═════✦⭒❖⭒✦═════╗
   ⬇️ *CHOISIS TON FORMAT* ⬇️
╚═════✦⭒❖⭒✦═════╝

│ ① 🎵 *Audio (MP3)*
│ ② 📄 *Document (Fichier)*
│ ③ 🎙️ *Note Vocale (PTT)*

> *Répondez à ce message avec le chiffre (1, 2 ou 3) pour télécharger.*

𝐑ᴇᴘʟʏ 𝐓ʜᴇ 𝐍ᴜᴍʙᴇʀ 𝐘ᴏᴜ 𝐖ᴀɴᴛ 𝐓ᴏ 𝐒ᴇʟᴇᴄᴛ.......👁️❗
`;

            // 4. Envoi et stockage de l'ID pour le Reply Handler de events.js
            const sentMsg = await conn.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: desc
            }, { quoted: mek });

            // On mémorise l'ID du message envoyé pour que events.js sache à quoi on répond
            conn.reply[sentMsg.key.id] = {
                downloadUrl: data.download,
                title: video.title
            };

        } catch (e) {
            console.error("Erreur Play Plugin:", e);
            conn.sendMessage(from, { text: "❌ Une erreur est survenue lors de la recherche." }, { quoted: mek });
        }
    }
};
