"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('admin@alpgraphics.com');
    const [password, setPassword] = useState('');
    const [secret, setSecret] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const startSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 'init', email })
            });
            const data = await res.json();

            if (data.success) {
                setSecret(data.secret);
                setQrCode(data.qrCodeUrl);
                setStep(2);
            } else {
                setError(data.error || 'Setup initiation failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: 'verify',
                    email,
                    password,
                    secret,
                    token
                })
            });
            const data = await res.json();

            if (data.success) {
                alert('Admin Account Created! Redirecting to login...');
                router.push('/login');
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f3e9] p-6 text-black">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
                <h1 className="text-2xl font-bold mb-6 text-center text-[#a62932]">Admin Setup</h1>

                {step === 1 && (
                    <form onSubmit={startSetup} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase opacity-50 mb-1">Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full p-3 rounded border border-gray-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase opacity-50 mb-1">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-3 rounded border border-gray-200"
                                required
                            />
                        </div>
                        <button disabled={loading} className="w-full bg-black text-white p-4 rounded-xl font-bold uppercase tracking-widest">
                            {loading ? 'Generating...' : 'Next: Setup 2FA'}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={verifyAndCreate} className="space-y-6">
                        <div className="text-center">
                            <p className="text-sm opacity-60 mb-4">Scan this QR code with Google Authenticator:</p>
                            {qrCode && <img src={qrCode} alt="2FA QR" className="mx-auto border p-2 rounded-lg" />}
                            <p className="text-xs font-mono mt-2 opacity-40 break-all">{secret}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase opacity-50 mb-1">Enter 6-digit Code</label>
                            <input
                                type="text"
                                value={token}
                                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full p-3 rounded border border-gray-200 text-center text-xl tracking-[0.5em] font-mono"
                                required
                            />
                        </div>

                        <button disabled={loading} className="w-full bg-[#a62932] text-white p-4 rounded-xl font-bold uppercase tracking-widest">
                            {loading ? 'Verifying...' : 'Finalize Setup'}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </form>
                )}
            </div>
        </div>
    );
}
