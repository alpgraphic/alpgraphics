"use client";

import { FinanceTabProps } from "./types";

export default function FinanceTab({
    isAdminNight, exchangeRates, ratesLastUpdated,
    revenueVal, expenseVal, netProfit, expenses,
    setShowExpenseModal, setDeleteConfirm
}: FinanceTabProps) {
    return (
        <div className="space-y-8">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Ticker Tape - Live TCMB Rates */}
                <div className="flex gap-6 overflow-hidden whitespace-nowrap opacity-50 text-xs font-mono">
                    <span className="text-green-500">USD/TRY: {exchangeRates.USD.toFixed(2)}</span>
                    <span className="text-green-500">EUR/TRY: {exchangeRates.EUR.toFixed(2)}</span>
                    <span>GBP/TRY: {exchangeRates.GBP.toFixed(2)}</span>
                    {ratesLastUpdated && <span className="opacity-50">TCMB • {new Date(ratesLastUpdated).toLocaleDateString('tr-TR')}</span>}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${isAdminNight ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
                    >
                        + Gider Ekle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* P&L Summary */}
                <div className={`border p-8 rounded-xl ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Kâr & Zarar</h3>
                        <span className="text-xs opacity-30 font-mono">YTD {new Date().getFullYear()}</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span>Toplam Gelir</span>
                            <span className="text-green-500 font-bold">₺{revenueVal.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Toplam Gider</span>
                            <span className="text-red-500 font-bold">-₺{expenseVal.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="h-px bg-current/10 my-2"></div>
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>Net Kâr</span>
                            <span className={netProfit > 0 ? 'text-green-500' : 'text-red-500'}>₺{netProfit.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>

                {/* Expenses List */}
                <div className={`border p-8 rounded-xl ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Son Giderler</h3>
                        <button className="text-[10px] opacity-40 hover:opacity-100 uppercase font-bold">Tümünü Gör</button>
                    </div>
                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {expenses.length === 0 ? (
                            <div className="text-center py-8 opacity-50">
                                <div className="text-3xl mb-2">💸</div>
                                <p className="text-sm">Henüz gider kaydı yok</p>
                            </div>
                        ) : (
                            expenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center group py-2 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="font-bold text-sm">{exp.title}</p>
                                        <p className="text-[10px] opacity-40">{exp.category} • {exp.date}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-sm">{exp.amount} {exp.currency}</span>
                                        <button onClick={() => setDeleteConfirm({ show: true, type: 'expense', id: exp.id, title: exp.title })} className="opacity-0 group-hover:opacity-100 text-red-500 text-xs hover:bg-red-500/10 p-1 rounded transition-all">✕</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
