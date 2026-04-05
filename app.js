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
    const handleAuth = async (mode, email, pass) => {
        try {
            if (mode === 'login') {
                await auth.signInWithEmailAndPassword(email, pass);
            } else {
                const res = await auth.createUserWithEmailAndPassword(email, pass);
                // Создаем профиль в Firestore для нового пользователя
                await db.collection('users').doc(res.user.uid).set({
                    uid: res.user.uid,
                    email: email,
                    name: email.split('@')[0],
                    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${res.user.uid}`,
                    role: 'user' // По умолчанию все пользователи
                });
            }
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-500 animate-pulse">SUPPORT.NET</div>;

    // Если пользователь не вошел, показываем форму из components.js
    if (!user) return <AuthForm onAuth={handleAuth} />;

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
