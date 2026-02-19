import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const botSessions = pgTable("bot_sessions", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  status: text("status").notNull().default("disconnected"),
  pairingCode: text("pairing_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
