const { useState, useEffect } = React;

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: 'Загрузка...', role: 'user' });
  const [view, setView] = useState('home');
  const [news, setNews] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [loading, setLoading] = useState(true);

  // Иконки (безопасное получение)
  const icons = window.lucide ? window.lucide : { 
    Home: () => '🏠', ShieldCheck: () => '🛡️', Settings: () => '⚙️', LogOut: () => '🚪' 
  };

  useEffect(() => {
    const unsub = window.auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        const userRef = window.db.collection('artifacts').doc(window.appId).collection('users').doc(u.uid).collection('profile').doc('info');
        userRef.onSnapshot((snap) => {
          if (snap.exists) setProfile(snap.data());
          else {
            const initial = { uid: u.uid, name: `User_${u.uid.slice(0,4)}`, role: 'user', photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}` };
            userRef.set(initial);
            window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('users_list').doc(u.uid).set(initial);
          }
        });
      } else {
        window.auth.signInAnonymously();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qNews = window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('news').orderBy('createdAt', 'desc');
    qNews.onSnapshot(s => setNews(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('users_list').onSnapshot(s => setAllUsers(s.docs.map(d => d.data())));
  }, [user]);

  const changeUserRole = async (targetUid, newRole) => {
    if (profile.role !== 'admin') return;
    await window.db.collection('artifacts').doc(window.appId).collection('users').doc(targetUid).collection('profile').doc('info').update({ role: newRole });
    await window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('users_list').doc(targetUid).update({ role: newRole });
  };

  if (loading) return React.createElement('div', { className: "h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black animate-pulse" }, "SUPPORT.NET LOADING...");

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <nav className="w-64 bg-slate-900 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-8 text-blue-500 font-black text-2xl italic tracking-tighter uppercase">Support.Net</div>
        <div className="flex-1 px-4 space-y-2">
          <window.NavBtn active={view === 'home'} onClick={() => setView('home')} icon={React.createElement(icons.Home, {size: 20})} label="Лента" />
          {profile.role === 'admin' && (
            <window.NavBtn active={view === 'admin'} onClick={() => setView('admin')} icon={React.createElement(icons.ShieldCheck, {size: 20})} label="Админка" />
          )}
          <window.NavBtn active={view === 'profile'} onClick={() => setView('profile')} icon={React.createElement(icons.Settings, {size: 20})} label="Профиль" />
        </div>
        <div className="p-6 border-t border-white/5 flex items-center gap-4">
           <img src={profile.photoURL} className="w-10 h-10 rounded-xl" />
           <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-bold truncate">{profile.name}</p>
              <window.RoleBadge role={profile.role} />
           </div>
           <button onClick={() => window.auth.signOut()} className="text-slate-500 hover:text-red-500"><icons.LogOut size={16}/></button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-12">
        <div className="max-w-3xl mx-auto">
          {view === 'home' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-10">Новости</h2>
              {profile.role === 'admin' && (
                <div className="bg-slate-900/80 p-6 rounded-[2rem] border border-blue-500/20">
                  <textarea className="w-full bg-transparent border-none outline-none text-sm min-h-[80px] resize-none text-white" placeholder="Что нового?" value={newPostText} onChange={e => setNewPostText(e.target.value)} />
                  <button onClick={async () => {
                    if(!newPostText.trim()) return;
                    await window.db.collection('artifacts').doc(window.appId).collection('public').doc('data').collection('news').add({ 
                      text: newPostText, author: profile.name, createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    setNewPostText('');
                  }} className="bg-blue-600 px-6 py-2 rounded-xl font-black text-[10px] mt-4 uppercase">Опубликовать</button>
                </div>
              )}
              {news.map(n => (
                <article key={n.id} className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 mb-4">
                  <p className="text-slate-300 leading-relaxed text-lg mb-6">{n.text}</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] uppercase font-black text-slate-600 italic">Автор: {n.author}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {view === 'admin' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-black italic uppercase text-red-500 mb-10">Админка</h2>
              {allUsers.map(u => (
                <div key={u.uid} className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img src={u.photoURL} className="w-12 h-12 rounded-xl" />
                    <div>
                      <p className="font-bold text-sm mb-1">{u.name}</p>
                      <window.RoleBadge role={u.role} />
                    </div>
                  </div>
                  <select 
                    className="bg-slate-950 text-[10px] font-black uppercase p-3 rounded-xl border border-white/10 outline-none text-white"
                    value={u.role || 'user'}
                    onChange={(e) => changeUserRole(u.uid, e.target.value)}
                  >
                    <option value="user">Участник</option>
                    <option value="moderator">Модератор</option>
                    <option value="admin">Админ</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-md mx-auto text-center py-10">
              <div className="bg-slate-900 p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                <img src={profile.photoURL} className="w-32 h-32 rounded-[2.5rem] mx-auto mb-8 border-4 border-slate-950" />
                <h3 className="text-3xl font-black mb-2 uppercase italic">{profile.name}</h3>
                <window.RoleBadge role={profile.role} />
                <div className="mt-12 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-5">Ваше имя</label>
                  <input 
                    className="w-full bg-slate-950 p-5 rounded-[1.5rem] border border-white/5 outline-none text-white font-bold" 
                    value={profile.name}
                    onChange={e => {
                      const n = e.target.value;
                      setProfile(p => ({ ...p, name: n }));
                      window.db.collection('artifacts').doc(window.appId).collection('users').doc(user.uid).collection('profile').doc('info').update({ name: n });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
