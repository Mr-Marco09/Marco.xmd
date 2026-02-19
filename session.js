import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} from "@whiskeysockets/baileys";
import path from "path";
import { storage } from "./storage.js";

export async function initSession(phoneNumber) {
  const sessionPath = path.join(process.cwd(), "session", phoneNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    browser: Browsers.ubuntu("Chrome")
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      await storage.updateSessionStatus(phoneNumber, "connected", null);
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      await storage.updateSessionStatus(phoneNumber, "disconnected", null);

      if (shouldReconnect) {
        setTimeout(() => initSession(phoneNumber), 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    try {
      const plugin = (await import("./plugins/ping.js")).default;
      await plugin(sock, msg);
    } catch (err) {
      console.error("Plugin error:", err);
    }
  });

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(phoneNumber);
    await storage.updateSessionStatus(phoneNumber, "pending", code);
    return code;
  }

  return null;
}
