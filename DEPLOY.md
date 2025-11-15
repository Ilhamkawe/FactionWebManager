# Deploy ke Vercel - Troubleshooting

## Masalah: Masih muncul error "config.js not found" dan "Legacy server listening"

Jika masih muncul error tersebut setelah redeploy, kemungkinan Vercel masih menggunakan cache/build lama.

### Solusi:

1. **Clear Vercel Cache:**
   - Buka Vercel Dashboard → Project → Settings → General
   - Scroll ke bawah, klik "Clear Build Cache"
   - Atau hapus deployment lama dan deploy ulang

2. **Force Redeploy:**
   - Buka Vercel Dashboard → Deployments
   - Klik "..." pada deployment terbaru
   - Pilih "Redeploy" dengan opsi "Use existing Build Cache" = **UNCHECKED**

3. **Pastikan Environment Variables sudah di-set:**
   - Settings → Environment Variables
   - Pastikan semua variables sudah ada:
     - `DB_HOST=49.128.184.34`
     - `DB_PORT=3406`
     - `DB_USER=u143_8Iv5ZNvRLS`
     - `DB_PASSWORD=uh14Qyd.I.pP@Frog^yLy7kR`
     - `DB_NAME=s143_db_unturned`

4. **Cek Logs setelah Redeploy:**
   Setelah redeploy, cek logs. Seharusnya muncul:
   ```
   🔍 Environment check:
     DB_HOST: 49.128.184.34 (atau NOT SET jika env var tidak ada)
     ...
   📊 Database configuration:
     Host: 49.128.184.34
     Port: 3406
     ...
   ```

5. **Jika masih error:**
   - Pastikan file `server.js` sudah di-commit dan push ke git
   - Pastikan tidak ada file `config.js` yang di-commit (cek `.gitignore`)
   - Coba delete project di Vercel dan import ulang dari git

## Verifikasi Kode Sudah Benar

Kode yang benar di `server.js` seharusnya:
- **TIDAK** ada `require('./config.js')`
- **TIDAK** ada try-catch untuk load config.js
- Langsung menggunakan `process.env.DB_HOST || '49.128.184.34'`
- Ada logging `📊 Database configuration:` di awal

Jika masih ada kode yang mencoba load config.js, berarti file belum ter-update dengan benar.

