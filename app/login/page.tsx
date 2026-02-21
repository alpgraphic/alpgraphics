"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [role, setRole] = useState<'admin' | 'client'>('admin');
    const [step, setStep] = useState(1); // 1: Creds, 2: 2FA
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // STEP 1: Check Credentials
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role }),
            });

            const data = await response.json();

            if (data.requires2FA) {
                // Determine if we need to show 2FA screen
                setStep(2);
                setIsLoading(false);
                return;
            }

            if (data.success) {
                completeLogin(data);
            } else {
                setError(data.error || 'Giriş başarısız');
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Giriş sunucusu yanıt vermiyor.");
            setIsLoading(false);
        }
    };

    const handle2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, token }),
            });
            const data = await response.json();

            if (data.success) {
                completeLogin(data);
            } else {
                setError(data.error || 'Geçersiz 2FA kodu');
                setIsLoading(false);
            }
        } catch (err) {
            setError("Doğrulama hatası");
            setIsLoading(false);
        }
    };

    const completeLogin = (data: any) => {
        // Session is managed via httpOnly cookies set by the server
        // Only store role indicator for client-side routing
        localStorage.setItem('alpa_auth', data.role);

        if (data.role === 'client') {
            router.push('/client/dashboard');
        } else {
            router.push('/admin/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f3e9] text-[#1a1a1a] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-[900] tracking-tight">alpgraphics</h1>
                    <p className="text-xs uppercase tracking-[0.2em] opacity-40 mt-2">Agency Operating System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-black/5 border border-black/5 overflow-hidden relative">

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Role Toggle */}
                                <div className="flex bg-black/5 p-1 rounded-full mb-8">
                                    <button onClick={() => setRole('admin')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-200 ${role === 'admin' ? 'bg-[#a62932] text-white shadow-lg' : 'text-black/60 hover:text-black/80 hover:bg-black/5'}`}>Admin</button>
                                    <button onClick={() => setRole('client')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-200 ${role === 'client' ? 'bg-[#a62932] text-white shadow-lg' : 'text-black/60 hover:text-black/80 hover:bg-black/5'}`}>Client</button>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Kullanıcı Adı</label>
                                        <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" autoCorrect="off" className="w-full px-4 py-3 rounded-lg border border-black/10 focus:border-[#a62932] outline-none" placeholder="kullaniciadiniz" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Şifre</label>
                                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-black/10 focus:border-[#a62932] outline-none" placeholder="••••••••" />
                                    </div>
                                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{error}</div>}
                                    <button disabled={isLoading} className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-[#a62932] text-white shadow-lg hover:bg-[#c4323d] hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Giriş Yapılıyor...</span>
                                            </>
                                        ) : 'Giriş Yap'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                                    🔒
                                </div>
                                <h2 className="text-xl font-bold mb-2">İki Adımlı Doğrulama</h2>
                                <p className="text-sm opacity-60 mb-8">Lütfen Google Authenticator uygulamasındaki 6 haneli kodu giriniz.</p>

                                <form onSubmit={handle2FA} className="space-y-6">
                                    <input
                                        type="text"
                                        required
                                        value={token}
                                        onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        autoFocus
                                        className="w-full px-4 py-4 rounded-lg border border-black/10 focus:border-[#a62932] outline-none text-center text-3xl font-mono tracking-[0.5em]"
                                        placeholder="000000"
                                    />
                                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{error}</div>}
                                    <button disabled={isLoading} className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-[#a62932] text-white shadow-lg hover:bg-[#c4323d] hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Doğrulanıyor...</span>
                                            </>
                                        ) : 'Onayla'}
                                    </button>
                                    <button type="button" onClick={() => setStep(1)} className="text-xs font-bold uppercase opacity-40 hover:opacity-100">Geri Dön</button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="mt-8 text-center text-sm opacity-40">
                    <p>© 2026 alpgraphics • Secure Access</p>
                </div>
            </motion.div>
        </div>
    );
}
