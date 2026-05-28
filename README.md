# TekMafya Backend

Django + PostgreSQL + Celery ile yazılmış tam mafya oyunu backend'i.

## Gereksinimler

- Python 3.11+
- PostgreSQL 14+
- Redis 6+

## Kurulum

### 1. Repo'yu klonla ve sanal ortam oluştur

```bash
cd tekmafya
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows
```

### 2. Paketleri yükle

```bash
pip install -r requirements.txt
```

### 3. .env dosyasını oluştur

```bash
cp .env.example .env
# .env dosyasını düzenle (DB şifresi, secret key vb.)
```

### 4. PostgreSQL veritabanı oluştur

```bash
psql -U postgres
CREATE DATABASE tekmafya;
\q
```

### 5. Migration'ları çalıştır

```bash
python manage.py migrate
```

### 6. Başlangıç verilerini yükle (bina tipleri, görevler)

```bash
python manage.py seed_data
```

### 7. Admin kullanıcısı oluştur

```bash
python manage.py createsuperuser
```

### 8. Sunucuyu başlat

```bash
python manage.py runserver
```

### 9. Celery worker'ı başlat (ayrı terminalde)

```bash
celery -A tekmafya worker --loglevel=info
```

### 10. Celery beat'i başlat (periyodik görevler için, ayrı terminalde)

```bash
celery -A tekmafya beat --loglevel=info
```

---

## API Endpoint'leri

### Auth
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/auth/register/` | Kayıt ol |
| POST | `/api/auth/login/` | Giriş (JWT token al) |
| POST | `/api/auth/refresh/` | Token yenile |
| POST | `/api/auth/logout/` | Çıkış |

### Oyuncu
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/player/` | Oyuncu bilgileri |

### Binalar
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/venues/` | Binalarım |
| POST | `/api/venues/build/` | Yeni bina inşa et |
| POST | `/api/venues/{id}/collect/` | Gelir topla |
| POST | `/api/venues/{id}/upgrade/` | Bina yükselt |
| GET | `/api/venues/available/` | İnşa edilebilir binalar |

### Görevler
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/quests/` | Görev listesi |
| POST | `/api/quests/{id}/do/` | Görevi yap |

### Savaş
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/battle/targets/` | Saldırılabilecek oyuncular |
| POST | `/api/battle/attack/{defender_id}/` | Saldır |
| GET | `/api/battle/history/` | Savaş geçmişi |

### Sıralama
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/leaderboard/?sort=level` | Sıralama (level/money/power) |

---

## Örnek İstekler

### Kayıt ol
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456","password2":"123456"}'
```

### Giriş yap
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

### Bina listesi (token gerekli)
```bash
curl http://localhost:8000/api/venues/ \
  -H "Authorization: Bearer <access_token>"
```

### Görev yap
```bash
curl -X POST http://localhost:8000/api/quests/1/do/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Proje Yapısı

```
tekmafya/
├── tekmafya/
│   ├── settings.py       # Tüm ayarlar
│   ├── urls.py           # Ana URL yönlendirme
│   ├── celery.py         # Celery konfigürasyonu
│   └── wsgi.py
├── game/
│   ├── models.py         # Player, Venue, Quest, BattleLog
│   ├── serializers.py    # API serializer'ları
│   ├── admin.py          # Django admin
│   ├── tasks.py          # Celery periyodik görevler
│   ├── urls/
│   │   ├── auth.py       # Kayıt/giriş
│   │   ├── player.py     # Oyuncu bilgisi
│   │   ├── venues.py     # Bina sistemi
│   │   ├── quests.py     # Görev sistemi
│   │   ├── battle.py     # Savaş sistemi
│   │   └── leaderboard.py
│   └── management/
│       └── commands/
│           └── seed_data.py   # Başlangıç verisi
├── requirements.txt
└── .env.example
```
