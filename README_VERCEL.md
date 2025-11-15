# Deploy FactionWebManager ke Vercel

## Setup Environment Variables di Vercel

Setelah deploy ke Vercel, pastikan untuk menambahkan environment variables berikut di Vercel Dashboard:

1. Buka project di Vercel Dashboard
2. Pergi ke **Settings** → **Environment Variables**
3. Tambahkan variables berikut:

```
DB_HOST=your-database-host.com
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
```

## Catatan Penting

- **JANGAN commit file `config.js`** ke git (sudah ada di .gitignore)
- Environment variables akan **override** config.js jika ada
- Di production (Vercel), aplikasi akan **prioritas menggunakan environment variables**
- Pastikan database host **accessible dari internet** (bukan localhost)

## Testing

Setelah deploy, cek:
1. Health check: `https://your-app.vercel.app/api/health`
2. Debug schema: `https://your-app.vercel.app/api/debug/schema`

Jika masih hit localhost, pastikan:
- Environment variables sudah di-set di Vercel
- Redeploy setelah menambahkan environment variables
- Cek logs di Vercel untuk melihat database config yang digunakan

