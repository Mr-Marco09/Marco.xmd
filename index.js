////// index.js //////

const { 
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestWaWebVersion,
    Browsers,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const config = require("./config.json");
const { startServer } = require("./server");
const { handleEvents } = require("./events");

const commands = new Map();
const sessions = new Map(); // Multi-numéros
let serverStarted = false;

// --- CHARGEMENT DES PLUGINS ---
const loadPlugins = () => {
    const pluginPath = path.join(__dirname, "plugins");

    if (!fs.existsSync(pluginPath)) {
        fs.mkdirSync(pluginPath);
    }

    fs.readdirSync(pluginPath).forEach((file) => {
        if (file.endsWith(".js")) {
            try {
                const plugin = require(`./plugins/${file}`);
                if (plugin.name) {
                    commands.set(plugin.name, plugin);
                }
            } catch (e) {
                console.error(`❌ Erreur plugin ${file}:`, e.message);
            }
        }
    });

    console.log(`📦 [${config.botName}] : ${commands.size} Plugins opérationnels`);
};


// --- CRÉATION SESSION PAR NUMÉRO ---
async function startBot(number = "default") {

    const sessionPath = path.join(__dirname, "session", number);
    await fs.ensureDir(sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const { version } = await fetchLatestWaWebVersion()
        .catch(() => ({ version: [2, 3000, 1015901307] }));

    const marco = makeWASocket({
        version,
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(
                state.keys,
                pino({ level: "fatal" })
            ),
        }
    });

    // Lancer le serveur UNE SEULE FOIS
    if (!serverStarted) {
        loadPlugins();
        startServer(sessions, startBot); // Multi-instance propre
        serverStarted = true;
    }

    handleEvents(marco, saveCreds, commands);

    // --- GESTION CONNEXION ---
    marco.ev.on("connection.update", ({ connection, lastDisconnect }) => {

        if (connection === "open") {
            console.log(`✅ Session ${number} en ligne !`);
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log(`⚠️ Connexion perdue pour ${number}. Reconnexion : ${shouldReconnect}`);

            if (shouldReconnect) {
                setTimeout(() => startBot(number), 5000);
            } else {
                sessions.delete(number);
            }
        }
    });

    sessions.set(number, marco);
    return marco;
}


// --- AUTO-REPRISE DES SESSIONS EXISTANTES ---
const sessionsPath = path.join(__dirname, "session");
fs.ensureDirSync(sessionsPath);

fs.readdirSync(sessionsPath).forEach((dir) => {
    const fullPath = path.join(sessionsPath, dir);

    if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
        startBot(dir).catch(err =>
            console.error(`Erreur session ${dir}:`, err)
        );
    }
});

// Session par défaut (obligatoire pour initialiser le serveur)
startBot().catch(err =>
    console.error("Erreur critique au démarrage :", err)
);

module.exports = { startBot, sessions, commands };
