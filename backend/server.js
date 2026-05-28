const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = "mafia_gizli_anahtar_123";
const PORT = 5000;

mongoose.connect('mongodb://127.0.0.1:27017/mafiardg')
  .then(() => console.log("MongoDB bağlantısı başarılı."))
  .catch(err => console.error("MongoDB bağlantı hatası:", err));

const PlayerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  money: { type: Number, default: 1000 },
  health: { type: Number, default: 100 },
  energy: { type: Number, default: 100 },
  respect: { type: Number, default: 10 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 }
});

const Player = mongoose.model('Player', PlayerSchema);

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

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Eksik bilgi." });

    const existing = await Player.findOne({ username });
    if (existing) return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPlayer = new Player({ username, password: hashedPassword });
    await newPlayer.save();

    res.status(201).json({ message: "Kayıt başarılı." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const player = await Player.findOne({ username });
    if (!player) return res.status(400).json({ error: "Kullanıcı bulunamadı." });

    const validPassword = await bcrypt.compare(password, player.password);
    if (!validPassword) return res.status(400).json({ error: "Hatalı şifre." });

    const token = jwt.sign({ id: player._id, username: player.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: player.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.user.id).select('-password');
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crime', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.user.id);
    if (player.energy < 20) return res.status(400).json({ error: "Yetersiz enerji! En az 20 enerji gerekir." });
    if (player.health <= 0) return res.status(400).json({ error: "Ölüsün! Önce hastanede tedavi ol." });

    player.energy -= 20;
    
    const success = Math.random() > 0.3;
    let rewardMoney = 0;
    let rewardXp = 0;
    let message = "";

    if (success) {
      rewardMoney = Math.floor(Math.random() * 300) + 100;
      rewardXp = 50;
      player.money += rewardMoney;
      player.xp += rewardXp;
      player.respect += 5;
      message = `Sokak soygunu başarılı! $${rewardMoney} kazandın ve saygınlığın arttı.`;

      if (player.xp >= player.level * 200) {
        player.level += 1;
        player.xp = 0;
        message += " Tebrikler, SEVİYE ATLADIN!";
      }
    } else {
      const penaltyHealth = Math.floor(Math.random() * 20) + 10;
      player.health = Math.max(0, player.health - penaltyHealth);
      message = `Polis seni yakaladı ve hırpaladı! ${penaltyHealth} sağlık kaybettin.`;
    }

    await player.save();
    res.json({ player, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hospital', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.user.id);
    const cost = 200;
    if (player.money < cost) return res.status(400).json({ error: `Yetersiz para! Tedavi ücreti $${cost}.` });
    if (player.health >= 100) return res.status(400).json({ error: "Zaten tamamen sağlıklısın." });

    player.money -= cost;
    player.health = 100;
    player.energy = 100;

    await player.save();
    res.json({ player, message: "Hastanede tedavi edildin! Sağlığın ve enerjin yenilendi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/players', authenticateToken, async (req, res) => {
  try {
    const players = await Player.find({ _id: { $ne: req.user.id } }).select('username respect level health');
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attack', authenticateToken, async (req, res) => {
  try {
    const attacker = await Player.findById(req.user.id);
    const { targetId } = req.body;

    if (attacker.energy < 30) return res.status(400).json({ error: "Savaşmak için en az 30 enerji gerekli." });
    if (attacker.health <= 15) return res.status(400).json({ error: "Çok zayıfsın, savaşamazsın! Önce hastaneye git." });

    const defender = await Player.findById(targetId);
    if (!defender) return res.status(404).json({ error: "Hedef oyuncu bulunamadı." });
    if (defender.health <= 0) return res.status(400).json({ error: "Bu oyuncu zaten hastanede (ölü)." });

    attacker.energy -= 30;

    const attackerPower = (attacker.level * 10) + attacker.respect + (Math.random() * 50);
    const defenderPower = (defender.level * 10) + defender.respect + (Math.random() * 50);

    let message = "";
    if (attackerPower > defenderPower) {
      const stolenMoney = Math.floor(defender.money * 0.2);
      attacker.money += stolenMoney;
      attacker.respect += 15;
      attacker.xp += 80;

      defender.money -= stolenMoney;
      defender.respect = Math.max(0, defender.respect - 10);
      defender.health = Math.max(0, defender.health - 40);

      message = `${defender.username} adlı oyuncuya saldırdın ve KAZANDIN! $${stolenMoney} çaldın ve saygınlık kazandın.`;

      if (attacker.xp >= attacker.level * 200) {
        attacker.level += 1;
        attacker.xp = 0;
        message += " Seviye Atladın!";
      }
    } else {
      attacker.health = Math.max(0, attacker.health - 35);
      attacker.respect = Math.max(0, attacker.respect - 5);
      defender.respect += 10;
      message = `${defender.username} seni fena benzetti! Savaşı KAYBETTİN, sağlığın ve saygınlığın düştü.`;
    }

    await attacker.save();
    await defender.save();

    res.json({ player: attacker, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));