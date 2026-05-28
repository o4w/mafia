require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "varsayilan_gecici_anahtar";

// Supabase Bağlantısı
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("HATA: Supabase bağlantı değişkenleri eksik!");
  process.exit(1);
}

// Service Role Key ile bağlandığımız için RLS engeline takılmayız
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Erişim engellendi." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Geçersiz token." });
    req.user = user;
    next();
  });
};

// 1. KAYIT OLMA (Register)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Eksik bilgi." });

    // Kullanıcı var mı kontrol et
    const { data: existing } = await supabase.from('players').select('username').eq('username', username).maybeSingle();
    if (existing) return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Yeni oyuncu ekle
    const { error } = await supabase.from('players').insert([{ username, password: hashedPassword }]);
    if (error) throw error;

    res.status(201).json({ message: "Kayıt başarılı." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GİRİŞ YAPMA (Login)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { data: player, error } = await supabase.from('players').select('*').eq('username', username).maybeSingle();
    
    if (error || !player) return res.status(400).json({ error: "Kullanıcı bulunamadı." });

    const validPassword = await bcrypt.compare(password, player.password);
    if (!validPassword) return res.status(400).json({ error: "Hatalı şifre." });

    const token = jwt.sign({ id: player.id, username: player.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: player.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. OYUNCU BİLGİLERİNİ AL (Profile)
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const { data: player, error } = await supabase.from('players').select('id, username, money, health, energy, respect, level, xp').eq('id', req.user.id).single();
    if (error) throw error;
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. SUÇ İŞLEME (Crime)
app.post('/api/crime', authenticateToken, async (req, res) => {
  try {
    const { data: player } = await supabase.from('players').select('*').eq('id', req.user.id).single();
    if (player.energy < 20) return res.status(400).json({ error: "Yetersiz enerji! En az 20 enerji gerekir." });
    if (player.health <= 0) return res.status(400).json({ error: "Ölüsün! Önce hastanede tedavi ol." });

    let updatedEnergy = player.energy - 20;
    let updatedMoney = player.money;
    let updatedXp = player.xp;
    let updatedRespect = player.respect;
    let updatedLevel = player.level;
    let updatedHealth = player.health;
    
    const success = Math.random() > 0.3;
    let message = "";

    if (success) {
      const rewardMoney = Math.floor(Math.random() * 300) + 100;
      updatedMoney += rewardMoney;
      updatedXp += 50;
      updatedRespect += 5;
      message = `Sokak soygunu başarılı! $${rewardMoney} kazandın ve saygınlığın arttı.`;

      if (updatedXp >= updatedLevel * 200) {
        updatedLevel += 1;
        updatedXp = 0;
        message += " Tebrikler, SEVİYE ATLADIN!";
      }
    } else {
      const penaltyHealth = Math.floor(Math.random() * 20) + 10;
      updatedHealth = Math.max(0, player.health - penaltyHealth);
      message = `Polis seni yakaladı ve hırpaladı! ${penaltyHealth} sağlık kaybettin.`;
    }

    // Supabase Güncelleme Sorgusu
    const { data: updatedPlayer, error } = await supabase.from('players').update({
      energy: updatedEnergy,
      money: updatedMoney,
      xp: updatedXp,
      respect: updatedRespect,
      level: updatedLevel,
      health: updatedHealth
    }).eq('id', player.id).select().single();

    if (error) throw error;
    res.json({ player: updatedPlayer, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Hospital ve Attack servisleri de benzer şekilde mongoose modelleri yerine supabase.from('players').update().eq() yapısına geçirilir.)

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
