# Setup Environment Variables (.env)

## File .env untuk Local Development

Buat file `.env` di folder `FactionWebManager` dengan isi berikut:

```env
DB_HOST=49.128.184.34
DB_PORT=3406
DB_USER=u143_8Iv5ZNvRLS
DB_PASSWORD=uh14Qyd.I.pP@Frog^yLy7kR
DB_NAME=s143_db_unturned
# PORT tidak perlu di-set - Vercel akan set otomatis
# PORT=3001  # Hanya untuk local development (opsional)
```

## Cara Membuat File .env

### Windows (PowerShell):
```powershell
cd FactionWebManager
@"
DB_HOST=49.128.184.34
DB_PORT=3406
DB_USER=u143_8Iv5ZNvRLS
DB_PASSWORD=uh14Qyd.I.pP@Frog^yLy7kR
DB_NAME=s143_db_unturned
PORT=3001
"@ | Out-File -FilePath .env -Encoding utf8
```

### Windows (CMD):
```cmd
cd FactionWebManager
echo DB_HOST=49.128.184.34 > .env
echo DB_PORT=3406 >> .env
echo DB_USER=u143_8Iv5ZNvRLS >> .env
echo DB_PASSWORD=uh14Qyd.I.pP@Frog^yLy7kR >> .env
echo DB_NAME=s143_db_unturned >> .env
echo PORT=3001 >> .env
```

### Linux/Mac:
```bash
cd FactionWebManager
cat > .env << EOF
DB_HOST=49.128.184.34
DB_PORT=3406
DB_USER=u143_8Iv5ZNvRLS
DB_PASSWORD=uh14Qyd.I.pP@Frog^yLy7kR
DB_NAME=s143_db_unturned
PORT=3001
EOF
```

## Catatan

- File `.env` sudah ada di `.gitignore`, jadi tidak akan di-commit ke git
- Untuk Vercel, set environment variables di Vercel Dashboard (tidak perlu file .env)
- File `.env` hanya untuk local development

