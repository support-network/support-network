const { useState, useEffect } = React;

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: 'Загрузка...', role: 'user', balance: 0 });
  const [view, setView] = useState('home');
  const [news, setNews] = useState([]);
  const [items, setItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const icons = window.lucide ? window.lucide : { 
    Home: () => '🏠', ShoppingBag: () => '🛒', ShieldCheck: () => '🛡️', Settings: () => '⚙️', LogOut: () => '🚪', Heart: () => '❤️'
  };

  useEffect(() => {
    const unsub = window.auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        const userRef = window.db.collection('artifacts').doc(window.appId).collection('users').doc(u.uid).collection('profile').doc('info');
        userRef.onSnapshot((snap) => {
          if (snap.exists) setProfile(snap.data());
          else {
            const initial = { uid: u.uid, name: `User_${u.uid.slice(0,4)}`, role: 'user', balance: 500, photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}` };
            userRef.set(initial);
            window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('users_list').doc(u.uid).set(initial);
          }
          setLoading(false);
        });
      } else {
        window.auth.signInAnonymously().catch(() => setLoading(false));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Загрузка новостей
    window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('news').orderBy('createdAt', 'desc')
      .onSnapshot(s => setNews(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    // Загрузка магазина
    window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('shop')
      .onSnapshot(s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    // Список юзеров для админки
    window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('users_list')
      .onSnapshot(s => setAllUsers(s.docs.map(d => d.data())));
  }, [user]);

  const toggleLike = async (newsId, currentLikes = []) => {
    const newLikes = currentLikes.includes(user.uid) ? currentLikes.filter(id => id !== user.uid) : [...currentLikes, user.uid];
    await window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('news').doc(newsId).update({ likes: newLikes });
  };

  if (loading) return React.createElement('div', { className: "h-screen bg-slate-950 flex flex-col items-center justify-center" }, 
    React.createElement('div', { className: "text-blue-500 font-black text-4xl animate-pulse italic tracking-tighter" }, "SUPPORT.NET"),
    React.createElement('div', { className: "text-slate-600 text-[10px] uppercase mt-4 tracking-[0.5em]" }, "Initializing Secure Connection")
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <nav className="w-72 bg-slate-900 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-10 text-blue-500 font-black text-3xl italic tracking-tighter uppercase underline decoration-blue-500/30">Support.Net</div>
        <div className="flex-1 px-6 space-y-3">
          <window.NavBtn active={view === 'home'} onClick={() => setView('home')} icon={React.createElement(icons.Home, {size: 20})} label="Лента" />
          <window.NavBtn active={view === 'shop'} onClick={() => setView('shop')} icon={React.createElement(icons.ShoppingBag, {size: 20})} label="Магазин" />
          {profile.role === 'admin' && (
            <window.NavBtn active={view === 'admin'} onClick={() => setView('admin')} icon={React.createElement(icons.ShieldCheck, {size: 20})} label="Панель управления" />
          )}
          <window.NavBtn active={view === 'profile'} onClick={() => setView('profile')} icon={React.createElement(icons.Settings, {size: 20})} label="Настройки" />
        </div>
        <div className="p-8 border-t border-white/5 bg-slate-900/50">
           <div className="flex items-center gap-4 mb-4">
              <img src={profile.photoURL} className="w-12 h-12 rounded-2xl shadow-xl border border-white/10" />
              <div className="flex-1 overflow-hidden">
                 <p className="font-black text-sm truncate">{profile.name}</p>
                 <window.RoleBadge role={profile.role} />
              </div>
           </div>
           <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
              <span>Balance: <span className="text-emerald-400">{profile.balance} P</span></span>
              <button onClick={() => window.auth.signOut()} className="hover:text-red-500 transition-colors italic">Logout</button>
           </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-16 custom-scroll">
        <div className="max-w-4xl mx-auto">
          {view === 'home' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Лента новостей</h2>
              {news.map(n => (
                <window.GlassCard key={n.id}>
                  <p className="text-slate-300 leading-relaxed text-xl mb-8 font-medium">{n.text}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[10px] uppercase font-black text-slate-600 italic tracking-widest">Post by {n.author}</span>
                    <button onClick={() => toggleLike(n.id, n.likes)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${n.likes?.includes(user?.uid) ? 'bg-red-500/20 text-red-500 shadow-lg shadow-red-500/10' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                      <icons.Heart size={16} fill={n.likes?.includes(user?.uid) ? "currentColor" : "none"} />
                      <span className="font-black text-xs">{n.likes?.length || 0}</span>
                    </button>
                  </div>
                </window.GlassCard>
              ))}
            </div>
          )}

          {view === 'shop' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Магазин</h2>
              <div className="grid grid-cols-2 gap-8">
                {items.length > 0 ? items.map(item => (
                  <window.GlassCard key={item.id} className="group">
                    <div className="h-48 bg-slate-800/50 rounded-3xl mb-6 overflow-hidden relative border border-white/5">
                      {item.img && React.createElement('img', { src: item.img, className: "w-full h-full object-cover transition-transform group-hover:scale-110" })}
                      <div className="absolute top-4 right-4 bg-blue-600 px-4 py-1 rounded-full font-black text-xs shadow-lg">{item.price} P</div>
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{item.description}</p>
                    <button className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl">Купить сейчас</button>
                  </window.GlassCard>
                )) : React.createElement('div', { className: "col-span-2 text-center text-slate-700 font-black py-20 italic uppercase tracking-[1em]" }, "Inventory Empty")}
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
              <window.GlassCard className="text-center">
                <img src={profile.photoURL} className="w-32 h-32 rounded-[2.5rem] mx-auto mb-8 border-4 border-slate-950 shadow-2xl" />
                <h3 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">{profile.name}</h3>
                <window.RoleBadge role={profile.role} />
                <div className="mt-12 space-y-6 text-left">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block italic tracking-widest">Nickname</label>
                    <input 
                      className="w-full bg-slate-950/50 p-5 rounded-2xl border border-white/5 outline-none focus:border-blue-500/50 text-white font-bold transition-all" 
                      value={profile.name}
                      onChange={e => {
                        const n = e.target.value;
                        setProfile(p => ({ ...p, name: n }));
                        window.db.collection('artifacts').doc(window.appId).collection('users').doc(user.uid).collection('profile').doc('info').update({ name: n });
                      }}
                    />
                  </div>
                </div>
              </window.GlassCard>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
