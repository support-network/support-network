// Карточка товара в магазине
const StoreItem = ({ item, isAdmin, onDelete, onBuy }) => (
    <div className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col group transition-all hover:translate-y-[-5px]">
        <div className="h-56 bg-slate-800 relative">
            {item.img ? (
                <img src={item.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.title} />
            ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic font-medium">Нет фото</div>
            )}
            <div className="absolute top-6 right-6 bg-blue-600 px-5 py-2 rounded-full text-sm font-black shadow-lg shadow-blue-600/40">{item.price} ₽</div>
        </div>
        <div className="p-8 flex flex-col flex-1">
            <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
            <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">{item.description || 'Описание отсутствует'}</p>
            <button onClick={() => onBuy(item)} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all mt-auto">Купить</button>
            {isAdmin && (
                <button onClick={() => onDelete(item.id)} className="mt-4 text-[10px] text-red-500 opacity-30 hover:opacity-100 uppercase font-black tracking-tighter">Удалить товар</button>
            )}
        </div>
    </div>
);

// Карточка новости
const NewsCard = ({ news, userId, onLike, isAdmin, onDelete }) => (
    <div className="glass-card p-8 rounded-[2rem] relative group border border-white/5 hover:border-blue-500/30 transition-all">
        <p className="text-lg text-slate-200 leading-relaxed font-medium">{news.text}</p>
        <div className="mt-6 flex items-center gap-4">
            <button 
                onClick={() => onLike(news.id)} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all ${userId && news.likes?.includes(userId) ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
                ❤️ {news.likes?.length || 0}
            </button>
        </div>
        {isAdmin && (
            <button onClick={() => onDelete(news.id)} className="absolute top-8 right-8 text-[10px] text-red-900 opacity-0 group-hover:opacity-100 uppercase font-black hover:text-red-500 transition-all">Удалить</button>
        )}
    </div>
);

// Модальное окно авторизации
const AuthModal = ({ isOpen, onClose, onAuth }) => {
    if (!isOpen) return null;
    const [mode, setMode] = React.useState('login');
    const [email, setEmail] = React.useState('');
    const [pass, setPass] = React.useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md glass-card p-10 rounded-[2.5rem] relative animate-in fade-in zoom-in duration-300 shadow-2xl border border-white/10">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white text-3xl transition-colors">&times;</button>
                <h2 className="text-3xl font-black mb-8 text-center uppercase italic text-blue-500 tracking-tighter">
                    {mode === 'login' ? 'Вход' : 'Регистрация'}
                </h2>
                <form onSubmit={(e) => { e.preventDefault(); onAuth(mode, email, pass); }} className="space-y-4">
                    <input className="w-full bg-slate-900/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all border border-white/5" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input className="w-full bg-slate-900/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all border border-white/5" placeholder="Пароль" type="password" value={pass} onChange={e => setPass(e.target.value)} required />
                    <button className="w-full bg-blue-600 hover:bg-blue-700 py-5 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/40 uppercase tracking-widest text-xs">
                        {mode === 'login' ? 'Войти в систему' : 'Создать аккаунт'}
                    </button>
                </form>
                <p onClick={() => setMode(mode === 'login' ? 'reg' : 'login')} className="text-center mt-8 text-slate-500 cursor-pointer hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                    {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже в системе? Войти'}
                </p>
            </div>
        </div>
    );
};
