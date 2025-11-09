// pages/api/delete-token.js
import { Redis } from '@upstash/redis';
import { getTokensWithInfo } from './register-token';

// Upstash Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Token'ları Redis'ten al (Map formatında)
async function getTokensMap() {
  if (!redis) {
    return new Map();
  }
  
  try {
    const tokensData = await redis.get('push_tokens');
    if (!tokensData) return new Map();
    
    if (Array.isArray(tokensData)) {
      const map = new Map();
      tokensData.forEach(token => {
        if (typeof token === 'string') {
          map.set(token, { 
            platform: token.startsWith("MOCK_") ? "simulator" : "unknown",
            createdAt: new Date().toISOString()
          });
        } else {
          map.set(token.token, { platform: token.platform, createdAt: token.createdAt });
        }
      });
      return map;
    }
    
    const map = new Map();
    Object.entries(tokensData).forEach(([token, info]) => {
      map.set(token, info);
    });
    return map;
  } catch (error) {
    return new Map();
  }
}

// Token'ları Redis'e kaydet
async function saveTokensMap(tokensMap) {
  if (!redis) {
    return false;
  }
  
  try {
    const tokensObj = {};
    tokensMap.forEach((info, token) => {
      tokensObj[token] = info;
    });
    await redis.set('push_tokens', tokensObj);
    return true;
  } catch (error) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Token listesini göster (platform bilgisi ile)
    try {
      const tokensWithInfo = await getTokensWithInfo();
      
      return res.status(200).json({ 
        tokens: tokensWithInfo,
        count: tokensWithInfo.length 
      });
    } catch (error) {
      return res.status(500).json({ message: "Token listesi alınamadı", error: error.message });
    }
  }

  if (req.method === "DELETE") {
    // Token sil
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    try {
      const tokens = await getTokensMap();
      
      if (!tokens.has(token)) {
        return res.status(404).json({ message: "Token bulunamadı" });
      }

      const deletedInfo = tokens.get(token);
      tokens.delete(token);
      await saveTokensMap(tokens);
      
      const platformEmoji = {
        simulator: "🖥️",
        android: "🤖",
        ios: "🍎",
        unknown: "❓"
      };
      
      console.log(
        "🗑️ Token silindi:",
        `${platformEmoji[deletedInfo?.platform] || "❓"} ${deletedInfo?.platform || "unknown"} - ${token.substring(0, 30)}...`
      );
      console.log("📊 Kalan token sayısı:", tokens.size);

      return res.status(200).json({ 
        message: "Token silindi", 
        count: tokens.size,
        deleted: { token, platform: deletedInfo?.platform }
      });
    } catch (error) {
      console.error("❌ Token silme hatası:", error);
      return res.status(500).json({ message: "Token silinemedi", error: error.message });
    }
  }

  if (req.method === "POST" && req.body.action === "clear") {
    // Tüm token'ları sil
    try {
      const emptyMap = new Map();
      await saveTokensMap(emptyMap);
      
      console.log("🗑️ Tüm token'lar silindi");

      return res.status(200).json({ 
        message: "Tüm token'lar silindi", 
        count: 0
      });
    } catch (error) {
      console.error("❌ Token temizleme hatası:", error);
      return res.status(500).json({ message: "Token'lar temizlenemedi", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

