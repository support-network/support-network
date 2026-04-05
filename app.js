function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [view, setView] = useState('home'); 
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [items, setItems] = useState([]);
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    // Состояния для админки
    const [newsText, setNewsText] = useState('');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                db.collection('users').doc(u.uid).onSnapshot(snap => setProfile(snap.data()));
                setIsAuthOpen(false); // Закрыть окно при успешном входе
            } else { 
                setUser(null); 
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Данные загружаются ВСЕГДА, даже для гостей
    useEffect(() => {
        const u1 = db.collection('news').orderBy('createdAt', 'desc').onSnapshot(s => setNews(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u2 = db.collection('items').onSnapshot(s => setItems(s.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { u1(); u2(); };
    }, []);

    const handleAuth = async (mode, email, pass) => {
        try {
            if (mode === 'login') {
                await auth.signInWithEmailAndPassword(email, pass);
            } else {
                const res = await auth.createUserWithEmailAndPassword(email, pass);
                await db.collection('users').doc(res.user.uid).set({
                    uid: res.user.uid, email, name: email.split('@')[0],
                    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${res.user.uid}`,
                    role: 'user'
                });
            }
        } catch (err) { alert(err.message); }
    };

    const toggleLike = async (id) => {
        if (!user) return setIsAuthOpen(true);
        const ref = db.collection('news').doc(id);
        const doc = await ref.get();
        const likes = doc.data().likes || [];
        likes.includes(user.uid) ? 
            ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(user.uid) }) :
            ref.update({ likes: firebase.firestore.FieldValue.arrayUnion(user.uid) });
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-500 animate-pulse text-2xl uppercase italic tracking-tighter">Support.Net</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-[#020617]">
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuth={handleAuth} />

            {/* НАВИГАЦИЯ */}
            <nav className="w-72 bg-slate-900/40 backdrop-blur-xl p-8 border-r border-white/5 flex flex-col">
                <div className="text-blue-500 font-black text-3xl mb-12 italic tracking-tighter uppercase">Support.Net</div>
                <div className="space-y-3 flex-1">
                    <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>🏠 <span>Главная</span></button>
                    <button onClick={() => setView('shop')} className={`nav-btn ${view === 'shop' ? 'active' : ''}`}>🛍️ <span>Магазин</span></button>
                    {user && <button onClick={() => setView('settings')} className={`nav-btn ${view === 'settings' ? 'active' : ''}`}>⚙️ <span>Профиль</span></button>}
                </div>
                
                <div className="pt-6 border-t border-white/5">
                    {user ? (
                        <div className="flex items-center gap-4 p-2">
                            <img src={profile?.photoURL} className="w-10 h-10 rounded-xl border border-white/10" />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold truncate">{profile?.name}</p>
                                <button onClick={() => auth.signOut()} className="text-[10px] text-red-500 uppercase font-black hover:text-red-400 transition-all">Выход</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsAuthOpen(true)} className="nav-btn bg-blue-600 text-white active hover:bg-blue-500">🔑 <span>Войти</span></button>
                    )}
                </div>
            </nav>

            {/* КОНТЕНТ */}
            <main className="flex-1 overflow-y-auto p-12 custom-scroll">
                <div className="max-w-5xl mx-auto">
                    {view === 'home' && (
                        <div className="space-y-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-5xl font-black italic tracking-tighter uppercase">Feed<span className="text-blue-600">.</span></h1>
                                    <p className="text-slate-500 mt-2 font-medium">Последние обновления и новости системы</p>
                                </div>
                            </div>

                            {profile?.role === 'admin' && (
                                <div className="glass-card p-8 rounded-[2.5rem] border-dashed border-2 border-blue-500/20">
                                    <textarea 
                                        className="w-full bg-slate-800/50 p-6 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600 transition-all min-h-[120px] mb-4" 
                                        placeholder="Что нового?" 
                                        value={newsText} 
                                        onChange={e => setNewsText(e.target.value)} 
                                    />
                                    <button 
                                        onClick={() => { if(!newsText) return; db.collection('news').add({ text: newsText, likes: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() }); setNewsText(''); }}
                                        className="bg-blue-600 hover:bg-blue-700 px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs"
                                    >Опубликовать</button>
                                </div>
                            )}

                            <div className="grid gap-6">
                                {news.map(n => (
                                    <NewsCard key={n.id} news={n} userId={user?.uid} isAdmin={profile?.role === 'admin'} onLike={toggleLike} onDelete={id => db.collection('news').doc(id).delete()} />
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'shop' && (
                        <div className="space-y-10">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase">Store<span className="text-blue-600">.</span></h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {items.map(i => (
                                    <StoreItem key={i.id} item={i} isAdmin={profile?.role === 'admin'} onBuy={() => user ? alert("Покупка в разработке") : setIsAuthOpen(true)} onDelete={id => db.collection('items').doc(id).delete()} />
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'settings' && user && (
                        <div className="max-w-md mx-auto space-y-8">
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Settings<span className="text-blue-600">.</span></h1>
                            <div className="glass-card p-10 rounded-[3rem] text-center">
                                <img src={profile?.photoURL} className="w-32 h-32 rounded-[2.5rem] mx-auto mb-6 ring-8 ring-blue-600/10 border-4 border-blue-600/20" />
                                <input 
                                    className="w-full bg-slate-800/50 p-4 rounded-2xl text-center font-bold outline-none focus:ring-2 focus:ring-blue-600"
                                    value={profile?.name || ''} 
                                    onChange={e => db.collection('users').doc(user.uid).update({ name: e.target.value })}
                                />
                                <p className="text-slate-500 mt-4 text-xs font-mono">{user.email}</p>
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <div className="bg-blue-600/10 p-4 rounded-2xl text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Статус: {profile?.role}</div>
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
root.render(<App />);
