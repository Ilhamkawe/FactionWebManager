# Troubleshooting FactionWebManager

## ✅ Environment Variables Sudah Benar

Jika logs menunjukkan:
```
Host: 49.128.184.34
Port: 3406
User: u143_8Iv5ZNvRLS
Database: s143_db_unturned
Password: ***
```

Berarti environment variables sudah terdeteksi dengan benar! ✅

## ❌ Error: ECONNRESET (Connection Reset)

Jika muncul error:
```
❌ Database connection failed!
Error message: write ECONNRESET
Error code: ECONNRESET
```

**Ini berarti koneksi database terputus setelah terhubung.**

### Penyebab:
1. **Database server memutuskan koneksi secara tiba-tiba**
2. **Network instability**
3. **Database server overload**
4. **Connection timeout di tengah operasi**
5. **Firewall/proxy memutuskan koneksi idle**

### Solusi:

#### 1. Cek Database Server Status
- Pastikan database server tidak overload
- Cek log database untuk error
- Pastikan `max_connections` cukup tinggi

#### 2. Cek Network Stability
- Test koneksi dari Vercel ke database server
- Pastikan tidak ada firewall yang memutuskan koneksi idle
- Cek apakah ada proxy yang mengganggu

#### 3. Cek MySQL Configuration
```sql
SHOW VARIABLES LIKE 'wait_timeout';
SHOW VARIABLES LIKE 'interactive_timeout';
SHOW VARIABLES LIKE 'max_connections';
```
- Pastikan `wait_timeout` dan `interactive_timeout` cukup tinggi (minimal 28800 detik = 8 jam)
- Pastikan `max_connections` cukup untuk semua aplikasi

#### 4. Test Connection
```bash
mysql -h 49.128.184.34 -P 3406 -u u143_8Iv5ZNvRLS -p
```

#### 5. Jika Masih Error
- Cek apakah `QuestWebManager` juga mengalami masalah yang sama
- Jika `QuestWebManager` bekerja, bandingkan konfigurasi connection pool
- Cek apakah ada perbedaan di kode yang menggunakan connection pool

---

## ❌ Error: ETIMEDOUT (Connection Timeout)

Jika muncul error:
```
❌ Database connection failed!
Error message: connect ETIMEDOUT
Error code: ETIMEDOUT
```

**Ini berarti database server tidak bisa diakses dari Vercel.**

### Penyebab:
1. **Firewall memblokir koneksi dari Vercel**
2. **Database server tidak accessible dari internet**
3. **IP Vercel tidak di-whitelist di database server**

### Solusi:

#### 1. Whitelist Vercel IP Ranges

Vercel menggunakan dynamic IP ranges. Anda perlu whitelist semua IP ranges Vercel di firewall database.

**Vercel IP Ranges:**
- `76.76.21.0/24`
- `76.223.126.0/24`
- Dan IP ranges lainnya (cek di https://vercel.com/docs/security/deployment-protection#ip-addresses)

**Atau lebih mudah:**
- Whitelist semua IP dari `0.0.0.0/0` (tidak direkomendasikan untuk production)
- Atau gunakan database yang sudah accessible dari internet

#### 2. Pastikan Database Server Accessible dari Internet

- Database server harus memiliki public IP
- Port database (3406) harus open di firewall
- Database user harus memiliki permission untuk connect dari remote host

#### 3. Cek Database Server Configuration

Pastikan di database server:
- `bind-address` di MySQL config tidak hanya `127.0.0.1` (harus `0.0.0.0` atau IP public)
- Firewall allow incoming connection ke port 3406
- User memiliki permission untuk connect dari remote host

#### 4. Test Koneksi dari Lokal

Test apakah database bisa diakses dari internet:
```bash
# Dari komputer lain (bukan server database)
mysql -h 49.128.184.34 -P 3406 -u u143_8Iv5ZNvRLS -p
```

Jika bisa connect, berarti database accessible dari internet.

## ⚠️ Pesan "config.js not found" dan "Legacy server listening"

Jika masih muncul pesan ini, berarti Vercel masih menggunakan build/cache lama.

### Solusi:
1. **Clear Build Cache:**
   - Vercel Dashboard → Settings → General
   - Scroll ke bawah → "Clear Build Cache"

2. **Force Redeploy tanpa Cache:**
   - Deployments → "..." → Redeploy
   - **Uncheck** "Use existing Build Cache"

3. **Pastikan kode sudah di-commit dan push ke git**

## ✅ Verifikasi Kode Sudah Benar

Kode yang benar di `server.js` seharusnya:
- ✅ Langsung menggunakan `process.env.DB_HOST || '49.128.184.34'`
- ✅ **TIDAK** ada `require('./config.js')`
- ✅ Ada logging `📊 Database configuration:` di awal
- ✅ **TIDAK** ada pesan "config.js not found"

Jika masih ada kode yang mencoba load config.js, berarti file belum ter-update.

## 📊 Log yang Benar Setelah Fix

Setelah semua fix, logs seharusnya:
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
📊 Database: s143_db_unturned
```

## 🔧 Quick Fix untuk ETIMEDOUT

Jika database tidak bisa diakses dari Vercel, opsi:

1. **Gunakan database yang sudah accessible dari internet**
2. **Whitelist Vercel IP ranges di firewall**
3. **Gunakan VPN/Proxy untuk database connection** (tidak direkomendasikan)
4. **Deploy di server yang sama dengan database** (jika memungkinkan)

