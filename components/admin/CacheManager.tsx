"use client";

import { useState, useEffect, useRef } from "react";

interface CacheStats {
    sessions: { total: number; active: number; expired: number };
    rateLimits: { total: number; expired: number };
    serverTime: string;
}

export default function CacheManager({ isAdminNight }: { isAdminNight: boolean }) {
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [cleaning, setCleaning] = useState<string | null>(null);
    const [lastCleaned, setLastCleaned] = useState<{ type: string; results: Record<string, number> } | null>(null);
    const cleanedTimerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/cache');
            if (res.ok) {
                const data = await res.json();
                if (data.success) setStats(data.stats);
            }
        } catch (err) {
            console.error('Cache stats fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        fetch('/api/admin/cache')
            .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
            .then(data => { if (mounted && data.success) setStats(data.stats); })
            .catch(err => { if (mounted) console.error('Cache stats error:', err); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        return () => {
            if (cleanedTimerRef.current) clearTimeout(cleanedTimerRef.current);
        };
    }, []);

    const handleClean = async (type: 'sessions' | 'rateLimits' | 'exchangeRates' | 'all') => {
        setCleaning(type);
        try {
            const res = await fetch('/api/admin/cache', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
            if (res.ok) {
                const data = await res.json();
                setLastCleaned({ type, results: data.cleaned });
                if (cleanedTimerRef.current) clearTimeout(cleanedTimerRef.current);
                cleanedTimerRef.current = setTimeout(() => setLastCleaned(null), 5000);
                // Refresh stats
                await fetchStats();
            }
        } catch (err) {
            console.error('Cache clean error:', err);
        }
        setCleaning(null);
    };

    const card = `p-6 rounded-2xl border transition-all ${isAdminNight ? 'bg-[#0a0a0a]/40 border-white/10' : 'bg-white/60 border-black/5 shadow-xl shadow-black/5'}`;
    const statCard = `p-5 rounded-xl border ${isAdminNight ? 'bg-white/5 border-white/5' : 'bg-black/[0.02] border-black/5'}`;

    if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-[#a62932] border-t-transparent rounded-full" /></div>;

    return (
        <div className="max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-2xl font-bold mb-2">Cache & Sistem Yönetimi</h3>
                    <p className="text-sm opacity-60">Oturum, rate limit ve önbellek verilerini buradan yönetin</p>
                </div>
                <button
                    onClick={() => handleClean('all')}
                    disabled={cleaning !== null}
                    className={`px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        lastCleaned?.type === 'all'
                            ? 'bg-green-500 text-white'
                            : 'bg-[#a62932] text-white hover:bg-[#c4323d] shadow-lg shadow-[#a62932]/20'
                    } ${cleaning ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'}`}
                >
                    {lastCleaned?.type === 'all' ? '✓ Temizlendi' : cleaning === 'all' ? 'Temizleniyor...' : 'Tümünü Temizle'}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sessions */}
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-sm uppercase tracking-wider opacity-70">Oturumlar</h4>
                        </div>
                    </div>
                    <div className="space-y-3 mb-5">
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Aktif</span>
                                <span className="text-lg font-bold text-green-500">{stats?.sessions.active || 0}</span>
                            </div>
                        </div>
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Süresi Dolmuş</span>
                                <span className="text-lg font-bold text-orange-500">{stats?.sessions.expired || 0}</span>
                            </div>
                        </div>
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Toplam</span>
                                <span className="text-lg font-bold opacity-60">{stats?.sessions.total || 0}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleClean('sessions')}
                        disabled={cleaning !== null || (stats?.sessions.expired || 0) === 0}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            lastCleaned?.type === 'sessions'
                                ? 'bg-green-500/20 text-green-500'
                                : (stats?.sessions.expired || 0) > 0
                                    ? `${isAdminNight ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`
                                    : 'opacity-30 cursor-not-allowed'
                        } ${cleaning === 'sessions' ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {lastCleaned?.type === 'sessions' ? `✓ ${lastCleaned.results.sessions} oturum temizlendi` : cleaning === 'sessions' ? 'Temizleniyor...' : 'Süresi Dolmuşları Temizle'}
                    </button>
                </div>

                {/* Rate Limits */}
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-sm uppercase tracking-wider opacity-70">Rate Limit</h4>
                        </div>
                    </div>
                    <div className="space-y-3 mb-5">
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Aktif Kayıt</span>
                                <span className="text-lg font-bold text-purple-500">{(stats?.rateLimits.total || 0) - (stats?.rateLimits.expired || 0)}</span>
                            </div>
                        </div>
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Süresi Dolmuş</span>
                                <span className="text-lg font-bold text-orange-500">{stats?.rateLimits.expired || 0}</span>
                            </div>
                        </div>
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Toplam</span>
                                <span className="text-lg font-bold opacity-60">{stats?.rateLimits.total || 0}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleClean('rateLimits')}
                        disabled={cleaning !== null || (stats?.rateLimits.expired || 0) === 0}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            lastCleaned?.type === 'rateLimits'
                                ? 'bg-green-500/20 text-green-500'
                                : (stats?.rateLimits.expired || 0) > 0
                                    ? `${isAdminNight ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`
                                    : 'opacity-30 cursor-not-allowed'
                        } ${cleaning === 'rateLimits' ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {lastCleaned?.type === 'rateLimits' ? `✓ ${lastCleaned.results.rateLimits} kayıt temizlendi` : cleaning === 'rateLimits' ? 'Temizleniyor...' : 'Süresi Dolmuşları Temizle'}
                    </button>
                </div>

                {/* Exchange Rate Cache */}
                <div className={card}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-sm uppercase tracking-wider opacity-70">Döviz Kuru</h4>
                        </div>
                    </div>
                    <div className="space-y-3 mb-5">
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Kaynak</span>
                                <span className="text-sm font-bold opacity-80">TCMB</span>
                            </div>
                        </div>
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Cache Süresi</span>
                                <span className="text-sm font-bold opacity-80">1 Saat</span>
                            </div>
                        </div>
                        <div className={statCard}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs opacity-50">Tür</span>
                                <span className="text-sm font-bold opacity-80">In-Memory</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleClean('exchangeRates')}
                        disabled={cleaning !== null}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            lastCleaned?.type === 'exchangeRates'
                                ? 'bg-green-500/20 text-green-500'
                                : `${isAdminNight ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`
                        } ${cleaning === 'exchangeRates' ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {lastCleaned?.type === 'exchangeRates' ? '✓ Cache sıfırlandı' : cleaning === 'exchangeRates' ? 'Sıfırlanıyor...' : 'Cache Sıfırla'}
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className={`p-6 rounded-2xl border border-dashed flex gap-4 items-start ${isAdminNight ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                <span className="text-xl">💡</span>
                <div className="text-xs opacity-60 space-y-1">
                    <p className="font-bold">Cache Yönetimi Hakkında</p>
                    <p>Süresi dolmuş oturumlar ve rate limit kayıtları veritabanında yer kaplar. Düzenli temizlik performansı artırır. MongoDB TTL index&apos;leri otomatik temizlik yapar ancak bu sayfa ile anlık temizleyebilirsiniz. Döviz kuru cache&apos;i sunucu belleğinde tutulur ve redeploy ile otomatik sıfırlanır.</p>
                </div>
            </div>
        </div>
    );
}
