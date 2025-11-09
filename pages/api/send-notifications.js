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

  const tokens = await getTokens();
  if (tokens.length === 0) {
    console.warn("⚠️ Kayıtlı token yok");
    return res.status(200).json({ message: "Kayıtlı token yok", sent: 0 });
  }

  console.log(`📤 ${tokens.length} token'a bildirim gönderiliyor...`);

  const messages = [];
  const invalidTokens = [];
  
  for (const pushToken of tokens) {
    // Mock token'ları geç (gerçek bildirim göndermez)
    // Mock token'lar "MOCK_" prefix'i ile başlar
    if (pushToken.startsWith("MOCK_") || !Expo.isExpoPushToken(pushToken)) {
      invalidTokens.push(pushToken);
      continue;
    }
    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data: { timestamp: new Date().toISOString() },
    });
  }

  if (invalidTokens.length > 0) {
    console.log(`⚠️ ${invalidTokens.length} geçersiz/mock token atlandı`);
  }

  if (messages.length === 0) {
    return res.status(200).json({ 
      message: "Geçerli token yok (sadece mock token'lar var)", 
      sent: 0,
      totalTokens: tokens.length 
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  let successCount = 0;
  let errorCount = 0;

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      
      // Ticket sonuçlarını kontrol et
      ticketChunk.forEach((ticket) => {
        if (ticket.status === "ok") {
          successCount++;
        } else {
          errorCount++;
          console.error("❌ Bildirim gönderme hatası:", ticket);
        }
      });
    } catch (error) {
      console.error("❌ Chunk gönderme hatası:", error);
      errorCount += chunk.length;
    }
  }

  console.log(`✅ ${successCount} bildirim başarıyla gönderildi, ❌ ${errorCount} hata`);

  res.status(200).json({ 
    message: "Bildirim gönderildi", 
    sent: successCount,
    errors: errorCount,
    totalTokens: tokens.length,
    validTokens: messages.length,
    tickets 
  });
}