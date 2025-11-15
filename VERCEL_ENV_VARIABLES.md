# Environment Variables untuk Vercel

## Format Environment Variables

Di Vercel Dashboard → Settings → Environment Variables, tambahkan variables berikut:

### Production Environment Variables

| Key | Value | Description | Required |
|-----|-------|-------------|----------|
| `DB_HOST` | `49.128.184.34` | Database host IP/domain | ✅ Yes |
| `DB_PORT` | `3406` | Database port | ✅ Yes |
| `DB_USER` | `u143_8Iv5ZNvRLS` | Database username | ✅ Yes |
| `DB_PASSWORD` | `uh14Qyd.I.pP@Frog^yLy7kR` | Database password | ✅ Yes |
| `DB_NAME` | `s143_db_unturned` | Database name | ✅ Yes |
| `PORT` | _(tidak perlu)_ | Server port - **Vercel set otomatis** | ❌ No |

**⚠️ PENTING:** Jangan set `PORT` di Vercel! Vercel akan otomatis set PORT untuk serverless functions.

## Cara Input di Vercel

1. **Buka Vercel Dashboard**
   - Login ke https://vercel.com
   - Pilih project **FactionWebManager**

2. **Pergi ke Settings → Environment Variables**
   - Klik tab "Environment Variables" di sidebar kiri

3. **Tambahkan setiap variable satu per satu:**
   
   Klik tombol **"Add New"** dan isi:
   
   **Variable 1:**
   - Key: `DB_HOST`
   - Value: `49.128.184.34`
   - Environment: ✅ Production (wajib), ✅ Preview (opsional), ✅ Development (opsional)
   - Klik **"Save"**
   
   **Variable 2:**
   - Key: `DB_PORT`
   - Value: `3406`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klik **"Save"**
   
   **Variable 3:**
   - Key: `DB_USER`
   - Value: `u143_8Iv5ZNvRLS`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klik **"Save"**
   
   **Variable 4:**
   - Key: `DB_PASSWORD`
   - Value: `uh14Qyd.I.pP@Frog^yLy7kR`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klik **"Save"**
   
   **Variable 5:**
   - Key: `DB_NAME`
   - Value: `s143_db_unturned`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klik **"Save"**

4. **Setelah semua variables ditambahkan, REDEPLOY:**
   - Klik tab **"Deployments"**
   - Klik **"..."** pada deployment terbaru
   - Pilih **"Redeploy"**
   - **PENTING:** Uncheck "Use existing Build Cache" untuk memastikan build baru
   - Klik **"Redeploy"**

## Verifikasi

Setelah redeploy, cek logs di Vercel. Seharusnya muncul:

```
🔍 Environment check:
  DB_HOST: 49.128.184.34
  DB_PORT: 3406
  DB_USER: u143_8Iv5ZNvRLS
  DB_NAME: s143_db_unturned
  NODE_ENV: production
  VERCEL: YES
📊 Database configuration:
  Host: 49.128.184.34
  Port: 3406
  User: u143_8Iv5ZNvRLS
  Database: s143_db_unturned
  Password: ✅ Set
✅ Database connected successfully
🚀 Faction Web Manager running on http://localhost:3001
```

## Catatan Penting

- ✅ **Key names HARUS UPPERCASE** (DB_HOST, bukan db_host)
- ✅ **Tidak ada spasi** di key atau value
- ✅ **Production environment wajib** di-check
- ✅ **Redeploy wajib** setelah menambahkan environment variables
- ✅ **Uncheck build cache** saat redeploy untuk memastikan build baru

## Troubleshooting

Jika masih muncul "NOT SET" di logs:
1. Pastikan key names benar (uppercase, tidak ada typo)
2. Pastikan sudah redeploy setelah menambahkan variables
3. Pastikan Production environment di-check
4. Cek di Vercel Dashboard apakah variables sudah muncul di list

