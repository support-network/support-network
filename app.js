function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [view, setView] = useState('home'); 
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    // Админ-состояния
    const [newsText, setNewsText] = useState('');
    const [newProduct, setNewProduct] = useState({ title: '', price: '', img: '', description: '' });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                db.collection('users').doc(u.uid).onSnapshot(snap => setProfile(snap.data()));
                setIsAuthOpen(false);
            } else { 
                setUser(null); 
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Глобальная загрузка данных
    useEffect(() => {
        const u1 = db.collection('news').orderBy('createdAt', 'desc').onSnapshot(s => setNews(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u2 = db.collection('items').onSnapshot(s => setItems(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u3 = db.collection('users').onSnapshot(s => setUsers(s.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { u1(); u2(); u3(); };
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
        } catch (err) { alert("Ошибка авторизации: " + err.message); }
    };

    const handleNameChange = (newName) => {
        if (!newName.trim()) return alert("Имя не может быть пустым!");
        db.collection('users').doc(user.uid).update({ name: newName });
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

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-500 animate-pulse text-2xl uppercase italic tracking-tighter">Support.App</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-[#020617] text-white">
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuth={handleAuth} />

            {/* БОКОВАЯ ПАНЕЛЬ */}
            <nav className="w-72 bg-slate-900/40 backdrop-blur-2xl p-8 border-r border-white/5 flex flex-col shadow-2xl">
                <div className="text-blue-500 font-black text-3xl mb-12 italic tracking-tighter uppercase select-none">Support.App</div>
                <div className="space-y-3 flex-1">
                    <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>🏠 <span>Лента</span></button>
                    <button onClick={() => setView('shop')} className={`nav-btn ${view === 'shop' ? 'active' : ''}`}>🛍️ <span>Магазин</span></button>
                    <button onClick={() => setView('search')} className={`nav-btn ${view === 'search' ? 'active' : ''}`}>🔍 <span>Поиск</span></button>
                    {user && <button onClick={() => setView('settings')} className={`nav-btn ${view === 'settings' ? 'active' : ''}`}>⚙️ <span>Профиль</span></button>}
                </div>
                
                <div className="pt-6 border-t border-white/5">
                    {user ? (
                        <div className="flex items-center gap-4 p-3 glass-card rounded-2xl">
                            <img src={profile?.photoURL} className="w-10 h-10 rounded-xl border border-white/10" />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold truncate">{profile?.name}</p>
                                <button onClick={() => auth.signOut()} className="text-[10px] text-red-500 uppercase font-black hover:text-red-400 transition-all tracking-widest">Выйти</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsAuthOpen(true)} className="nav-btn bg-blue-600 text-white active hover:bg-blue-500 shadow-lg shadow-blue-600/20">🔑 <span>Войти</span></button>
                    )}
                </div>
            </nav>

            {/* КОНТЕНТ */}
            <main className="flex-1 overflow-y-auto p-12 custom-scroll">
                <div className="max-w-5xl mx-auto">
                    
                    {/* НОВОСТИ */}
                    {view === 'home' && (
                        <div className="space-y-10">
                            <div>
                                <h1 className="text-5xl font-black italic tracking-tighter uppercase">Новости<span className="text-blue-600">.</span></h1>
                                <p className="text-slate-500 mt-3 font-medium text-lg">Последние обновления и новости системы</p>
                            </div>

                            {profile?.role === 'admin' && (
                                <div className="glass-card p-8 rounded-[2.5rem] border-dashed border-2 border-blue-500/20">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-blue-500">Добавить новость</h3>
                                    <textarea className="w-full bg-slate-800/50 p-6 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600 transition-all min-h-[120px] mb-4 text-lg" placeholder="Что нового сегодня?" value={newsText} onChange={e => setNewsText(e.target.value)} />
                                    <button onClick={() => { if(!newsText) return; db.collection('news').add({ text: newsText, likes: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() }); setNewsText(''); }} className="bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20">Опубликовать</button>
                                </div>
                            )}

                            <div className="grid gap-8">
                                {news.map(n => (
                                    <NewsCard key={n.id} news={n} userId={user?.uid} isAdmin={profile?.role === 'admin'} onLike={toggleLike} onDelete={id => db.collection('news').doc(id).delete()} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* МАГАЗИН */}
                    {view === 'shop' && (
                        <div className="space-y-10">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase">Магазин<span className="text-blue-600">.</span></h1>
                            
                            {profile?.role === 'admin' && (
                                <div className="glass-card p-10 rounded-[3rem] border-dashed border-2 border-blue-500/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 text-xs font-black uppercase text-blue-500 tracking-widest">Панель управления товарами</div>
                                    <input className="bg-slate-800/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600" placeholder="Название товара" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} />
                                    <input className="bg-slate-800/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600" placeholder="Цена (₽)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                                    <input className="bg-slate-800/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 md:col-span-2" placeholder="Ссылка на изображение" value={newProduct.img} onChange={e => setNewProduct({...newProduct, img: e.target.value})} />
                                    <textarea className="bg-slate-800/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 md:col-span-2 min-h-[100px]" placeholder="Описание товара" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                                    <button onClick={() => { if(!newProduct.title || !newProduct.price) return alert("Заполните название и цену!"); db.collection('items').add(newProduct); setNewProduct({title:'', price:'', img:'', description:''}); }} className="md:col-span-2 bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">Добавить в каталог</button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {items.map(i => (
                                    <StoreItem key={i.id} item={i} isAdmin={profile?.role === 'admin'} onBuy={() => user ? alert("Функция покупки в разработке") : setIsAuthOpen(true)} onDelete={id => db.collection('items').doc(id).delete()} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ПОИСК ПОЛЬЗОВАТЕЛЕЙ */}
                    {view === 'search' && (
                        <div className="space-y-10">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase">Поиск<span className="text-blue-600">.</span></h1>
                            <div className="glass-card p-4 rounded-3xl flex items-center gap-4 border border-white/5 shadow-xl">
                                <span className="text-2xl ml-4">🔍</span>
                                <input 
                                    className="flex-1 bg-transparent p-4 outline-none text-xl font-medium" 
                                    placeholder="Введите имя пользователя..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                                {filteredUsers.map(u => (
                                    <div key={u.id} className="glass-card p-6 rounded-[2rem] flex items-center gap-5 hover:bg-slate-800/40 transition-all cursor-pointer group border border-white/5">
                                        <img src={u.photoURL} className="w-16 h-16 rounded-2xl shadow-lg ring-2 ring-white/5 group-hover:ring-blue-600/30 transition-all" />
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-lg truncate text-white">{u.name}</p>
                                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">{u.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ПРОФИЛЬ */}
                    {view === 'settings' && user && (
                        <div className="max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-center">Профиль<span className="text-blue-600">.</span></h1>
                            <div className="glass-card p-12 rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden border border-white/5">
                                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                                <img src={profile?.photoURL} className="w-40 h-40 rounded-[3rem] mx-auto mb-8 ring-[12px] ring-blue-600/10 border-4 border-blue-600/20 shadow-2xl" />
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block mb-3">Отображаемое имя</label>
                                        <input 
                                            className="w-full bg-slate-900/50 p-5 rounded-2xl text-center font-bold outline-none focus:ring-2 focus:ring-blue-600 border border-white/5 transition-all text-xl"
                                            value={profile?.name || ''} 
                                            placeholder="Никнейм..."
                                            onChange={e => handleNameChange(e.target.value)}
                                        />
                                    </div>
                                    <div className="p-5 bg-slate-900/30 rounded-2xl border border-white/5">
                                        <p className="text-slate-500 text-xs font-mono mb-1">Email привязанный к аккаунту</p>
                                        <p className="text-white font-bold">{user.email}</p>
                                    </div>
                                    <div className="bg-blue-600/10 p-5 rounded-2xl text-blue-400 text-[11px] font-black uppercase tracking-[0.3em] border border-blue-500/20 shadow-inner">
                                        Ваш статус: {profile?.role === 'admin' ? 'Администратор' : 'Участник'}
                                    </div>
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
