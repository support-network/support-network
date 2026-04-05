// Сохраняем компоненты в window
window.RoleBadge = ({ role }) => {
  const styles = {
    admin: "text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    moderator: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    user: "text-blue-500 bg-blue-500/10 border-blue-500/20"
  };
  const labels = { admin: "Администратор", moderator: "Модератор", user: "Участник" };

  return (
    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${styles[role] || styles.user}`}>
      {labels[role] || labels.user}
    </span>
  );
};

window.NavBtn = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-[1.2rem] transition-all relative group ${
      active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
    {active && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>}
  </button>
);
