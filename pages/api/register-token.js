// pages/api/register-token.js
import { Redis } from '@upstash/redis';

// Upstash Redis client (environment variables'dan otomatik alır)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Fallback: Eğer Redis yoksa geçici bellek kullan (development için)
// Token'ları object olarak sakla: { token: string, platform: string, createdAt: string }
let tokensMemory = new Map(); // token -> { platform, createdAt }

async function getTokensFromRedis() {
  if (!redis) {
    console.warn("⚠️ Redis yapılandırılmamış, geçici bellek kullanılıyor");
    return tokensMemory;
  }
  
  try {
    const tokensData = await redis.get('push_tokens');
    if (!tokensData) return new Map();
    
    // Eski format (array of strings) veya yeni format (object) kontrolü
    if (Array.isArray(tokensData)) {
      const map = new Map();
      tokensData.forEach(token => {
        if (typeof token === 'string') {
          // Eski format - sadece token string
          map.set(token, { 
            platform: token.startsWith("MOCK_") ? "simulator" : "unknown",
            createdAt: new Date().toISOString()
          });
        } else {
          // Yeni format - object
          map.set(token.token, { platform: token.platform, createdAt: token.createdAt });
        }
      });
      return map;
    }
    
    // Object formatından Map'e çevir
    const map = new Map();
    Object.entries(tokensData).forEach(([token, info]) => {
      map.set(token, info);
    });
    return map;
  } catch (error) {
    console.warn("⚠️ Redis okuma hatası, geçici bellek kullanılıyor:", error.message);
    return tokensMemory;
  }
}

async function saveTokensToRedis(tokensMap) {
  if (!redis) {
    console.warn("⚠️ Redis yapılandırılmamış, geçici bellek kullanılıyor");
    tokensMemory = tokensMap;
    return false;
  }
  
  try {
    // Map'i object'e çevir
    const tokensObj = {};
    tokensMap.forEach((info, token) => {
      tokensObj[token] = info;
    });
    await redis.set('push_tokens', tokensObj);
    return true;
  } catch (error) {
    console.warn("⚠️ Redis kayıt hatası, geçici bellek kullanılıyor:", error.message);
    tokensMemory = tokensMap;
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, platform, deviceInfo } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token missing" });
  }

  // Token formatını kontrol et
  if (!token.startsWith("ExponentPushToken[") && !token.startsWith("MOCK_")) {
    console.warn("⚠️ Geçersiz token formatı:", token);
    // Yine de kaydet (mock token olabilir)
  }

  try {
    // Token'ları Redis'ten al
    const tokens = await getTokensFromRedis();
    
    // Platform bilgisini belirle
    const detectedPlatform = platform || (token.startsWith("MOCK_") ? "simulator" : "unknown");
    
    // Tekrarlanan token'ları önle
    const isNew = !tokens.has(token);
    
    // Token bilgilerini kaydet
    tokens.set(token, {
      platform: detectedPlatform,
      createdAt: tokens.get(token)?.createdAt || new Date().toISOString(),
      deviceInfo: deviceInfo || null,
    });
    
    // Redis'e kaydet
    await saveTokensToRedis(tokens);
    
    const platformEmoji = {
      simulator: "🖥️",
      android: "🤖",
      ios: "🍎",
      unknown: "❓"
    };
    
    console.log(
      isNew ? "✅ Yeni token kaydedildi:" : "🔄 Mevcut token güncellendi:",
      `${platformEmoji[detectedPlatform] || "❓"} ${detectedPlatform} - ${token.substring(0, 30)}...`
    );
    console.log("📊 Toplam token sayısı:", tokens.size);

    return res.status(200).json({ 
      message: isNew ? "Token kaydedildi" : "Token güncellendi", 
      count: tokens.size,
      isNew,
      platform: detectedPlatform
    });
  } catch (error) {
    console.error("❌ Token kayıt hatası:", error);
    return res.status(500).json({ message: "Token kaydedilemedi", error: error.message });
  }
}

// Bu veriyi export ediyoruz ki diğer API'lar erişebilsin
export async function getTokens() {
  try {
    const tokens = await getTokensFromRedis();
    // Map'ten sadece token string'lerini al
    return Array.from(tokens.keys());
  } catch (error) {
    console.warn("⚠️ Redis okuma hatası, geçici bellek kullanılıyor:", error.message);
    return Array.from(tokensMemory.keys());
  }
}

// Token bilgilerini al (platform bilgisi ile)
export async function getTokensWithInfo() {
  try {
    const tokens = await getTokensFromRedis();
    const tokensArray = [];
    tokens.forEach((info, token) => {
      tokensArray.push({ token, ...info });
    });
    return tokensArray;
  } catch (error) {
    console.warn("⚠️ Redis okuma hatası, geçici bellek kullanılıyor:", error.message);
    const tokensArray = [];
    tokensMemory.forEach((info, token) => {
      tokensArray.push({ token, ...info });
    });
    return tokensArray;
  }
}
