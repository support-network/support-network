function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [view, setView] = useState('home'); 
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [items, setItems] = useState([]);

    // 1. Следим за входом пользователя
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                db.collection('users').doc(u.uid).onSnapshot(snap => setProfile(snap.data()));
            } else { 
                setUser(null); 
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Загружаем данные (новости и магазин), только если юзер вошел
    useEffect(() => {
        if (!user) return;
        const u1 = db.collection('news').orderBy('createdAt', 'desc').onSnapshot(s => setNews(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u2 = db.collection('items').onSnapshot(s => setItems(s.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { u1(); u2(); };
    }, [user]);

    // 3. Логика входа и регистрации
    const handleAuth = async (mode, email, pass) => {
        try {
            if (mode === 'login') {
                await auth.signInWithEmailAndPassword(email, pass);
            } else {
                const res = await auth.createUserWithEmailAndPassword(email, pass);
                await db.collection('users').doc(res.user.uid).set({
                    uid: res.user.uid,
                    email: email,
                    name: email.split('@')[0],
                    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${res.user.uid}`,
                    role: 'user'
                });
            }
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    // Экран загрузки
    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-500 animate-pulse text-2xl">SUPPORT.NET</div>;

    // Экран входа (если не авторизован)
    if (!user) return <AuthForm onAuth={handleAuth} />;

    // Основной интерфейс (если авторизован)
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Боковая панель */}
            <nav className="w-72 bg-slate-900/80 backdrop-blur-md p-8 border-r border-white/5 flex flex-col">
                <div className="text-blue-500 font-black text-3xl mb-12 italic tracking-tighter">SUPPORT.NET</div>
                <div className="space-y-4 flex-1">
                    <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>
                        <span className="text-xl">🏠</span> <span>Главная</span>
                    </button>
                    <button onClick={() => setView('shop')} className={`nav-btn ${view === 'shop' ? 'active' : ''}`}>
                        <span className="text-xl">🛍️</span> <span>Магазин</span>
                    </button>
                </div>
                <div className="pt-6 border-t border-white/5">
                    <button onClick={() => auth.signOut()} className="nav-btn text-red-400 hover:bg-red-500/10 w-full text-left">
                        <span className="text-xl">🚪</span> <span>Выход</span>
                    </button>
                </div>
            </nav>

            {/* Контентная часть */}
            <main className="flex-1 overflow-y-auto p-12 custom-scroll bg-[#020617]">
                <div className="max-w-5xl mx-auto">
                    {view === 'home' && (
                        <div className="space-y-8">
                            <h1 className="text-4xl font-black mb-10">Лента новостей</h1>
                            {news.length > 0 ? news.map(n => (
                                <NewsCard key={n.id} news={n} userId={user.uid} isAdmin={profile?.role === 'admin'} onDelete={(id) => db.collection('news').doc(id).delete()} />
                            )) : <p className="text-slate-500 italic">Новостей пока нет...</p>}
                        </div>
                    )}
                    
                    {view === 'shop' && (
                        <div>
                            <h1 className="text-4xl font-black mb-10">Магазин бонусов</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {items.map(i => (
                                    <StoreItem key={i.id} item={i} isAdmin={profile?.role === 'admin'} onDelete={(id) => db.collection('items').doc(id).delete()} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Рендер приложения
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
