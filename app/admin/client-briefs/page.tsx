"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAgency } from "@/context/AgencyContext";
import { briefTemplates } from "@/lib/briefTypes";

export default function ClientBriefsPage() {
    const router = useRouter();
    const { accounts, updateAccount, isAdminNight } = useAgency();

    // Auth check
    useEffect(() => {
        const auth = localStorage.getItem('alpa_auth');
        if (!auth || auth !== 'admin') router.push('/login');
    }, [router]);

    // Toast & Brief viewer
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    const [viewBriefAccount, setViewBriefAccount] = useState<any | null>(null);

    // States
    const [selectedAccountId, setSelectedAccountId] = useState<number | string>('');
    const [selectedFormType, setSelectedFormType] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Get selected account
    const selectedAccount = accounts.find(a => String(a.id) === String(selectedAccountId));

    // Filter accounts - show ALL non-admin accounts (relaxed filter)
    const clientAccounts = accounts.filter(a => {
        // Exclude alpgraphics admin accounts
        const isAdmin = a.email && a.email.toLowerCase().includes('alpgraphics');
        return !isAdmin;
    });

    // Get accounts with pending briefs
    const pendingBriefs = accounts.filter(a =>
        a.briefFormType && a.briefStatus === 'submitted'
    );

    // Get accounts with approved briefs
    const approvedBriefs = accounts.filter(a =>
        a.briefFormType && a.briefStatus === 'approved'
    );

    const handleAssignBrief = async () => {
        if (!selectedAccountId || !selectedFormType) {
            showToast('Lütfen müşteri ve form tipi seçin', 'error');
            return;
        }

        setIsAssigning(true);

        try {
            // Generate a unique brief token for the public form URL
            const briefToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Assign brief form to account
            updateAccount(selectedAccountId, {
                briefFormType: selectedFormType as any,
                briefStatus: 'pending', // Set to pending so client can fill
                briefToken: briefToken // Token for public brief form URL
            });

            // Brief form URL generated for the client
            const briefUrl = `${window.location.origin}/brief/${briefToken}`;

            showToast(`Brief formu ${selectedAccount?.company || 'müşteri'} için atandı!`);

            // Reset
            setSelectedAccountId('');
            setSelectedFormType('');
        } catch (error) {
            console.error('❌ Brief assignment error:', error);
            showToast('Brief ataması başarısız', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    const bgClass = isAdminNight ? 'bg-[#0a0a0a] text-[#f5f3e9]' : 'bg-white text-[#1a1a1a]';
    const cardBg = isAdminNight ? 'bg-[#1a1a1a]' : 'bg-white';
    const borderColor = isAdminNight ? 'border-white/10' : 'border-black/5';

    return (
        <div className={`min-h-screen ${bgClass}`}>
            {/* Header */}
            <header className={`border-b ${borderColor} px-8 py-6`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-[900]">Client Briefs</h1>
                        <p className="text-sm opacity-40 uppercase tracking-widest mt-1">
                            Müşteri Brief Formları - {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border ${borderColor} rounded-lg hover:bg-black/5 transition-colors`}
                    >
                        ← Dashboard'a Dön
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-8">
                {/* Debug Info */}
                {clientAccounts.length === 0 && (
                    <div className="mb-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                        <h3 className="font-bold text-yellow-600 mb-2">⚠️ Debug Info</h3>
                        <div className="text-sm space-y-1">
                            <p>Total accounts loaded: {accounts.length}</p>
                            <p>Client accounts (filtered): {clientAccounts.length}</p>
                            <p>Console'u aç (F12) ve detaylı bilgileri gör</p>
                        </div>
                    </div>
                )}

                {/* Form Templates Grid */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-6">Form Şablonları</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {briefTemplates.map(template => (
                            <motion.button
                                key={template.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedFormType(template.id)}
                                className={`${cardBg} border-2 ${selectedFormType === template.id
                                    ? 'border-[#a62932]'
                                    : borderColor
                                    } rounded-xl p-6 text-center transition-all`}
                            >
                                <div className="text-4xl mb-3">{template.icon}</div>
                                <h3 className="text-sm font-bold">{template.name}</h3>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Assignment Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-6">Form Ata</h2>
                    <div className={`${cardBg} border ${borderColor} rounded-2xl p-8`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Client Select */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-3">
                                    Müşteri Seç
                                </label>
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className={`w-full px-4 py-3 border ${borderColor} rounded-lg ${bgClass} focus:border-[#a62932] outline-none`}
                                >
                                    <option value="">Müşteri seçin...</option>
                                    {clientAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.company} - {account.name}
                                        </option>
                                    ))}
                                </select>
                                {clientAccounts.length === 0 && (
                                    <p className="text-xs text-red-500 mt-2">
                                        ⚠️ Müşteri bulunamadı. Admin Dashboard → Accounts'tan ekleyin.
                                    </p>
                                )}
                            </div>

                            {/* Form Type Select */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-3">
                                    Form Tipi
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {briefTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => setSelectedFormType(template.id)}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${selectedFormType === template.id
                                                ? 'bg-[#a62932] text-white border-[#a62932]'
                                                : `border-current/20 hover:bg-current/5`
                                                }`}
                                        >
                                            {template.icon} {template.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Selected Info */}
                        {selectedAccountId && selectedFormType && selectedAccount && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                                <p className="text-sm">
                                    <strong>{selectedAccount.company}</strong> için{' '}
                                    <strong>{briefTemplates.find(t => t.id === selectedFormType)?.name}</strong>{' '}
                                    formu atanacak.
                                </p>
                            </div>
                        )}

                        {/* Assign Button */}
                        <button
                            onClick={handleAssignBrief}
                            disabled={!selectedAccountId || !selectedFormType || isAssigning}
                            className="w-full py-4 bg-[#a62932] text-white font-bold uppercase tracking-widest rounded-xl hover:bg-[#c4323d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAssigning ? 'Atanıyor...' : '📋 Form Ata'}
                        </button>

                        <p className="text-xs opacity-40 text-center mt-4">
                            Form atandıktan sonra müşteri login yapınca görür ve doldurur
                        </p>
                    </div>
                </section>

                {/* Pending Briefs */}
                <section>
                    <h2 className="text-xl font-bold mb-6">Bekleyen Briefler</h2>
                    {pendingBriefs.length === 0 ? (
                        <div className={`${cardBg} border ${borderColor} rounded-2xl p-12 text-center`}>
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-lg opacity-60">Henüz bekleyen brief yok</p>
                            <p className="text-sm opacity-40 mt-2">
                                Müşteriler brief gönderdiğinde burada görünecek
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingBriefs.map(account => {
                                const template = briefTemplates.find(t => t.id === account.briefFormType);
                                return (
                                    <motion.div
                                        key={account.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`${cardBg} border ${borderColor} rounded-xl p-6`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-yellow-500 text-white rounded-xl flex items-center justify-center text-2xl">
                                                    {template?.icon || '📋'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{account.company}</h3>
                                                    <p className="text-sm opacity-60">{template?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs opacity-40">Gönderildi:</p>
                                                    <p className="text-sm font-bold">
                                                        {account.briefSubmittedAt
                                                            ? new Date(account.briefSubmittedAt).toLocaleDateString('tr-TR')
                                                            : '-'
                                                        }
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setViewBriefAccount(account)}
                                                    className="px-4 py-2 bg-[#a62932] text-white text-xs font-bold rounded-lg hover:bg-[#c4323d] transition-colors"
                                                >
                                                    İncele →
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Approved Briefs */}
                {approvedBriefs.length > 0 && (
                    <section className="mt-10">
                        <h2 className="text-xl font-bold mb-6">Onaylanan Briefler</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {approvedBriefs.map(account => {
                                const template = briefTemplates.find(t => t.id === account.briefFormType);
                                return (
                                    <motion.div
                                        key={account.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`${cardBg} border ${borderColor} border-l-4 border-l-green-500 rounded-xl p-5`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center text-xl">
                                                    {template?.icon || '📋'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{account.company}</h3>
                                                    <p className="text-xs opacity-40">
                                                        Onaylandı: {account.briefApprovedAt ? new Date(account.briefApprovedAt).toLocaleDateString('tr-TR') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-green-500">✓ Onaylandı</span>
                                                <button
                                                    onClick={() => setViewBriefAccount(account)}
                                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${isAdminNight ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                                                >
                                                    Görüntüle
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>

            {/* Brief Response Viewer Modal */}
            {viewBriefAccount && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={() => setViewBriefAccount(null)}>
                    <div
                        className={`w-full md:max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6 ${isAdminNight ? 'bg-[#111]' : 'bg-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 rounded-full bg-current/20 mx-auto mb-5 md:hidden" />
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold">{viewBriefAccount.company}</h2>
                                <p className="text-xs opacity-40 mt-0.5">{viewBriefAccount.name} · {viewBriefAccount.briefFormType || 'Brief'}</p>
                            </div>
                            <button onClick={() => setViewBriefAccount(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm opacity-40 hover:opacity-100 hover:bg-current/10">✕</button>
                        </div>

                        {viewBriefAccount.briefResponses && Object.keys(viewBriefAccount.briefResponses).length > 0 ? (() => {
                            const template = briefTemplates.find(t => t.id === viewBriefAccount.briefFormType);
                            const questions = template?.questions || [];
                            const responses = viewBriefAccount.briefResponses as Record<string, string | string[]>;
                            return (
                                <div className="space-y-3">
                                    {Object.entries(responses).map(([key, value]) => {
                                        const question = questions.find(q => q.id === key);
                                        const label = question?.question || key.replace(/_/g, ' ');
                                        const displayValue = Array.isArray(value) ? value.join(', ') : value;
                                        if (!displayValue) return null;
                                        return (
                                            <div key={key} className={`p-4 rounded-xl ${isAdminNight ? 'bg-white/5' : 'bg-black/[0.03]'}`}>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1.5">{label}</p>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayValue}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })() : (
                            <div className="text-center py-12 opacity-40">
                                <p className="text-4xl mb-3">📭</p>
                                <p className="text-sm">Henüz cevap yok</p>
                            </div>
                        )}

                        {viewBriefAccount.briefSubmittedAt && (
                            <p className="text-xs opacity-30 text-center mt-6">
                                Gönderim: {new Date(viewBriefAccount.briefSubmittedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
