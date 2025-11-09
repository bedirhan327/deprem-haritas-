import { Expo } from "expo-server-sdk";
import { getTokensWithInfo } from "./register-token";

const expo = new Expo();

// İki nokta arasındaki mesafeyi hesapla (Haversine formülü)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ML değerini parse et
function parseML(ml) {
  if (!ml || ml === '-.-' || ml === '') return 0;
  const parsed = parseFloat(ml);
  return isNaN(parsed) ? 0 : parsed;
}

// Kullanıcının tercihlerine göre bildirim gönderilmeli mi?
function shouldNotifyUser(preferences, earthquake) {
  if (!preferences) return true; // Tercih yoksa gönder
  
  const { notifyThreshold, distanceThreshold, minMagnitude, location } = preferences;
  const ml = parseML(earthquake.ML);
  
  // Yüksek büyüklük kontrolü (her zaman bildirim)
  if (ml >= (minMagnitude || 6)) {
    return true;
  }
  
  // Konum bazlı kontrol
  if (location && location.latitude && location.longitude) {
    const distance = getDistanceKm(
      location.latitude,
      location.longitude,
      parseML(earthquake.Enlem),
      parseML(earthquake.Boylam)
    );
    
    if (distance <= (distanceThreshold || 400) && ml >= (notifyThreshold || 1)) {
      return true;
    }
  }
  
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { title, body, earthquake } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: "Eksik bildirim verisi" });
  }

  const tokensWithInfo = await getTokensWithInfo();
  if (tokensWithInfo.length === 0) {
    console.warn("⚠️ Kayıtlı token yok");
    return res.status(200).json({ message: "Kayıtlı token yok", sent: 0 });
  }

  console.log(`📤 ${tokensWithInfo.length} token kontrol ediliyor...`);

  const messages = [];
  const invalidTokens = [];
  let filteredCount = 0;
  
  for (const tokenInfo of tokensWithInfo) {
    const { token, preferences } = tokenInfo;
    
    // Mock token'ları geç
    if (token.startsWith("MOCK_") || !Expo.isExpoPushToken(token)) {
      invalidTokens.push(token);
      continue;
    }
    
    // Eğer deprem bilgisi varsa, kullanıcı tercihlerine göre filtrele
    if (earthquake && !shouldNotifyUser(preferences, earthquake)) {
      filteredCount++;
      continue;
    }
    
    messages.push({
      to: token,
      sound: "default",
      title,
      body,
      data: { 
        timestamp: new Date().toISOString(),
        ...(earthquake && { type: 'earthquake_alert' })
      },
      priority: 'high',
    });
  }

  if (invalidTokens.length > 0) {
    const mockCount = invalidTokens.filter(t => t.startsWith("MOCK_")).length;
    const invalidCount = invalidTokens.length - mockCount;
    
    if (mockCount > 0) {
      console.log(`ℹ️ ${mockCount} mock token atlandı (simülatör test token'ları - normal)`);
    }
    if (invalidCount > 0) {
      console.log(`⚠️ ${invalidCount} geçersiz token atlandı`);
    }
  }

  if (messages.length === 0) {
    const mockCount = invalidTokens.filter(t => t.startsWith("MOCK_")).length;
    return res.status(200).json({ 
      message: mockCount > 0 
        ? "Sadece mock token'lar var (simülatör test token'ları - gerçek bildirim gönderilmez)" 
        : filteredCount > 0
        ? `Tercihler nedeniyle ${filteredCount} kullanıcıya bildirim gönderilmedi`
        : "Geçerli token yok", 
      sent: 0,
      totalTokens: tokensWithInfo.length,
      mockTokens: mockCount,
      filtered: filteredCount
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

  console.log(`✅ ${successCount} bildirim başarıyla gönderildi, ❌ ${errorCount} hata${filteredCount > 0 ? `, 🔇 ${filteredCount} tercih nedeniyle filtrelendi` : ''}`);

  res.status(200).json({ 
    message: "Bildirim gönderildi", 
    sent: successCount,
    errors: errorCount,
    totalTokens: tokensWithInfo.length,
    validTokens: messages.length,
    filtered: filteredCount,
    tickets 
  });
}