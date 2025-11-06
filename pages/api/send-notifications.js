import { Expo } from "expo-server-sdk";
import { getTokens } from "./register-token";

const expo = new Expo();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: "Eksik bildirim verisi" });
  }

  const tokens = getTokens();
  if (tokens.length === 0) {
    return res.status(200).json({ message: "Kayıtlı token yok" });
  }

  const messages = [];
  for (const pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) continue;
    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  res.status(200).json({ message: "Bildirim gönderildi", tickets });
}