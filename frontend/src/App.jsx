import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('mafia_token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [gameLog, setGameLog] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (token) {
      fetchPlayerData();
    }
  }, [token]);

  const fetchPlayerData = async () => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOtherPlayers = async () => {
    try {
      const res = await fetch(`${API_URL}/players`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPlayers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setGameLog('');
    const endpoint = isRegister ? 'register' : 'login';
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');

      if (isRegister) {
        alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
        setIsRegister(false);
      } else {
        localStorage.setItem('mafia_token', data.token);
        setToken(data.token);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mafia_token');
    setToken('');
    setUser(null);
  };

  const commitCrime = async () => {
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/crime`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.player);
      setGameLog(data.message);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const visitHospital = async () => {
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/hospital`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.player);
      setGameLog(data.message);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const attackPlayer = async (targetId) => {
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/attack`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.player);
      setGameLog(data.message);
      fetchOtherPlayers();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setGameLog('');
    setErrorMsg('');
    if (tab === 'arena') {
      fetchOtherPlayers();
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 px-4">
        <div className="w-full max-w-md bg-neutral-900 border border-red-900 rounded-lg p-8 shadow-2xl">
          <h1 className="text-3xl font-extrabold text-red-600 text-center mb-6 tracking-wider">UNDERWORLD RPG</h1>
          <h2 className="text-xl text-neutral-400 text-center mb-6">{isRegister ? 'Yeni Hesap Oluştur' : 'Suç Dünyasına Giriş Yap'}</h2>
          
          {errorMsg && <div className="bg-red-950 border border-red-700 text-red-400 p-3 rounded mb-4 text-sm">{errorMsg}</div>}
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-neutral-400 mb-1">Kullanıcı Adı</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2.5 text-white focus:outline-none focus:border-red-600"
                required 
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold text-neutral-400 mb-1">Şifre</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-2.5 text-white focus:outline-none focus:border-red-600"
                required 
              />
            </div>
            <button type="submit" className="w-full bg-red-700 hover:bg-red-600 text-white font-bold p-3 rounded transition duration-200">
              {isRegister ? 'Kayıt Ol' : 'Sokaklara İn'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-neutral-400">
            {isRegister ? 'Zaten hesabın var mı?' : 'Henüz çeteye girmedin mi?'}
            <button onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }} className="text-red-500 hover:underline font-semibold ml-2">
              {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="bg-neutral-900 border-b border-red-900 p-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-red-600 tracking-wider">UNDERWORLD</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-300 font-semibold">Mafioso: <span className="text-white">{user.username}</span></span>
            <span className="bg-red-900/40 text-red-400 px-2 py-0.5 rounded text-xs font-bold border border-red-800">Lv. {user.level}</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-neutral-400">Nakit Para</span>
              <span className="text-green-500 font-bold">${user.money.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-400">Saygınlık</span>
              <span className="text-yellow-500 font-bold">{user.respect}</span>
            </div>
            <button onClick={handleLogout} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1 rounded border border-neutral-700 text-xs transition">
              Güvenli Çıkış
            </button>
          </div>
        </div>
      </header>

      <section className="bg-neutral-900/50 py-3 px-4 border-b border-neutral-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Sağlık</span>
              <span>{user.health}/100</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded overflow-hidden">
              <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${user.health}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Enerji</span>
              <span>{user.energy}/100</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${user.energy}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Tecrübe (XP)</span>
              <span>{user.xp}/{user.level * 200}</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded overflow-hidden">
              <div className="bg-yellow-600 h-full transition-all duration-300" style={{ width: `${(user.xp / (user.level * 200)) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto py-8 px-4">
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-700 text-red-400 p-4 rounded-lg mb-6 text-sm">
            <strong>Hata:</strong> {errorMsg}
          </div>
        )}

        {gameLog && (
          <div className="bg-neutral-900 border border-yellow-700/50 text-yellow-100 p-4 rounded-lg mb-6 text-sm shadow-lg">
            <strong>Eylem Raporu:</strong> {gameLog}
          </div>
        )}

        <div className="flex border-b border-neutral-800 mb-6 gap-2">
          <button 
            onClick={() => changeTab('dashboard')} 
            className={`px-4 py-2 font-semibold text-sm transition-all ${activeTab === 'dashboard' ? 'border-b-2 border-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Karargah (Özet)
          </button>
          <button 
            onClick={() => changeTab('crime')} 
            className={`px-4 py-2 font-semibold text-sm transition-all ${activeTab === 'crime' ? 'border-b-2 border-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Yasa Dışı Eylemler
          </button>
          <button 
            onClick={() => changeTab('arena')} 
            className={`px-4 py-2 font-semibold text-sm transition-all ${activeTab === 'arena' ? 'border-b-2 border-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Sokak Savaşları (PvP)
          </button>
          <button 
            onClick={() => changeTab('hospital')} 
            className={`px-4 py-2 font-semibold text-sm transition-all ${activeTab === 'hospital' ? 'border-b-2 border-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Güvenli Ev / Hastane
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          
          {activeTab === 'dashboard' && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-red-500">Çete Liderinin Masası</h3>
              <p className="text-neutral-400 leading-relaxed mb-6">
                Buradasın, kendi bölgeni korumaya ve sokaklarda adını duyurmaya çalışıyorsun. Seviyeni yükseltmek için suç işle, diğer oyunculara meydan oku ve suç imparatorluğunu kur.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded border border-neutral-800">
                  <h4 className="text-neutral-400 text-xs uppercase font-bold mb-2">Çete Statüsü</h4>
                  <ul className="space-y-2 text-sm">
                    <li>Seviye: <strong className="text-white">{user.level}</strong></li>
                    <li>Sıralama Saygınlığı: <strong className="text-white">{user.respect}</strong></li>
                    <li>Toplam Kaynak: <strong className="text-green-500">${user.money}</strong></li>
                  </ul>
                </div>
                <div className="bg-neutral-950 p-4 rounded border border-neutral-800">
                  <h4 className="text-neutral-400 text-xs uppercase font-bold mb-2">Tavsiyeler</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Enerjin bittiğinde hastaneye giderek küçük bir ücret karşılığında sağlığını ve enerjini tamamen yenileyebilirsin. Sokaklardaki rakiplerine saldırmak yüksek risk ve yüksek kazanç sağlar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crime' && (
            <div>
              <h3 className="text-xl font-bold mb-2 text-red-500">Yasa Dışı Eylemler</h3>
              <p className="text-sm text-neutral-400 mb-6">Sokaklardan haraç topla, dükkanları soy veya banka kasalarına göz dik. Her eylem enerji harcar.</p>
              
              <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Sokak Soygunu</h4>
                  <p className="text-xs text-neutral-400 mt-1">Maliyet: <span className="text-blue-400 font-semibold">20 Enerji</span> | Kazanç: <span className="text-green-500 font-semibold">$100 - $400</span>, XP ve Saygınlık.</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Başarı Şansı: %70</p>
                </div>
                <button 
                  onClick={commitCrime} 
                  disabled={user.energy < 20}
                  className={`px-6 py-3 rounded font-bold text-sm tracking-wide uppercase transition ${user.energy >= 20 ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`}
                >
                  Suç İşle
                </button>
              </div>
            </div>
          )}

          {activeTab === 'arena' && (
            <div>
              <h3 className="text-xl font-bold mb-2 text-red-500">Çete Arenası (Sokaklar)</h3>
              <p className="text-sm text-neutral-400 mb-6">Diğer çetelerin bölgelerine saldırarak paralarını çal ve saygınlıklarını kendi hanene yazdır.</p>

              <div className="space-y-4">
                {players.length === 0 ? (
                  <p className="text-neutral-500 text-sm">Sokakta şu an hedef alabileceğin başka bir çete yok.</p>
                ) : (
                  players.map((p) => (
                    <div key={p._id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white text-md">{p.username}</h4>
                        <div className="flex gap-4 mt-1 text-xs text-neutral-400">
                          <span>Seviye: <strong className="text-white">{p.level}</strong></span>
                          <span>Saygınlık: <strong className="text-yellow-500">{p.respect}</strong></span>
                          <span>Sağlık: <strong className={`${p.health <= 0 ? 'text-red-500' : 'text-green-500'}`}>{p.health}/100</strong></span>
                        </div>
                      </div>
                      <button 
                        onClick={() => attackPlayer(p._id)}
                        disabled={user.energy < 30 || p.health <= 0}
                        className={`px-4 py-2 rounded text-xs font-bold uppercase transition ${user.energy >= 30 && p.health > 0 ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`}
                      >
                        {p.health <= 0 ? 'Hastanede' : 'Saldır (-30 Enj)'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'hospital' && (
            <div className="text-center max-w-md mx-auto py-6">
              <h3 className="text-2xl font-black text-red-500 mb-2">Güvenli Ev & Hastane</h3>
              <p className="text-sm text-neutral-400 mb-6">Yaralarını sarmak ve enerjini tamamen toplamak için burada dinlenebilirsin.</p>
              
              <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-lg mb-6">
                <span className="block text-xs uppercase text-neutral-500 font-bold mb-1">Muayene Ücreti</span>
                <span className="text-3xl font-bold text-green-500">$200</span>
                <p className="text-xs text-neutral-400 mt-2">Sağlığını ve enerjini %100 oranında tazeler.</p>
              </div>

              <button 
                onClick={visitHospital}
                disabled={user.money < 200 || (user.health >= 100 && user.energy >= 100)}
                className={`w-full py-3 rounded font-bold transition uppercase text-sm ${user.money >= 200 && (user.health < 100 || user.energy < 100) ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`}
              >
                Tedavi Ol
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}