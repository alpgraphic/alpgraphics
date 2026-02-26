"use client";

import { AccountsTabProps } from "./types";

export default function AccountsTab({
    accounts, isAdminNight, searchQuery, setDeleteConfirm,
    setEditCredAccountId, setEditCredUsername, setEditCredPassword,
    setHistoryAccountId, setShowHistoryModal,
    setSelectedAccountId, setTransType, setShowTransactionModal
}: AccountsTabProps) {
    return (
        <div className="space-y-6">
            <div className={`rounded-xl border overflow-hidden ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className={`text-[10px] uppercase font-bold tracking-widest ${isAdminNight ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'}`}>
                            <tr>
                                <th className="p-6">Müşteri / Şirket</th>
                                <th className="p-6">Durum</th>
                                <th className="p-6 text-right">Toplam Borç</th>
                                <th className="p-6 text-right">Toplam Ödenen</th>
                                <th className="p-6 text-right">Bakiye</th>
                                <th className="p-6 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts
                                .filter(account => {
                                    if (!searchQuery.trim()) return true;
                                    const q = searchQuery.toLowerCase();
                                    return account.name.toLowerCase().includes(q) ||
                                        account.company.toLowerCase().includes(q) ||
                                        account.email.toLowerCase().includes(q);
                                })
                                .map((account) => (
                                    <tr key={account.id} className={`border-b last:border-0 hover:bg-current/5 transition-colors ${isAdminNight ? 'border-white/5' : 'border-black/5'}`}>
                                        <td className="p-6">
                                            <h4 className="font-bold">{account.name}</h4>
                                            <p className="text-xs opacity-40">{account.company}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${account.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                {account.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right font-mono text-sm opacity-60">
                                            ₺{account.totalDebt.toLocaleString()}
                                        </td>
                                        <td className="p-6 text-right font-mono text-sm text-green-500">
                                            ₺{account.totalPaid.toLocaleString()}
                                        </td>
                                        <td className="p-6 text-right font-mono font-bold text-lg">
                                            <span className={account.balance > 0 ? 'text-red-500' : 'text-gray-500'}>
                                                ₺{account.balance.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditCredAccountId(String(account.id));
                                                    setEditCredUsername(account.username || '');
                                                    setEditCredPassword('');
                                                }}
                                                className="px-3 py-1 rounded border border-current/20 text-xs font-bold hover:bg-current/10 transition-colors"
                                                title="Kullanıcı adı / şifre değiştir"
                                            >
                                                🔑
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setHistoryAccountId(account.id);
                                                    setShowHistoryModal(true);
                                                }}
                                                className="px-3 py-1 rounded border border-current/20 text-xs font-bold hover:bg-current/10 transition-colors"
                                            >
                                                History
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedAccountId(account.id);
                                                    setTransType('Debt');
                                                    setShowTransactionModal(true);
                                                }}
                                                className="px-3 py-1 rounded bg-[#a62932] text-white text-xs font-bold hover:bg-[#a62932]/80 transition-colors"
                                            >
                                                + İşlem
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ show: true, type: 'account', id: account.id, title: account.name })}
                                                className="px-3 py-1 rounded border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            {accounts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center opacity-40 text-sm">
                                        Henüz hesap bulunamadı. Yeni müşteri ekleyerek başlayın.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
