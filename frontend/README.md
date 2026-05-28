# TekMafya Frontend

React + Vite ile yazılmış mafya oyunu arayüzü.

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
cp .env.example .env
# .env dosyasına backend URL'ini yaz
npm run dev
```

## Deploy (Vercel)

1. Bu klasörü GitHub'a push et
2. vercel.com → New Project → repo'yu seç
3. **Environment Variables** bölümüne ekle:
   - `VITE_API_URL` = `https://tekmafya-backend.up.railway.app`
4. Deploy!

## Deploy (Railway)

1. Railway'de **+ New → GitHub Repo** → bu repoyu seç
2. **Settings → Build Command:** `npm run build`
3. **Settings → Start Command:** `npx serve dist`
4. Variable ekle: `VITE_API_URL=https://...`

## Sayfalar

- **Profil** — Oyuncu stats, XP, enerji
- **Binalar** — Gelir toplama, inşaat, yükseltme
- **Görevler** — Görev yapma, enerji yönetimi
- **Savaş** — Hedef seçme, saldırı, savaş geçmişi
- **Sıralama** — Level/para/güç bazlı top 100
