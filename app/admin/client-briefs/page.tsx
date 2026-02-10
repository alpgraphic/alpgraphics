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

    const handleAssignBrief = async () => {
        if (!selectedAccountId || !selectedFormType) {
            alert('Lütfen müşteri ve form tipi seçin');
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

            alert(`✅ Brief formu ${selectedAccount?.company || 'müşteri'} için atandı!`);

            // Reset
            setSelectedAccountId('');
            setSelectedFormType('');
        } catch (error) {
            console.error('❌ Brief assignment error:', error);
            alert('❌ Brief ataması başarısız');
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
                                                    onClick={() => {
                                                        // Show brief responses
                                                        if (account.briefResponses) {
                                                            const responses = Object.entries(account.briefResponses)
                                                                .map(([key, value]) => {
                                                                    const val = Array.isArray(value) ? value.join(', ') : value;
                                                                    return `${key}: ${val}`;
                                                                })
                                                                .join('\n\n');
                                                            alert(`Brief Cevapları:\n\n${responses}`);
                                                        } else {
                                                            alert('Henüz cevap yok');
                                                        }
                                                    }}
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
            </main>
        </div>
    );
}
