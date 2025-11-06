// pages/api/register-token.js
let tokens = new Set(); // geçici bellek (Vercel'de kalıcı değildir)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token missing" });
  }

  // Tekrarlanan token'ları önle
  tokens.add(token);
  console.log("Yeni token kaydedildi:", token);

  return res.status(200).json({ message: "Token kaydedildi", count: tokens.size });
}

// Bu veriyi export ediyoruz ki diğer API'lar erişebilsin
export function getTokens() {
  return Array.from(tokens);
}
