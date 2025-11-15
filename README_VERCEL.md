# Deploy FactionWebManager ke Vercel

## Setup Environment Variables di Vercel

**PENTING:** Environment variables HARUS di-set di Vercel sebelum deploy, atau aplikasi akan menggunakan localhost (default).

### Langkah-langkah:

1. **Buka Vercel Dashboard**
   - Login ke https://vercel.com
   - Pilih project FactionWebManager

2. **Pergi ke Settings → Environment Variables**
   - Klik tab "Environment Variables"
   - Atau langsung: `https://vercel.com/[username]/[project]/settings/environment-variables`

3. **Tambahkan Environment Variables berikut:**

   Klik "Add New" untuk setiap variable:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `DB_HOST` | `49.128.184.34` | Database host IP/domain |
   | `DB_PORT` | `3406` | Database port |
   | `DB_USER` | `u143_8Iv5ZNvRLS` | Database username |
   | `DB_PASSWORD` | `uh14Qyd.I.pP@Frog^yLy7kR` | Database password |
   | `DB_NAME` | `s143_db_unturned` | Database name |

   **Atau copy-paste langsung:**
   ```
   DB_HOST=49.128.184.34
   DB_PORT=3406
   DB_USER=u143_8Iv5ZNvRLS
   DB_PASSWORD=uh14Qyd.I.pP@Frog^yLy7kR
   DB_NAME=s143_db_unturned
   ```

4. **Pilih Environment:**
   - ✅ **Production** (wajib)
   - ✅ **Preview** (opsional, untuk preview deployments)
   - ✅ **Development** (opsional, untuk local dev)

5. **Save dan Redeploy:**
   - Klik "Save"
   - **PENTING:** Setelah menambahkan environment variables, **Redeploy** project:
     - Klik tab "Deployments"
     - Klik "..." pada deployment terbaru
     - Pilih "Redeploy"
     - Atau push commit baru ke git

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

