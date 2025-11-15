# Faction Web Manager

Web interface untuk mengelola FactionSystem menggunakan Express.js dan Tailwind CSS dengan tema minimalist.

## Fitur

- **Faction Management**: CRUD operations untuk factions
- **Leaderboard**: Menampilkan ranking factions berdasarkan points
- **Statistics**: Total factions, players, XP donated, dan tier distribution
- **Real-time Updates**: Auto-reload data saat melakukan perubahan

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Copy `config.example.js` ke `config.js` dan update database credentials:
```bash
cp config.example.js config.js
```

3. Edit `config.js` dengan database credentials Anda:
```javascript
module.exports = {
    database: {
        host: 'your_host',
        port: 3306,
        user: 'your_user',
        password: 'your_password',
        database: 'your_database'
    }
};
```

**Atau** gunakan environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=password
export DB_NAME=db_unturned
```

4. Start server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

5. Buka browser dan akses: `http://localhost:3001`

## Debugging

Jika data tidak muncul, cek:

1. **Database Connection**: Akses `http://localhost:3001/api/health` untuk test koneksi
2. **Database Schema**: Akses `http://localhost:3001/api/debug/schema` untuk melihat schema database
3. **Console Logs**: Cek console server untuk error messages
4. **Browser Console**: Buka browser console (F12) untuk melihat error di frontend

## API Endpoints

### Factions
- `GET /api/factions` - Get all factions
- `GET /api/factions/:id` - Get faction by ID
- `POST /api/factions` - Create new faction
- `PUT /api/factions/:id` - Update faction
- `DELETE /api/factions/:id` - Delete faction
- `GET /api/factions/:id/members` - Get faction members

### Leaderboard
- `GET /api/leaderboard?limit=10&offset=0` - Get leaderboard

### Statistics
- `GET /api/stats` - Get statistics

### Debug
- `GET /api/health` - Health check
- `GET /api/debug/schema` - Check database schema

## Database Schema

Pastikan database memiliki tabel berikut (dari FactionSystem plugin):
- `factions` - Faction data
  - Columns: `Id`, `Name`, `Tag`, `Color` (atau `ChatColor`), `OwnerId`, `TotalPoints`, `Tier`, `CreatedAt`, `UpdatedAt`
  - Optional: `Prefix`, `Suffix`, `ChatColor` (jika sudah di-migrate)
- `player_factions` - Player-faction relationships
  - Columns: `PlayerId`, `FactionId`
  - Optional: `IsLeader`
- `player_stats` - Player statistics (XPDonated)
  - Columns: `PlayerId`, `XPDonated`

## Troubleshooting

### Data tidak muncul

1. **Cek koneksi database**: Pastikan `config.js` benar dan database accessible
2. **Cek tabel ada**: Gunakan endpoint `/api/debug/schema` untuk cek tabel
3. **Cek kolom**: Web manager akan otomatis detect kolom yang ada (menggunakan `Color` jika `ChatColor` tidak ada)
4. **Cek console**: Lihat error di server console dan browser console

### Error "Table does not exist"

- Pastikan FactionSystem plugin sudah dikonfigurasi dengan database
- Pastikan plugin sudah di-load dan membuat tabel
- Cek database credentials di `config.js`

### Error "Column does not exist"

- Web manager otomatis detect kolom yang ada
- Jika kolom `Prefix`, `Suffix`, atau `ChatColor` tidak ada, akan menggunakan default values
- Kolom `Color` akan di-map ke `ChatColor` secara otomatis

## Konfigurasi

### Environment Variables (Optional)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `PORT` - Server port (default: 3001)

## Struktur File

```
FactionWebManager/
├── server.js          # Express.js backend
├── package.json       # Dependencies
├── config.example.js  # Example configuration
├── config.js          # Your configuration (not in git)
├── README.md          # This file
└── public/
    ├── index.html     # Frontend HTML
    └── app.js         # Frontend JavaScript
```

## Teknologi

- **Backend**: Express.js
- **Frontend**: Vanilla JavaScript
- **Styling**: Tailwind CSS (via CDN)
- **Database**: MySQL2

## Lisensi

ISC
