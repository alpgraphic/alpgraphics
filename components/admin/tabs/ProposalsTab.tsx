"use client";

import { ProposalsTabProps } from "./types";

export default function ProposalsTab({
    proposals, isAdminNight, searchQuery,
    setDeleteConfirm, setEditingProposal, setPrintingProposal
}: ProposalsTabProps) {
    return (
        <div className="grid gap-6">
            {proposals.length === 0 && <p className="opacity-40 text-center py-20">Henüz teklif bulunamadı.</p>}
            {proposals
                .filter(proposal => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return proposal.title.toLowerCase().includes(q) ||
                        proposal.clientName.toLowerCase().includes(q) ||
                        proposal.status.toLowerCase().includes(q);
                })
                .map(proposal => (
                    <div key={proposal.id} className={`p-6 rounded-xl border group transition-all ${isAdminNight ? 'bg-[#0a0a0a]/20 border-white/5' : 'bg-white/60 border-black/5'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg">{proposal.title}</h3>
                                    <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${proposal.status === 'Accepted' ? 'bg-green-500/10 text-green-500' :
                                        proposal.status === 'Sent' ? 'bg-blue-500/10 text-blue-500' :
                                            proposal.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                                                'bg-gray-500/10 text-gray-500'}`}>
                                        {proposal.status}
                                    </span>
                                </div>
                                <p className="opacity-60 text-sm mb-4">{proposal.clientName} • Geçerlilik: {proposal.validUntil}</p>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setEditingProposal(proposal)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isAdminNight ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => setPrintingProposal(proposal)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isAdminNight ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                        Yazdır
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm({ show: true, type: 'proposal', id: proposal.id, title: proposal.title })}
                                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Sil
                                    </button>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-2xl font-black text-[#a62932]">
                                    {proposal.currencySymbol || '₺'}{proposal.totalAmount?.toLocaleString('tr-TR') || '0'}
                                </p>
                                <p className="text-[10px] opacity-40 mt-1">{proposal.items?.length || 0} kalem</p>
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
}
