// Тег роли (Админ - красный неон, Модер - оранжевый)
window.RoleBadge = ({ role }) => {
  const styles = {
    admin: "text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    moderator: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    user: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  };
  const labels = { admin: "Администратор", moderator: "Модератор", user: "Пользователь" };

  return React.createElement('span', {
    className: `px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${styles[role] || styles.user}`
  }, labels[role] || labels.user);
};

// Кнопка навигации
window.NavBtn = ({ active, onClick, icon, label }) => {
  return React.createElement('button', {
    onClick: onClick,
    className: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
    }`
  }, 
    React.createElement('div', { className: "transition-transform group-hover:scale-110" }, icon),
    React.createElement('span', { className: "font-bold text-[11px] uppercase tracking-wider" }, label),
    active && React.createElement('div', { className: "absolute right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" })
  );
};

// Карточка товара/новости в "стеклянном" стиле
window.GlassCard = ({ children, className = "" }) => {
  return React.createElement('div', {
    className: `bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-slate-900/60 ${className}`
  }, children);
};
