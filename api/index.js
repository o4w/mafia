process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// api/index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase Bağlantı Ayarı (DATABASE_URL Vercel panelinden okunur)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase SSL bağlantısı için gereklidir
});

// Tembel Enerji Hesaplama ve Güncelleme Fonksiyonu
async function syncEnergy(client, userId) {
  const charRes = await client.query(
    'SELECT energy, max_energy, last_energy_update FROM characters WHERE user_id = $1 FOR UPDATE',
    [userId]
  );
  
  if (charRes.rows.length === 0) return null;
  const char = charRes.rows[0];

  const now = new Date();
  const lastUpdate = new Date(char.last_energy_update);
  const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);

  const intervalSeconds = 15;   // Enerji dolum aralığı (15 saniye)
  const energyPerInterval = 5;  // Her aralıkta dolacak enerji miktarı

  const intervalsPassed = Math.floor(elapsedSeconds / intervalSeconds);

  if (intervalsPassed > 0 && char.energy < char.max_energy) {
    const energyToAdd = intervalsPassed * energyPerInterval;
    const newEnergy = Math.min(char.max_energy, char.energy + energyToAdd);
    
    // Geçen sürenin arta kalan saniyelerini bir sonraki periyoda aktarma
    const nextUpdateTime = new Date(lastUpdate.getTime() + intervalsPassed * intervalSeconds * 1000);

    await client.query(
      'UPDATE characters SET energy = $1, last_energy_update = $2 WHERE user_id = $3',
      [newEnergy, nextUpdateTime, userId]
    );
  }
}

// Test amaçlı Header'dan x-user-id okuyan basit yetkilendirme ara yazılımı
const mockAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'x-user-id başlığı eksik.' });
  }
  req.userId = parseInt(userId);
  next();
};

// 1. Karakter Bilgilerini Getir
app.get('/api/character', mockAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await syncEnergy(client, req.userId); // Enerjiyi güncelle
    const result = await client.query('SELECT * FROM characters WHERE user_id = $1', [req.userId]);
    await client.query('COMMIT');
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Karakter bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 2. Aktif Suçları Listele
app.get('/api/crimes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crimes ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Suç İşleme Endpoint'i
app.post('/api/crimes/commit', mockAuth, async (req, res) => {
  const { crimeId } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // İstek işlenmeden önce güncel enerjiyi eşitle
    await syncEnergy(client, req.userId);

    const charRes = await client.query('SELECT * FROM characters WHERE user_id = $1 FOR UPDATE', [req.userId]);
    const crimeRes = await client.query('SELECT * FROM crimes WHERE id = $1', [crimeId]);

    if (charRes.rows.length === 0 || crimeRes.rows.length === 0) {
      throw new Error('Karakter veya suç bulunamadı.');
    }

    const char = charRes.rows[0];
    const crime = crimeRes.rows[0];

    if (char.energy < crime.energy_cost) {
      throw new Error('Yetersiz enerji!');
    }

    const newEnergy = char.energy - crime.energy_cost;
    const roll = Math.floor(Math.random() * 100) + 1;
    const isSuccess = roll <= crime.success_rate;

    let rewardMoney = 0;
    let rewardXp = 0;
    let status = 'failed';
    let message = `Başarısız! ${crime.name} girişiminde polisler seni neredeyse yakalıyordu.`;

    if (isSuccess) {
      rewardMoney = Math.floor(Math.random() * (crime.max_money_reward - crime.min_money_reward + 1)) + crime.min_money_reward;
      rewardXp = crime.xp_reward;
      status = 'success';
      message = `Tebrikler! "${crime.name}" suçunu tamamladın. +$${rewardMoney} kazandın.`;
    }

    const newMoney = char.money + rewardMoney;
    const newXp = char.xp + rewardXp;
    const newLevel = Math.floor(newXp / 100) + 1;

    // Karakter verilerini ve son enerji güncelleme zamanını veritabanına yaz
    await client.query(
      'UPDATE characters SET money = $1, energy = $2, xp = $3, level = $4, last_energy_update = NOW() WHERE user_id = $5',
      [newMoney, newEnergy, newXp, newLevel, req.userId]
    );

    await client.query('COMMIT');

    res.json({
      status,
      message,
      character: { money: newMoney, energy: newEnergy, xp: newXp, level: newLevel, max_energy: char.max_energy }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = app;
