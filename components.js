// Компонент одного товара в магазине
const StoreItem = ({ item, isAdmin, onDelete }) => (
    <div className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col group transition-all hover:translate-y-[-5px]">
        <div className="h-56 bg-slate-800 relative">
            {item.img ? <img src={item.img} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-slate-600 italic">Нет фото</div>}
            <div className="absolute top-6 right-6 bg-blue-600 px-4 py-1.5 rounded-full text-sm font-black">{item.price} ₽</div>
        </div>
        <div className="p-8 flex flex-col flex-1">
            <h3 className="text-xl font-bold mb-6">{item.title}</h3>
            <button className="w-full bg-slate-100 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all mt-auto">Купить</button>
            {isAdmin && <button onClick={() => onDelete(item.id)} className="mt-4 text-[10px] text-red-500 opacity-30 hover:opacity-100">Удалить</button>}
        </div>
    </div>
);

// Компонент новости
const NewsCard = ({ news, userId, onLike, isAdmin, onDelete }) => (
    <div className="glass-card p-8 rounded-[2rem] relative group">
        <p className="text-lg text-slate-200">{news.text}</p>
        <button onClick={() => onLike(news.id)} className={`mt-6 flex items-center gap-2 px-5 py-2 rounded-2xl font-bold transition-all ${news.likes?.includes(userId) ? 'bg-red-500' : 'bg-slate-800 text-slate-400'}`}>
            ❤️ {news.likes?.length || 0}
        </button>
        {isAdmin && <button onClick={() => onDelete(news.id)} className="absolute top-8 right-8 text-[10px] text-red-900 opacity-0 group-hover:opacity-100">Удалить</button>}
    </div>
);
