// cat index.js
const {
    default: makeWASocket, useMultiFileAuthState, DisconnectReason,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const { startServer } = require("./server");
const config = require("./config.json");

const commands = new Map();
const sessions = {}; // <num> => socket instance

// --- LOAD PLUGINS ---
const loadPlugins = () => {
    const pluginPath = path.join(__dirname, "plugins");
    if (!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath);

    fs.readdirSync(pluginPath).forEach(file => {
        if (file.endsWith(".js")) {
            try {
                const plugin = require(`./plugins/${file}`);
                if (plugin.name) commands.set(plugin.name, plugin);
            } catch (e) {
                console.error(`❌ Erreur plugin ${file}:`, e.message);
            }
        }
    });
    console.log(`📦 [${config.botName}] : ${commands.size} Plugins opérationnels`);
};

// --- CREATE OR RETURN SOCKET FOR NUMBER ---
async function getSocket(num) {
    if (sessions[num]) return sessions[num];

    const sessionPath = path.join("sessions", num);
    fs.ensureDirSync(sessionPath);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            console.log(`✅ Session ${num} en ligne !`);
        }
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ Session ${num} déconnectée. Reconnexion: ${shouldReconnect}`);
            if (shouldReconnect) getSocket(num); // recréer socket
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        // Ici tu peux lancer tes plugins
    });

    sessions[num] = sock;
    return sock;
}

// --- START BOT SERVER ---
const startBot = async () => {
    if (Object.keys(sessions).length === 0) loadPlugins();
    startServer(getSocket);
};

startBot().catch(err => console.error("Erreur critique :", err));
