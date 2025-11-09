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
let tokensMemory = new Set();

async function getTokensFromRedis() {
  if (!redis) {
    console.warn("⚠️ Redis yapılandırılmamış, geçici bellek kullanılıyor");
    return tokensMemory;
  }
  
  try {
    const tokens = await redis.get('push_tokens');
    return tokens ? new Set(tokens) : new Set();
  } catch (error) {
    console.warn("⚠️ Redis okuma hatası, geçici bellek kullanılıyor:", error.message);
    return tokensMemory;
  }
}

async function saveTokensToRedis(tokensSet) {
  if (!redis) {
    console.warn("⚠️ Redis yapılandırılmamış, geçici bellek kullanılıyor");
    tokensMemory = tokensSet;
    return false;
  }
  
  try {
    await redis.set('push_tokens', Array.from(tokensSet));
    return true;
  } catch (error) {
    console.warn("⚠️ Redis kayıt hatası, geçici bellek kullanılıyor:", error.message);
    tokensMemory = tokensSet;
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token } = req.body;

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
    
    // Tekrarlanan token'ları önle
    const isNew = !tokens.has(token);
    tokens.add(token);
    
    // Redis'e kaydet
    await saveTokensToRedis(tokens);
    
    console.log(isNew ? "✅ Yeni token kaydedildi:" : "🔄 Mevcut token tekrar kaydedildi:", token);
    console.log("📊 Toplam token sayısı:", tokens.size);

    return res.status(200).json({ 
      message: isNew ? "Token kaydedildi" : "Token zaten kayıtlı", 
      count: tokens.size,
      isNew 
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
    return Array.from(tokens);
  } catch (error) {
    console.warn("⚠️ Redis okuma hatası, geçici bellek kullanılıyor:", error.message);
    return Array.from(tokensMemory);
  }
}
