function App() {
    // [СОСТОЯНИЕ]
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [view, setView] = useState('home');
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [items, setItems] = useState([]);
    const [adminText, setAdminText] = useState('');
    const [newItem, setNewItem] = useState({ title: '', price: '', img: '' });

    // [ЗАГРУЗКА ДАННЫХ]
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                db.collection('users').doc(u.uid).onSnapshot(snap => setProfile(snap.data()));
            } else { setUser(null); }
            setLoading(false);
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!user) return;
        const unsubNews = db.collection('news').orderBy('createdAt', 'desc').onSnapshot(s => 
            setNews(s.docs.map(d => ({id: d.id, ...d.data()})))
        );
        const unsubItems = db.collection('items').onSnapshot(s => 
            setItems(s.docs.map(d => ({id: d.id, ...d.data()})))
        );
        return () => { unsubNews(); unsubItems(); };
    }, [user]);

    // [ФУНКЦИИ МАГАЗИНА И НОВОСТЕЙ]
    const toggleLike = async (id) => {
        const ref = db.collection('news').doc(id);
        const doc = await ref.get();
        const likes = doc.data().likes || [];
        likes.includes(user.uid) ? 
            ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(user.uid) }) :
            ref.update({ likes: firebase.firestore.FieldValue.arrayUnion(user.uid) });
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold">LOADING...</div>;
    if (!user) return <AuthPage />; // Здесь могла бы быть логика входа

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Навигация */}
            <nav className="w-64 bg-slate-900 p-6 border-r border-slate-800">
                <div className="text-blue-500 font-black text-2xl mb-10 italic">SUPPORT.NET</div>
                <button onClick={() => setView('home')} className={`nav-btn ${view==='home'?'active':''}`}>🏠 Главная</button>
                <button onClick={() => setView('shop')} className={`nav-btn ${view==='shop'?'active':''}`}>🛍️ Магазин</button>
                <button onClick={() => setView('settings')} className={`nav-btn ${view==='settings'?'active':''}`}>⚙️ Профиль</button>
                <button onClick={() => auth.signOut()} className="nav-btn text-red-500 mt-auto">🚪 Выход</button>
            </nav>

            {/* Контент */}
            <main className="flex-1 overflow-y-auto p-10 bg-slate-950 custom-scroll">
                {view === 'home' && <HomeView news={news} profile={profile} toggleLike={toggleLike} adminText={adminText} setAdminText={setAdminText} db={db} />}
                {view === 'shop' && <ShopView items={items} profile={profile} newItem={newItem} setNewItem={setNewItem} db={db} />}
                {view === 'settings' && <SettingsView profile={profile} user={user} db={db} setProfile={setProfile} />}
            </main>
        </div>
    );
}

// Рендерим приложение
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
