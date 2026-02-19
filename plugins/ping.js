export default async function pingPlugin(sock, msg) {
  const text = msg.message?.conversation || "";
  if (!text) return;

  if (text.toLowerCase() === "ping") {
    if (!msg.key?.remoteJid) return;
    await sock.sendMessage(msg.key.remoteJid, { text: "pong" });
  }
}
