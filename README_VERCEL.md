# Deploy FactionWebManager ke Vercel

## ⚠️ Troubleshooting 404 Error

Jika Anda mendapatkan error 404 setelah deploy:

### 1. Pastikan Framework Preset di Vercel
- Buka **Project Settings** → **General**
- Pastikan **"Framework Preset"** adalah **"Other"** atau **"Node.js"**
- **JANGAN** pilih Next.js, React, atau framework lain

### 2. Pastikan Build & Development Settings
- **Build Command:** (kosongkan atau biarkan default)
- **Output Directory:** (kosongkan)
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

### 3. Pastikan Root Directory
- Jika project ada di subfolder, set **Root Directory** ke `FactionWebManager`
- Jika project di root, biarkan kosong

### 4. Redeploy setelah perubahan
- Setelah mengubah settings, klik **"Redeploy"** di dashboard Vercel
- **PENTING:** Uncheck **"Use existing Build Cache"** saat redeploy

### 5. Cek Logs
- Buka **Deployments** → Pilih deployment terbaru → **"View Function Logs"**
- Pastikan tidak ada error saat startup

## Setup Environment Variables di Vercel

**PENTING:** Environment variables HARUS di-set di Vercel sebelum deploy, atau aplikasi akan menggunakan default values.

### Format Environment Variables

Di Vercel Dashboard → Settings → Environment Variables, tambahkan variables berikut:

| Key | Value | Environment |
|-----|-------|-------------|
| `DB_HOST` | `49.128.184.34` | ✅ Production (wajib) |
| `DB_PORT` | `3406` | ✅ Production (wajib) |
| `DB_USER` | `u143_8Iv5ZNvRLS` | ✅ Production (wajib) |
| `DB_PASSWORD` | `uh14Qyd.I.pP@Frog^yLy7kR` | ✅ Production (wajib) |
| `DB_NAME` | `s143_db_unturned` | ✅ Production (wajib) |

**⚠️ PENTING:** Jangan set `PORT` di Vercel! Vercel akan otomatis set PORT untuk serverless functions.

### Langkah-langkah Input di Vercel:

1. **Buka Vercel Dashboard**
   - Login ke https://vercel.com
   - Pilih project **FactionWebManager**

2. **Pergi ke Settings → Environment Variables**
   - Klik tab "Environment Variables" di sidebar kiri

3. **Tambahkan setiap variable:**
   
   Klik **"Add New"** dan isi:
   
   - **Key:** `DB_HOST`
   - **Value:** `49.128.184.34`
   - **Environment:** ✅ Production (wajib), ✅ Preview (opsional), ✅ Development (opsional)
   - Klik **"Save"**
   
   Ulangi untuk:
   - `DB_PORT` = `3406`
   - `DB_USER` = `u143_8Iv5ZNvRLS`
   - `DB_PASSWORD` = `uh14Qyd.I.pP@Frog^yLy7kR`
   - `DB_NAME` = `s143_db_unturned`

4. **Redeploy setelah menambahkan semua variables:**
   - Klik tab **"Deployments"**
   - Klik **"..."** pada deployment terbaru
   - Pilih **"Redeploy"**
   - **PENTING:** Uncheck "Use existing Build Cache"
   - Klik **"Redeploy"**

## Verifikasi Environment Variables

Setelah redeploy, cek logs di Vercel:
1. Buka deployment → "Logs"
2. Cari log yang dimulai dengan "🔍 Environment variables check:"
3. Pastikan semua menunjukkan "✅ Set"

**Contoh log yang benar:**
```
🔍 Environment variables check:
  DB_HOST: ✅ Set
  DB_PORT: ✅ Set
  DB_USER: ✅ Set
  DB_PASSWORD: ✅ Set (hidden)
  DB_NAME: ✅ Set
  NODE_ENV: production
  VERCEL: ✅ Yes
✅ Using environment variables for database configuration
📊 Final database configuration:
  Host: 49.128.184.34
  Port: 3406
  User: u143_8Iv5ZNvRLS
  Database: s143_db_unturned
  Password: ✅ Set (hidden)
```

**Jika masih muncul "❌ Not set":**
- Environment variables belum di-set dengan benar
- Belum redeploy setelah menambahkan variables
- Cek apakah variable name sudah benar (case-sensitive)

## Troubleshooting

### Masalah: Masih connect ke localhost

**Solusi:**
1. ✅ Pastikan environment variables sudah di-set di Vercel Dashboard
2. ✅ Pastikan sudah **Redeploy** setelah menambahkan variables
3. ✅ Cek logs untuk melihat apakah variables terdeteksi
4. ✅ Pastikan variable names benar (DB_HOST, DB_USER, DB_NAME - semua uppercase)

### Masalah: "config.js not found"

**Ini NORMAL di Vercel!** File `config.js` tidak di-commit ke git (ada di .gitignore).
Aplikasi akan menggunakan environment variables jika `config.js` tidak ada.

### Masalah: Database connection failed

**Kemungkinan penyebab:**
1. Database host tidak accessible dari internet
2. Firewall memblokir koneksi dari Vercel IP
3. Database credentials salah
4. Database server down

**Solusi:**
- Pastikan database host accessible dari internet (bukan localhost)
- Whitelist Vercel IP ranges di firewall database
- Verifikasi credentials di environment variables

## Catatan Penting

- ❌ **JANGAN commit file `config.js`** ke git (sudah ada di .gitignore)
- ✅ Environment variables akan **override** config.js jika ada
- ✅ Di production (Vercel), aplikasi akan **prioritas menggunakan environment variables**
- ✅ Pastikan database host **accessible dari internet** (bukan localhost)
- ✅ **Redeploy wajib** setelah menambahkan/mengubah environment variables

## Testing

Setelah deploy, cek:
1. Health check: `https://your-app.vercel.app/api/health`
2. Debug schema: `https://your-app.vercel.app/api/debug/schema`
3. Cek logs di Vercel untuk melihat database config yang digunakan

