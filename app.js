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
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState('');

    // Админ-состояния
    const [newsText, setNewsText] = useState('');
    const [newProduct, setNewProduct] = useState({ title: '', price: '', img: '', description: '' });

    // 1. Авторизация и онлайн статус
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                const userRef = db.collection('users').doc(u.uid);
                userRef.onSnapshot(snap => setProfile(snap.data()));
                
                // Ставим статус "В сети"
                userRef.update({ isOnline: true, lastSeen: firebase.firestore.FieldValue.serverTimestamp() });
                
                // При закрытии вкладки - офлайн
                window.onbeforeunload = () => {
                    userRef.update({ isOnline: false, lastSeen: firebase.firestore.FieldValue.serverTimestamp() });
                };
            } else { 
                setUser(null); 
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Глобальная загрузка данных
    useEffect(() => {
        const u1 = db.collection('news').orderBy('createdAt', 'desc').onSnapshot(s => setNews(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u2 = db.collection('items').onSnapshot(s => setItems(s.docs.map(d => ({id: d.id, ...d.data()}))));
        const u3 = db.collection('users').onSnapshot(s => setUsers(s.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { u1(); u2(); u3(); };
    }, []);

    // 3. Загрузка сообщений чата
    useEffect(() => {
        if (!activeChat || !user) return;
        const chatId = [user.uid, activeChat.uid].sort().join('_');
        const unsub = db.collection('chats').doc(chatId).collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(s => setMessages(s.docs.map(d => d.data())));
        return () => unsub();
    }, [activeChat, user]);

    const handleAuth = async (mode, email, pass) => {
        try {
            if (mode === 'login') {
                await auth.signInWithEmailAndPassword(email, pass);
            } else {
                const res = await auth.createUserWithEmailAndPassword(email, pass);
                await db.collection('users').doc(res.user.uid).set({
                    uid: res.user.uid, email, name: email.split('@')[0],
                    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${res.user.uid}`,
                    role: 'user', isOnline: true, friends: [], friendRequests: [], hideOnline: false
                });
            }
        } catch (err) { alert(err.message); }
    };

    // --- ЛОГИКА ДРУЗЕЙ ---
    const sendFriendRequest = async (targetUid) => {
        if (!user) return setIsAuthOpen(true);
        await db.collection('users').doc(targetUid).update({
            friendRequests: firebase.firestore.FieldValue.arrayUnion(user.uid)
        });
    };

    const acceptFriend = async (targetUid) => {
        const myRef = db.collection('users').doc(user.uid);
        const theirRef = db.collection('users').doc(targetUid);
        await myRef.update({
            friends: firebase.firestore.FieldValue.arrayUnion(targetUid),
            friendRequests: firebase.firestore.FieldValue.arrayRemove(targetUid)
        });
        await theirRef.update({
            friends: firebase.firestore.FieldValue.arrayUnion(user.uid)
        });
    };

    const removeFriend = async (targetUid) => {
        await db.collection('users').doc(user.uid).update({ friends: firebase.firestore.FieldValue.arrayRemove(targetUid) });
        await db.collection('users').doc(targetUid).update({ friends: firebase.firestore.FieldValue.arrayRemove(user.uid) });
    };

    // --- ЛОГИКА ЧАТА ---
    const sendMessage = async () => {
        if (!msgInput.trim() || !activeChat) return;
        const chatId = [user.uid, activeChat.uid].sort().join('_');
        await db.collection('chats').doc(chatId).collection('messages').add({
            text: msgInput,
            senderId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // Обновляем список последних чатов для обоих
        db.collection('users').doc(user.uid).update({ 
            lastChats: firebase.firestore.FieldValue.arrayUnion(activeChat.uid) 
        });
        db.collection('users').doc(activeChat.uid).update({ 
            lastChats: firebase.firestore.FieldValue.arrayUnion(user.uid) 
        });
        setMsgInput('');
    };

    const filteredUsers = users.filter(u => u.uid !== user?.uid && u.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const myFriends = users.filter(u => profile?.friends?.includes(u.uid));
    const myRequests = users.filter(u => profile?.friendRequests?.includes(u.uid));
    const recentChatUsers = users.filter(u => profile?.lastChats?.includes(u.uid));

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-500 animate-pulse text-2xl uppercase italic tracking-tighter">Support.App</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-[#020617] text-white">
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuth={handleAuth} />

            {/* НАВИГАЦИЯ */}
            <nav className="w-72 bg-slate-900/40 backdrop-blur-2xl p-8 border-r border-white/5 flex flex-col shadow-2xl">
                <div className="text-blue-500 font-black text-3xl mb-12 italic tracking-tighter uppercase select-none">Support.App</div>
                <div className="space-y-2 flex-1">
                    <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>🏠 <span>Лента</span></button>
                    <button onClick={() => setView('shop')} className={`nav-btn ${view === 'shop' ? 'active' : ''}`}>🛍️ <span>Магазин</span></button>
                    <button onClick={() => setView('messages')} className={`nav-btn ${view === 'messages' ? 'active' : ''}`}>💬 <span>Сообщения</span></button>
                    <button onClick={() => setView('friends')} className={`nav-btn ${view === 'friends' ? 'active' : ''}`}>👥 <span>Друзья</span> {myRequests.length > 0 && <span className="bg-red-500 text-[8px] px-1.5 py-0.5 rounded-full ml-auto animate-bounce">{myRequests.length}</span>}</button>
                    {user && <button onClick={() => setView('settings')} className={`nav-btn ${view === 'settings' ? 'active' : ''}`}>⚙️ <span>Профиль</span></button>}
                </div>
                <div className="pt-6 border-t border-white/5">
                    {user ? (
                        <div className="flex items-center gap-4 p-3 glass-card rounded-2xl relative">
                            <img src={profile?.photoURL} className="w-10 h-10 rounded-xl border border-white/10" />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold truncate">{profile?.name}</p>
                                <OnlineStatus isOnline={profile?.isOnline} hidden={profile?.hideOnline} />
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsAuthOpen(true)} className="nav-btn bg-blue-600 text-white active">🔑 <span>Войти</span></button>
                    )}
                </div>
            </nav>

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <main className="flex-1 overflow-y-auto p-12 custom-scroll relative">
                <div className="max-w-5xl mx-auto">
                    
                    {/* ЛЕНТА */}
                    {view === 'home' && (
                        <div className="space-y-10">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase">Новости<span className="text-blue-600">.</span></h1>
                            {profile?.role === 'admin' && (
                                <div className="glass-card p-8 rounded-[2.5rem] border-dashed border-2 border-blue-500/20">
                                    <textarea className="w-full bg-slate-800/50 p-6 rounded-3xl outline-none mb-4 min-h-[100px]" placeholder="Написать новость..." value={newsText} onChange={e => setNewsText(e.target.value)} />
                                    <button onClick={() => { if(!newsText) return; db.collection('news').add({ text: newsText, likes: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() }); setNewsText(''); }} className="bg-blue-600 px-8 py-3 rounded-xl font-bold uppercase text-xs">Опубликовать</button>
                                </div>
                            )}
                            <div className="grid gap-6">{news.map(n => <NewsCard key={n.id} news={n} userId={user?.uid} isAdmin={profile?.role === 'admin'} onLike={toggleLike} onDelete={id => db.collection('news').doc(id).delete()} />)}</div>
                        </div>
                    )}

                    {/* ДРУЗЬЯ (БЫВШИЙ ПОИСК) */}
                    {view === 'friends' && (
                        <div className="space-y-10">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase">Друзья<span className="text-blue-600">.</span></h1>
                            
                            {myRequests.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Заявки в друзья</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {myRequests.map(u => (
                                            <div key={u.uid} className="glass-card p-4 rounded-3xl flex items-center gap-4">
                                                <img src={u.photoURL} className="w-12 h-12 rounded-xl" />
                                                <p className="flex-1 font-bold">{u.name}</p>
                                                <button onClick={() => acceptFriend(u.uid)} className="bg-green-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase">Принять</button>
                                                <button onClick={() => db.collection('users').doc(user.uid).update({ friendRequests: firebase.firestore.FieldValue.arrayRemove(u.uid) })} className="bg-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase">Отклон.</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="glass-card p-4 rounded-3xl flex items-center gap-4 border border-white/5">
                                <span className="text-xl ml-4">🔍</span>
                                <input className="flex-1 bg-transparent p-4 outline-none text-xl font-medium" placeholder="Найти новых друзей..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredUsers.map(u => (
                                    <div key={u.uid} className="glass-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center text-center">
                                        <img src={u.photoURL} className="w-20 h-20 rounded-3xl mb-4" />
                                        <div className="mb-4">
                                            <p className="font-bold text-lg">{u.name}</p>
                                            <OnlineStatus isOnline={u.isOnline} hidden={u.hideOnline} />
                                        </div>
                                        <div className="w-full space-y-2">
                                            {profile?.friends?.includes(u.uid) ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setActiveChat(u); setView('messages'); }} className="flex-1 bg-blue-600/20 text-blue-400 py-3 rounded-xl text-[10px] font-black uppercase">Чат</button>
                                                    <button onClick={() => removeFriend(u.uid)} className="bg-red-500/10 text-red-500 px-3 rounded-xl text-lg">×</button>
                                                </div>
                                            ) : (
                                                <button 
                                                    disabled={u.friendRequests?.includes(user?.uid)}
                                                    onClick={() => sendFriendRequest(u.uid)} 
                                                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase ${u.friendRequests?.includes(user?.uid) ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                                                >
                                                    {u.friendRequests?.includes(user?.uid) ? 'Заявка отправлена' : 'Добавить в друзья'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* СООБЩЕНИЯ */}
                    {view === 'messages' && (
                        <div className="h-[80vh] flex gap-6">
                            {/* Список диалогов */}
                            <div className="w-80 bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-6 flex flex-col">
                                <h2 className="text-xl font-black mb-6 uppercase italic">Чаты</h2>
                                <div className="space-y-2 overflow-y-auto custom-scroll flex-1">
                                    {recentChatUsers.map(u => (
                                        <div 
                                            onClick={() => setActiveChat(u)}
                                            key={u.uid} 
                                            className={`p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${activeChat?.uid === u.uid ? 'bg-blue-600' : 'hover:bg-white/5'}`}
                                        >
                                            <img src={u.photoURL} className="w-10 h-10 rounded-xl" />
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold text-sm truncate">{u.name}</p>
                                                <OnlineStatus isOnline={u.isOnline} hidden={u.hideOnline} />
                                            </div>
                                        </div>
                                    ))}
                                    {recentChatUsers.length === 0 && <p className="text-slate-500 text-xs italic text-center mt-10 text-balance">Нет активных чатов. Напишите другу из раздела "Друзья".</p>}
                                </div>
                            </div>

                            {/* Окно чата */}
                            <div className="flex-1 glass-card rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden">
                                {activeChat ? (
                                    <>
                                        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
                                            <img src={activeChat.photoURL} className="w-12 h-12 rounded-xl" />
                                            <div>
                                                <p className="font-bold">{activeChat.name}</p>
                                                <OnlineStatus isOnline={activeChat.isOnline} hidden={activeChat.hideOnline} />
                                            </div>
                                        </div>
                                        <div className="flex-1 p-8 overflow-y-auto custom-scroll space-y-4">
                                            {messages.map((m, idx) => (
                                                <div key={idx} className={`flex ${m.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] p-4 rounded-[1.5rem] ${m.senderId === user.uid ? 'bg-blue-600 rounded-tr-none' : 'bg-slate-800 rounded-tl-none'}`}>
                                                        <p className="text-sm font-medium">{m.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-6 bg-slate-900/50 flex gap-4">
                                            <input 
                                                className="flex-1 bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white" 
                                                placeholder="Введите сообщение..." 
                                                value={msgInput}
                                                onChange={e => setMsgInput(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                                            />
                                            <button onClick={sendMessage} className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-xl hover:bg-blue-500 transition-all">➔</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic">
                                        <span className="text-6xl mb-4">📬</span>
                                        <p>Выберите чат для начала общения</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ПРОФИЛЬ */}
                    {view === 'settings' && user && (
                        <div className="max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-center">Профиль<span className="text-blue-600">.</span></h1>
                            <div className="glass-card p-12 rounded-[3.5rem] text-center shadow-2xl relative border border-white/5">
                                <img src={profile?.photoURL} className="w-40 h-40 rounded-[3rem] mx-auto mb-8 ring-[12px] ring-blue-600/10 border-4 border-blue-600/20 shadow-2xl" />
                                <div className="space-y-6">
                                    <input 
                                        className="w-full bg-slate-900/50 p-5 rounded-2xl text-center font-bold outline-none focus:ring-2 focus:ring-blue-600 text-xl text-white"
                                        value={profile?.name || ''} 
                                        onChange={e => { if(e.target.value.trim()) db.collection('users').doc(user.uid).update({ name: e.target.value }); }}
                                    />
                                    {profile?.role === 'admin' && (
                                        <div className="flex items-center justify-between p-5 bg-slate-800/40 rounded-2xl border border-white/5">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Режим инкогнито</span>
                                            <button 
                                                onClick={() => db.collection('users').doc(user.uid).update({ hideOnline: !profile.hideOnline })}
                                                className={`w-14 h-8 rounded-full p-1 transition-all ${profile.hideOnline ? 'bg-blue-600' : 'bg-slate-700'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-white transition-all ${profile.hideOnline ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                    )}
                                    <div className="bg-blue-600/10 p-5 rounded-2xl text-blue-400 text-[11px] font-black uppercase tracking-[0.3em] border border-blue-500/20">Статус: {profile?.role === 'admin' ? 'Администратор' : 'Участник'}</div>
                                    <button onClick={() => auth.signOut()} className="w-full py-4 rounded-2xl font-black uppercase text-xs text-red-500 border border-red-500/20 hover:bg-red-500/10">Выйти из системы</button>
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
