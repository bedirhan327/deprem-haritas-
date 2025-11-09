# Upstash Redis Kurulum Kılavuzu (ÜCRETSİZ!)

## 🎯 Token'ları Kalıcı Hale Getirme - Ücretsiz Çözüm

Vercel KV artık ücretsiz değil, bu yüzden **Upstash Redis** kullanıyoruz. Ücretsiz tier var ve çok kolay kurulum!

## 📦 Adım 1: Upstash Redis Oluştur (ÜCRETSİZ!)

### 1. Upstash Hesabı Oluştur:

1. **Upstash'e git:** https://console.upstash.com/
2. **"Sign Up"** veya **"Login"** (Google/GitHub ile giriş yapabilirsin)
3. **"Create Database"** butonuna tıkla

### 2. Database Oluştur:

1. **Database Name:** `push-tokens` (veya istediğin isim)
2. **Type:** `Regional` (ücretsiz) veya `Global` (ücretli)
3. **Region:** En yakın bölgeyi seç (ör: `eu-west-1`)
4. **"Create"** butonuna tıkla

### 3. REST API Bilgilerini Al:

Database oluşturulduktan sonra:

1. Database sayfasında **"REST API"** sekmesine git
2. Şu bilgileri kopyala:
   - **UPSTASH_REDIS_REST_URL** (URL)
   - **UPSTASH_REDIS_REST_TOKEN** (Token)

## 🔑 Adım 2: Vercel Environment Variables Ekle

1. **Vercel Dashboard'a git:** https://vercel.com/dashboard
2. **Projeni seç** (`deprem-haritas` veya proje adın)
3. **"Settings"** sekmesine git
4. **"Environment Variables"** bölümüne git
5. **Yeni değişken ekle:**

   **Değişken 1:**
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: Upstash'ten kopyaladığın URL
   - Environment: `Production`, `Preview`, `Development` (hepsini seç)
   - **"Save"**

   **Değişken 2:**
   - Name: `UPSTASH_REDIS_REST_TOKEN`
   - Value: Upstash'ten kopyaladığın Token
   - Environment: `Production`, `Preview`, `Development` (hepsini seç)
   - **"Save"**

## 🚀 Adım 3: Deploy Et

```bash
cd nextjs-app

# Package'ı yükle (Upstash Redis)
npm install

# Değişiklikleri commit et
git add .
git commit -m "Add Upstash Redis for persistent token storage"

# Push et (Vercel otomatik deploy eder)
git push
```

Veya manuel deploy:

```bash
vercel --prod
```

## ✅ Adım 4: Test Et

1. **Mobil uygulamayı aç** → Token kaydedilir
2. **Upstash Console'da kontrol et:**
   - Database → `push-tokens` → `push_tokens` key'ini gör
3. **Yeni deployment yap** → Token'lar hala orada!
4. **Push Test butonuna bas** → Bildirim gönderilir

## 🔍 Upstash Console'dan Kontrol

1. **Upstash Console:** https://console.upstash.com/
2. **Database'i seç** → `push-tokens`
3. **"Data Browser"** sekmesine git
4. **`push_tokens`** key'ini gör → Token'ları görebilirsin

## 💰 Ücretsiz Plan Limitleri

- **10,000 commands/day** (günlük)
- **256 MB storage**
- **Regional databases** (ücretsiz)
- Token'lar için yeterli!

## 💡 Önemli Notlar

1. **Fallback Mekanizma:**
   - Eğer Redis yoksa veya hata olursa, geçici bellek kullanılır
   - Development'ta Redis olmadan da çalışır

2. **Token Formatı:**
   - Token'lar Set olarak saklanır (duplicate önlenir)
   - JSON array olarak Redis'te tutulur

3. **Güvenlik:**
   - Token'lar environment variables'da saklanır
   - REST API token'ı güvenli tutulmalı

## 🐛 Sorun Giderme

### Sorun: "Redis is not defined"
**Çözüm:**
- Environment variables'ların doğru eklendiğinden emin ol
- `UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` var mı kontrol et
- Deployment sonrası environment variables'ların yüklendiğini kontrol et

### Sorun: Token'lar kayboluyor
**Çözüm:**
- Upstash database'in oluşturulduğundan emin ol
- Environment variables'ların production'da da olduğunu kontrol et
- Upstash Console'da `push_tokens` key'ini kontrol et

### Sorun: Rate limit hatası
**Çözüm:**
- Ücretsiz plan: 10,000 commands/day
- Eğer aşıyorsan, daha az sıklıkla kayıt yap
- Veya Upstash Pro plan'a geç (ücretli)

### Sorun: Redis çalışmıyor
**Çözüm:**
- Fallback mekanizma devreye girer (geçici bellek)
- Console log'larına bak: "⚠️ Redis hatası" mesajı görürsen Redis ayarlarını kontrol et

## 📊 Kod Yapısı

- `register-token.js`: Token'ları Redis'e kaydeder
- `send-notifications.js`: Token'ları Redis'ten okur
- Fallback: Redis yoksa geçici bellek kullanır

## 🎉 Tamamlandı!

Artık token'lar deployment'lar arasında kalıcı! Her yeni deployment'ta token'lar korunacak.

## 🔗 Faydalı Linkler

- **Upstash Console:** https://console.upstash.com/
- **Upstash Docs:** https://docs.upstash.com/
- **Upstash Redis REST API:** https://docs.upstash.com/redis/features/restapi

