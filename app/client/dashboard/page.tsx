"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { briefTemplates, BriefQuestion } from "@/lib/briefTypes";

interface ClientAccount {
    id: string;
    name: string;
    company: string;
    email: string;
    totalDebt: number;
    totalPaid: number;
    balance: number;
    status: string;
    briefFormType?: string;
    briefStatus: 'none' | 'pending' | 'submitted' | 'approved';
    briefToken?: string;
    briefResponses?: Record<string, string | string[]>;
    briefSubmittedAt?: string;
    briefApprovedAt?: string;
    transactions: any[];
}

export default function ClientDashboard() {
    const router = useRouter();
    const [account, setAccount] = useState<ClientAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [responses, setResponses] = useState<Record<string, string | string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get brief template
    const template = useMemo(() => {
        if (!account?.briefFormType) return null;
        return briefTemplates.find(t => t.id === account.briefFormType);
    }, [account]);

    // Fetch account data from API on mount
    useEffect(() => {
        let mounted = true;

        const fetchAccount = async () => {
            try {
                const res = await fetch('/api/client/me');
                if (!mounted) return;

                if (res.status === 401) {
                    localStorage.removeItem('client_session');
                    localStorage.removeItem('alpa_auth');
                    router.push('/login');
                    return;
                }

                if (!res.ok) {
                    throw new Error('Hesap bilgisi alınamadı');
                }

                const data = await res.json();
                if (!mounted) return;

                if (data.success && data.account) {
                    setAccount(data.account);
                } else {
                    setLoadError(data.error || 'Hesap bulunamadı');
                }
            } catch (error) {
                if (!mounted) return;
                console.error('Client dashboard fetch error:', error);
                setLoadError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchAccount();
        return () => { mounted = false; };
    }, [router]);

    const handleInputChange = (questionId: string, value: string | string[]) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleMultiSelectToggle = (questionId: string, option: string) => {
        const current = (responses[questionId] as string[]) || [];
        if (current.includes(option)) {
            handleInputChange(questionId, current.filter(o => o !== option));
        } else {
            handleInputChange(questionId, [...current, option]);
        }
    };

    const handleSubmitBrief = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account || !account.briefToken) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/brief/${account.briefToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses })
            });

            if (!response.ok) {
                throw new Error('Brief submission failed');
            }

            // Refresh account data
            const refreshRes = await fetch('/api/client/me');
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                if (data.success && data.account) {
                    setAccount(data.account);
                }
            }
        } catch (error) {
            console.error('Brief submission error:', error);
            alert('Brief gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        localStorage.removeItem('client_session');
        localStorage.removeItem('alpa_auth');
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f5f3e9] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#a62932] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm opacity-40">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (loadError || !account) {
        return (
            <div className="min-h-screen bg-[#f5f3e9] flex items-center justify-center p-8">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-4">Bir Sorun Oluştu</h2>
                    <p className="text-sm opacity-60 mb-6">
                        {loadError || 'Hesap bilgilerinize ulaşılamadı. Lütfen tekrar giriş yapın.'}
                    </p>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-[#a62932] text-white py-3 rounded-lg hover:bg-[#8a1f28] transition-colors"
                    >
                        Tekrar Giriş Yap
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f3e9] text-[#1a1a1a]">
            {/* Header */}
            <header className="border-b border-black/10 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-[900] tracking-tight">alpgraphics</h1>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Müşteri Paneli</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-bold">{account.company}</p>
                            <p className="text-xs opacity-40">{account.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-xs font-bold opacity-40 hover:opacity-100 uppercase tracking-widest"
                        >
                            Çıkış
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <AnimatePresence mode="wait">
                    {/* NO FORM ASSIGNED YET - Full Page Welcome */}
                    {account.briefStatus === 'none' && (
                        <motion.div
                            key="no-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Welcome Header */}
                            <div className="mb-12">
                                <h2 className="text-4xl font-[900] tracking-tight mb-2">Hoş Geldiniz, {account.name}!</h2>
                                <p className="text-lg opacity-60">{account.company} hesabınıza başarıyla giriş yaptınız</p>
                            </div>

                            {/* Status Card */}
                            <div className="bg-white rounded-2xl p-8 border border-black/5 mb-8">
                                <div className="flex items-start gap-6">
                                    <div className="p-4 bg-blue-500/10 rounded-xl">
                                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2">Brief Formu Bekleniyor</h3>
                                        <p className="opacity-60 mb-4">
                                            Henüz size atanmış bir brief formu bulunmuyor. Ekibimiz projenizle ilgili
                                            detaylı bir brief formu hazırlayacak ve size gönderecek.
                                        </p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                            <span className="opacity-40">Bekleniyor</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl p-6 border border-black/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Sonraki Adımlar</h4>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-[#a62932]/10 text-[#a62932] flex items-center justify-center text-xs font-bold">1</span>
                                            <span>Brief formu size atanacak</span>
                                        </li>
                                        <li className="flex items-center gap-3 opacity-40">
                                            <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold">2</span>
                                            <span>Formu doldurup göndereceksiniz</span>
                                        </li>
                                        <li className="flex items-center gap-3 opacity-40">
                                            <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold">3</span>
                                            <span>Projeniz başlayacak</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-black/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">İletişim</h4>
                                    <p className="text-sm opacity-60 mb-4">Sorularınız için bize ulaşabilirsiniz:</p>
                                    <a href="mailto:hello@alpgraphics.com" className="text-sm font-bold text-[#a62932]">
                                        hello@alpgraphics.com
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* BRIEF FORM VIEW - If pending (form assigned) */}
                    {account.briefStatus === 'pending' && template && (
                        <motion.div
                            key="brief-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="mb-12">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-4xl">{template.icon}</span>
                                    <div>
                                        <h2 className="text-4xl font-[900] tracking-tight">{template.name}</h2>
                                        <p className="text-lg opacity-60">{template.description}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#a62932]/10 border border-[#a62932]/20 rounded-lg">
                                    <p className="text-sm text-[#a62932]">
                                        <strong>Hoş geldiniz!</strong> İşe başlamadan önce lütfen aşağıdaki formu doldurun.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitBrief} className="space-y-6">
                                {template.questions.map((question, index) => (
                                    <motion.div
                                        key={question.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="bg-white/80 rounded-xl p-6 border border-black/5"
                                    >
                                        <label className="block mb-4">
                                            <span className="text-lg font-bold">
                                                {question.question}
                                                {question.required && <span className="text-[#a62932] ml-1">*</span>}
                                            </span>
                                        </label>

                                        {question.type === 'text' && (
                                            <input
                                                type="text"
                                                value={(responses[question.id] as string) || ''}
                                                onChange={(e) => handleInputChange(question.id, e.target.value)}
                                                placeholder={question.placeholder}
                                                required={question.required}
                                                className="w-full px-4 py-3 rounded-lg border border-black/10 bg-white focus:border-[#a62932] focus:outline-none"
                                            />
                                        )}

                                        {question.type === 'textarea' && (
                                            <textarea
                                                value={(responses[question.id] as string) || ''}
                                                onChange={(e) => handleInputChange(question.id, e.target.value)}
                                                placeholder={question.placeholder}
                                                required={question.required}
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-lg border border-black/10 bg-white focus:border-[#a62932] focus:outline-none resize-none"
                                            />
                                        )}

                                        {question.type === 'select' && (
                                            <select
                                                value={(responses[question.id] as string) || ''}
                                                onChange={(e) => handleInputChange(question.id, e.target.value)}
                                                required={question.required}
                                                className="w-full px-4 py-3 rounded-lg border border-black/10 bg-white focus:border-[#a62932] focus:outline-none"
                                            >
                                                <option value="">Seçiniz...</option>
                                                {question.options?.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        )}

                                        {question.type === 'multiselect' && (
                                            <div className="flex flex-wrap gap-2">
                                                {question.options?.map(option => {
                                                    const isSelected = ((responses[question.id] as string[]) || []).includes(option);
                                                    return (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => handleMultiSelectToggle(question.id, option)}
                                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                                                                ? 'bg-[#a62932] text-white'
                                                                : 'bg-black/5 hover:bg-black/10'
                                                                }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${isSubmitting
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-[#a62932] hover:bg-[#c4323d] text-white shadow-lg shadow-[#a62932]/20'
                                            }`}
                                    >
                                        {isSubmitting ? 'Gönderiliyor...' : 'Brifi Gönder'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* SUBMITTED VIEW */}
                    {account.briefStatus === 'submitted' && (
                        <motion.div
                            key="submitted"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="mb-12">
                                <h2 className="text-4xl font-[900] tracking-tight mb-2">Brifiniz İnceleniyor</h2>
                                <p className="text-lg opacity-60">{account.company} projeniz için brief alındı</p>
                            </div>

                            <div className="bg-white rounded-2xl p-8 border border-black/5 mb-8">
                                <div className="flex items-start gap-6">
                                    <div className="p-4 bg-yellow-500/10 rounded-xl">
                                        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2">İnceleme Aşamasında</h3>
                                        <p className="opacity-60 mb-4">
                                            Brifinizi aldık ve detaylı bir şekilde inceliyoruz.
                                            Proje gereksinimlerinizi değerlendiriyoruz ve en kısa sürede sizinle iletişime geçeceğiz.
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                                <span className="opacity-60">İnceleniyor</span>
                                            </span>
                                            <span className="opacity-40">•</span>
                                            <span className="opacity-40">
                                                Gönderim: {account.briefSubmittedAt ? new Date(account.briefSubmittedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl p-6 border border-black/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Süreç Durumu</h4>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</span>
                                            <span>Brief gönderildi</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold animate-pulse">2</span>
                                            <span className="font-medium">İnceleme aşamasında</span>
                                        </li>
                                        <li className="flex items-center gap-3 opacity-40">
                                            <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold">3</span>
                                            <span>Proje başlayacak</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-black/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Beklenen Süre</h4>
                                    <p className="text-3xl font-[900] text-[#a62932] mb-2">1-2 iş günü</p>
                                    <p className="text-sm opacity-60">
                                        Brifiniz onaylandığında size bildirilecek ve proje detaylarını görebileceksiniz.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 bg-black/5 rounded-xl p-6 text-center">
                                <p className="text-sm opacity-60 mb-2">Sorularınız mı var?</p>
                                <a href="mailto:hello@alpgraphics.com" className="text-sm font-bold text-[#a62932]">
                                    hello@alpgraphics.com
                                </a>
                            </div>
                        </motion.div>
                    )}

                    {/* APPROVED VIEW - Work Status */}
                    {account.briefStatus === 'approved' && (
                        <motion.div
                            key="work-status"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="mb-12">
                                <h2 className="text-4xl font-[900] tracking-tight mb-2">İş Durumu</h2>
                                <p className="text-lg opacity-60">Projenizin güncel durumunu takip edin</p>
                            </div>

                            {/* Progress Card */}
                            <div className="bg-white rounded-2xl p-8 border border-black/5 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Proje İlerlemesi</h3>
                                    <span className="text-3xl font-[900] text-[#a62932]">25%</span>
                                </div>
                                <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-[#a62932] rounded-full" style={{ width: '25%' }} />
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { name: 'Brief', status: 'done' },
                                        { name: 'Tasarım', status: 'active' },
                                        { name: 'Revizyon', status: 'pending' },
                                        { name: 'Teslim', status: 'pending' },
                                    ].map((step, i) => (
                                        <div key={i} className="text-center">
                                            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold ${step.status === 'done' ? 'bg-green-500' :
                                                step.status === 'active' ? 'bg-[#a62932]' :
                                                    'bg-black/10 text-black/30'
                                                }`}>
                                                {step.status === 'done' ? '✓' : i + 1}
                                            </div>
                                            <p className={`text-xs font-bold ${step.status === 'pending' ? 'opacity-30' : ''}`}>
                                                {step.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl p-6 border border-black/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Dosyalar</h4>
                                    <div className="text-center py-8 opacity-40">
                                        <p className="text-3xl mb-2">📁</p>
                                        <p className="text-xs">Henüz dosya yok</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-black/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">Fatura</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="opacity-60">Toplam:</span>
                                            <span className="font-bold">{account.totalDebt.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="opacity-60">Ödenen:</span>
                                            <span className="font-bold text-green-600">{account.totalPaid.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t">
                                            <span className="opacity-60">Kalan:</span>
                                            <span className={`font-bold ${account.balance > 0 ? 'text-[#a62932]' : 'text-green-600'}`}>
                                                {account.balance.toLocaleString('tr-TR')} ₺
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-black/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">İletişim</h4>
                                    <p className="text-sm opacity-60 mb-4">Sorularınız için:</p>
                                    <a href="mailto:hello@alpgraphics.com" className="text-sm font-bold text-[#a62932]">
                                        hello@alpgraphics.com
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
