function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [view, setView] = useState('home'); // home, shop, settings
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [items, setItems] = useState([]);

    // Авторизация и профиль
    useEffect(() => {
        return auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                db.collection('users').doc(u.uid).onSnapshot(snap => setProfile(snap.data()));
            } else { setUser(null); }
            setLoading(false);
        });
    }, []);

    // Загрузка контента
    useEffect(() => {
        if (!user) return;
        const u1 = db.collection('news').orderBy('createdAt', 'desc').onSnapshot(s => setNews(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u2 = db.collection('items').onSnapshot(s => setItems(s.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { u1(); u2(); };
    }, [user]);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-500">SUPPORT.NET</div>;

    if (!user) return <div className="h-screen flex items-center justify-center">
        <button onClick={() => setView('auth')} className="bg-blue-600 p-10 rounded-3xl font-bold uppercase">Войти через форму (Разрабатывается)</button>
    </div>;

    return (
        <div className="flex h-screen overflow-hidden">
            <nav className="w-64 bg-slate-900/50 p-6 border-r border-slate-800/50 flex flex-col">
                <div className="text-blue-500 font-black text-2xl mb-12 italic">SUPPORT.NET</div>
                <div className="space-y-3 flex-1">
                    <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>🏠 Главная</button>
                    <button onClick={() => setView('shop')} className={`nav-btn ${view === 'shop' ? 'active' : ''}`}>🛍️ Магазин</button>
                </div>
                <button onClick={() => auth.signOut()} className="nav-btn text-red-500">🚪 Выход</button>
            </nav>

            <main className="flex-1 overflow-y-auto p-12 custom-scroll">
                {view === 'home' && news.map(n => <NewsCard key={n.id} news={n} userId={user.uid} isAdmin={profile?.role === 'admin'} onLike={(id) => {/* лайк */}} />)}
                {view === 'shop' && <div className="grid grid-cols-3 gap-8">
                    {items.map(i => <StoreItem key={i.id} item={i} isAdmin={profile?.role === 'admin'} onDelete={(id) => db.collection('items').doc(id).delete()} />)}
                </div>}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
