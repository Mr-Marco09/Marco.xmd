const { 
    default: makeWASocket, useMultiFileAuthState, DisconnectReason, 
    fetchLatestWaWebVersion, Browsers, makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const config = require("./config.json");
const { startServer } = require("./server");
const { handleEvents } = require("./events");

const commands = new Map();
const sessions = new Map(); // Stocke les sockets et pairing code par numéro
let serverStarted = false;

// --- Chargement des plugins ---
const loadPlugins = () => {
    const pluginPath = path.join(__dirname, "plugins");
    if (!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath);

    fs.readdirSync(pluginPath).forEach(file => {
        if (file.endsWith(".js")) {
            try {
                const plugin = require(`./plugins/${file}`);
                if (plugin.name && typeof plugin.execute === "function") {
                    commands.set(plugin.name, plugin);
                } else console.warn(`⚠️ Plugin ${file} ignoré : format incorrect`);
            } catch (e) {
                console.error(`❌ Erreur plugin ${file}:`, e.message);
            }
        }
    });
    console.log(`📦 [${config.botName}] : ${commands.size} Plugins opérationnels`);
};

// --- Création d'une session pour un numéro ---
async function startBot(sessionId) {
    const sessionFolder = path.join(__dirname, "session", sessionId);
    await fs.ensureDir(sessionFolder);

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

    const { version } = await fetchLatestWaWebVersion().catch(() => {
        console.warn("⚠️ Impossible de récupérer la version WA, fallback utilisé");
        return { version: [2, 3000, 1015901307] };
    });

    const socket = makeWASocket({
        version,
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        }
    });

    if (!serverStarted) {
        loadPlugins();
        startServer(commands, sessions, startBot); // passe tout au serveur
        serverStarted = true;
    }

    handleEvents(socket, saveCreds, commands);

    // --- Gestion de la connexion ---
    socket.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log(`✅ Session ${sessionId} en ligne !`);
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ Connexion perdue pour ${sessionId}. Reconnexion : ${shouldReconnect}`);
            if (shouldReconnect) setTimeout(() => startBot(sessionId), 5000);
        }
    });

    // Générer un pairing code alphanumérique
    const pairingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    sessions.set(sessionId, { socket, pairingCode });
    return pairingCode;
}

// --- Auto-démarrage des sessions existantes ---
const sessionsPath = path.join(__dirname, "session");
fs.ensureDirSync(sessionsPath);

fs.readdirSync(sessionsPath).forEach(dir => {
    const fullPath = path.join(sessionsPath, dir);
    if (fs.lstatSync(fullPath).isDirectory()) {
        startBot(dir).catch(err => console.error(`Erreur au démarrage de ${dir}:`, err));
    }
});

module.exports = { startBot, sessions, commands };
