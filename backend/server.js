const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "mafia_gizli_anahtar_123";
const PORT = process.env.PORT || 5000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Auth Middleware ───────────────────────────────────────────────────────────
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

// ─── REGISTER ─────────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Eksik bilgi." });

    // Kullanıcı adı kontrolü
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase.from('players').insert({
      username,
      password: hashedPassword,
      money: 1000,
      health: 100,
      energy: 100,
      respect: 10,
      level: 1,
      xp: 0
    });

    if (error) throw error;

    res.status(201).json({ message: "Kayıt başarılı." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !player) return res.status(400).json({ error: "Kullanıcı bulunamadı." });

    const validPassword = await bcrypt.compare(password, player.password);
    if (!validPassword) return res.status(400).json({ error: "Hatalı şifre." });

    const token = jwt.sign({ id: player.id, username: player.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: player.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ME ───────────────────────────────────────────────────────────────────────
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const { data: player, error } = await supabase
      .from('players')
      .select('id, username, money, health, energy, respect, level, xp')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CRIME ────────────────────────────────────────────────────────────────────
app.post('/api/crime', authenticateToken, async (req, res) => {
  try {
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    if (player.energy < 20) return res.status(400).json({ error: "Yetersiz enerji! En az 20 enerji gerekir." });
    if (player.health <= 0) return res.status(400).json({ error: "Ölüsün! Önce hastanede tedavi ol." });

    const updates = { energy: player.energy - 20 };
    const success = Math.random() > 0.3;
    let message = "";

    if (success) {
      const rewardMoney = Math.floor(Math.random() * 300) + 100;
      updates.money = player.money + rewardMoney;
      updates.xp = player.xp + 50;
      updates.respect = player.respect + 5;
      message = `Sokak soygunu başarılı! $${rewardMoney} kazandın ve saygınlığın arttı.`;

      if (updates.xp >= player.level * 200) {
        updates.level = player.level + 1;
        updates.xp = 0;
        message += " Tebrikler, SEVİYE ATLADIN!";
      }
    } else {
      const penaltyHealth = Math.floor(Math.random() * 20) + 10;
      updates.health = Math.max(0, player.health - penaltyHealth);
      message = `Polis seni yakaladı ve hırpaladı! ${penaltyHealth} sağlık kaybettin.`;
    }

    const { data: updated, error: updateError } = await supabase
      .from('players')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, username, money, health, energy, respect, level, xp')
      .single();

    if (updateError) throw updateError;
    res.json({ player: updated, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HOSPITAL ─────────────────────────────────────────────────────────────────
app.post('/api/hospital', authenticateToken, async (req, res) => {
  try {
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    const cost = 200;
    if (player.money < cost) return res.status(400).json({ error: `Yetersiz para! Tedavi ücreti $${cost}.` });
    if (player.health >= 100) return res.status(400).json({ error: "Zaten tamamen sağlıklısın." });

    const { data: updated, error: updateError } = await supabase
      .from('players')
      .update({ money: player.money - cost, health: 100, energy: 100 })
      .eq('id', req.user.id)
      .select('id, username, money, health, energy, respect, level, xp')
      .single();

    if (updateError) throw updateError;
    res.json({ player: updated, message: "Hastanede tedavi edildin! Sağlığın ve enerjin yenilendi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PLAYERS LIST ─────────────────────────────────────────────────────────────
app.get('/api/players', authenticateToken, async (req, res) => {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('id, username, respect, level, health')
      .neq('id', req.user.id);

    if (error) throw error;
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ATTACK ───────────────────────────────────────────────────────────────────
app.post('/api/attack', authenticateToken, async (req, res) => {
  try {
    const { targetId } = req.body;

    const { data: attacker, error: err1 } = await supabase
      .from('players').select('*').eq('id', req.user.id).single();
    const { data: defender, error: err2 } = await supabase
      .from('players').select('*').eq('id', targetId).single();

    if (err1) throw err1;
    if (err2 || !defender) return res.status(404).json({ error: "Hedef oyuncu bulunamadı." });
    if (attacker.energy < 30) return res.status(400).json({ error: "Savaşmak için en az 30 enerji gerekli." });
    if (attacker.health <= 15) return res.status(400).json({ error: "Çok zayıfsın, savaşamazsın! Önce hastaneye git." });
    if (defender.health <= 0) return res.status(400).json({ error: "Bu oyuncu zaten hastanede (ölü)." });

    const attackerPower = (attacker.level * 10) + attacker.respect + (Math.random() * 50);
    const defenderPower = (defender.level * 10) + defender.respect + (Math.random() * 50);

    let attackerUpdates = { energy: attacker.energy - 30 };
    let defenderUpdates = {};
    let message = "";

    if (attackerPower > defenderPower) {
      const stolenMoney = Math.floor(defender.money * 0.2);
      attackerUpdates.money = attacker.money + stolenMoney;
      attackerUpdates.respect = attacker.respect + 15;
      attackerUpdates.xp = attacker.xp + 80;

      defenderUpdates.money = defender.money - stolenMoney;
      defenderUpdates.respect = Math.max(0, defender.respect - 10);
      defenderUpdates.health = Math.max(0, defender.health - 40);

      message = `${defender.username} adlı oyuncuya saldırdın ve KAZANDIN! $${stolenMoney} çaldın ve saygınlık kazandın.`;

      if (attackerUpdates.xp >= attacker.level * 200) {
        attackerUpdates.level = attacker.level + 1;
        attackerUpdates.xp = 0;
        message += " Seviye Atladın!";
      }
    } else {
      attackerUpdates.health = Math.max(0, attacker.health - 35);
      attackerUpdates.respect = Math.max(0, attacker.respect - 5);
      defenderUpdates.respect = defender.respect + 10;
      message = `${defender.username} seni fena benzetti! Savaşı KAYBETTİN, sağlığın ve saygınlığın düştü.`;
    }

    await supabase.from('players').update(attackerUpdates).eq('id', req.user.id);
    await supabase.from('players').update(defenderUpdates).eq('id', targetId);

    const { data: updatedAttacker } = await supabase
      .from('players')
      .select('id, username, money, health, energy, respect, level, xp')
      .eq('id', req.user.id)
      .single();

    res.json({ player: updatedAttacker, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
