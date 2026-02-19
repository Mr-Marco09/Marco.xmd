import { db } from "./db.js";
import { botSessions } from "./schema.js";
import { eq } from "drizzle-orm";

export class DatabaseStorage {
  async getSessions() {
    return await db.select().from(botSessions);
  }

  async updateSessionStatus(phoneNumber, status, pairingCode) {
    const result = await db
      .update(botSessions)
      .set({ status, pairingCode, updatedAt: new Date() })
      .where(eq(botSessions.phoneNumber, phoneNumber))
      .returning();

    if (!result.length) {
      await this.createSession({ phoneNumber });
      await db
        .update(botSessions)
        .set({ status, pairingCode, updatedAt: new Date() })
        .where(eq(botSessions.phoneNumber, phoneNumber));
    }
  }

  async createSession(data) {
    try {
      const [session] = await db.insert(botSessions).values(data).returning();
      return session;
    } catch {
      const [existing] = await db
        .select()
        .from(botSessions)
        .where(eq(botSessions.phoneNumber, data.phoneNumber));
      return existing;
    }
  }
}

export const storage = new DatabaseStorage();
