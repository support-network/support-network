// Компонент формы входа и регистрации
const AuthForm = ({ onAuth }) => {
    const [mode, setMode] = React.useState('login');
    const [email, setEmail] = React.useState('');
    const [pass, setPass] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAuth(mode, email, pass);
    };

    return (
        <div className="h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md glass-card p-10 rounded-[2.5rem] shadow-2xl">
                <h2 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter italic text-blue-500">
                    {mode === 'login' ? 'Вход в сеть' : 'Регистрация'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                        placeholder="Email" type="email" value={email} 
                        onChange={e => setEmail(e.target.value)} required 
                    />
                    <input 
                        className="w-full bg-slate-800/50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                        placeholder="Пароль" type="password" value={pass} 
                        onChange={e => setPass(e.target.value)} required 
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm">
                        {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                    </button>
                </form>
                <p 
                    onClick={() => setMode(mode === 'login' ? 'reg' : 'login')} 
                    className="text-center mt-6 text-slate-500 cursor-pointer hover:text-white text-xs font-bold uppercase"
                >
                    {mode === 'login' ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
                </p>
            </div>
        </div>
    );
};
