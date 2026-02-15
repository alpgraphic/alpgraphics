'use client';

import React, { useRef } from 'react';

interface ProposalItem {
    id?: number;
    title?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total?: number;
}

interface Proposal {
    id: number;
    title: string;
    clientName: string;
    date?: string;
    status: string;
    totalAmount: number;
    currency: string;
    currencySymbol?: string;
    taxRate?: number;
    validUntil: string;
    items: ProposalItem[];
    logoText?: string;
    logoSubtext?: string;
    logoUrl?: string;
    primaryColor?: string;
    attnText?: string;
    preparedForLabel?: string;
    projectLabel?: string;
    footerName?: string;
    footerTitle?: string;
    footerNote?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

interface ProposalPrintTemplateProps {
    proposal: Proposal;
    onClose: () => void;
}

export default function ProposalPrintTemplate({ proposal, onClose }: ProposalPrintTemplateProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const pc = proposal.primaryColor || '#a62932';
    const cs = proposal.currencySymbol || (proposal.currency === 'USD' ? '$' : proposal.currency === 'EUR' ? '€' : '₺');
    const taxRate = proposal.taxRate !== undefined ? proposal.taxRate : 20;

    const subtotal = proposal.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || proposal.totalAmount;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const fmt = (n: number) => `${cs}${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handlePrint = () => {
        const el = printRef.current;
        if (!el) return;
        const w = window.open('', '_blank');
        if (!w) return;

        w.document.write(`<!DOCTYPE html><html><head><title>Teklif - ${proposal.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;color:#0f172a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:0}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>${el.innerHTML}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Toolbar */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: pc + '15' }}>
                            <svg className="w-5 h-5" style={{ color: pc }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Teklif Onizleme</h3>
                            <p className="text-xs text-black/40">#{proposal.id} &bull; {proposal.clientName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint}
                            className="px-6 py-3 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                            style={{ background: pc }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Yazdir / PDF
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-black/5 rounded-xl transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Document Preview */}
                <div className="overflow-auto max-h-[calc(92vh-88px)] bg-gradient-to-b from-gray-100 to-gray-200 p-8 flex justify-center">
                    <div ref={printRef}>
                        <div style={{
                            width: '210mm', minHeight: '297mm', background: '#fff',
                            fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a',
                            position: 'relative', overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                        }}>
                            {/* Decorative top bar */}
                            <div style={{ height: '6px', background: `linear-gradient(90deg, ${pc}, ${pc}88, ${pc}44)` }} />

                            <div style={{ padding: '50px 60px 40px' }}>
                                {/* Header: Logo + Proposal Info */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {proposal.logoUrl ? (
                                            <img src={proposal.logoUrl} alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', color: '#0f172a' }}>
                                                    {proposal.logoText || 'alpgraphics'}
                                                </span>
                                                <span style={{ fontSize: '32px', fontWeight: 900, color: pc }}>.</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            display: 'inline-block', padding: '8px 20px', borderRadius: '8px',
                                            background: pc + '12', color: pc, fontSize: '11px', fontWeight: 800,
                                            textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px'
                                        }}>
                                            TEKLIF
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                            No: <span style={{ fontWeight: 600, color: '#0f172a' }}>#{proposal.id}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                                            Tarih: <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                                {proposal.date || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Client & Project Info Cards */}
                                <div style={{
                                    display: 'flex', gap: '24px', marginBottom: '40px',
                                    padding: '28px 32px', background: '#f8fafc', borderRadius: '16px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: pc, marginBottom: '8px' }}>
                                            {proposal.preparedForLabel || 'Hazirlanan'}
                                        </div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{proposal.clientName}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>{proposal.attnText || ''}</div>
                                    </div>
                                    <div style={{ width: '1px', background: '#e2e8f0' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: pc, marginBottom: '8px' }}>
                                            {proposal.projectLabel || 'Proje'}
                                        </div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{proposal.title}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Gecerlilik: {proposal.validUntil}</div>
                                    </div>
                                </div>

                                {/* Services Table */}
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: pc, marginBottom: '16px' }}>
                                        Hizmetler ve Teslimatlar
                                    </div>

                                    {/* Table Header */}
                                    <div style={{
                                        display: 'flex', padding: '14px 20px',
                                        background: pc, color: '#fff', borderRadius: '12px 12px 0 0',
                                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px'
                                    }}>
                                        <div style={{ flex: 3 }}>Hizmet</div>
                                        <div style={{ flex: 1, textAlign: 'center' }}>Adet</div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>Birim Fiyat</div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>Toplam</div>
                                    </div>

                                    {/* Table Rows */}
                                    {(proposal.items && proposal.items.length > 0) ? proposal.items.map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', padding: '18px 20px',
                                            borderBottom: '1px solid #f1f5f9',
                                            background: i % 2 === 0 ? '#fff' : '#fafbfc'
                                        }}>
                                            <div style={{ flex: 3 }}>
                                                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.title || item.description}</div>
                                                {item.title && item.description && (
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.description}</div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: '#64748b' }}>{item.quantity}</div>
                                            <div style={{ flex: 1, textAlign: 'right', fontSize: '14px', color: '#64748b' }}>{fmt(item.unitPrice)}</div>
                                            <div style={{ flex: 1, textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>{fmt(item.quantity * item.unitPrice)}</div>
                                        </div>
                                    )) : (
                                        <div style={{ padding: '24px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{proposal.title}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Proje kapsamindaki tum hizmetler</div>
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div style={{
                                        borderRadius: '0 0 12px 12px', overflow: 'hidden',
                                        border: '1px solid #f1f5f9', borderTop: 'none'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <div style={{ width: '320px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Ara Toplam</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{fmt(subtotal)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: '13px', color: '#64748b' }}>KDV (%{taxRate})</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{fmt(tax)}</span>
                                                </div>
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between', padding: '16px 20px',
                                                    background: `linear-gradient(135deg, ${pc}10, ${pc}05)`
                                                }}>
                                                    <span style={{ fontSize: '16px', fontWeight: 800 }}>GENEL TOPLAM</span>
                                                    <span style={{ fontSize: '20px', fontWeight: 900, color: pc }}>{fmt(total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {proposal.notes && (
                                    <div style={{
                                        padding: '20px 24px', background: '#fffbeb', borderRadius: '12px',
                                        border: '1px solid #fef3c7', marginBottom: '32px', fontSize: '13px',
                                        color: '#92400e', lineHeight: 1.6
                                    }}>
                                        <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Notlar & Kosullar
                                        </div>
                                        {proposal.notes}
                                    </div>
                                )}

                                {/* Validity */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '16px 24px', background: '#f0fdf4', borderRadius: '12px',
                                    border: '1px solid #dcfce7', marginBottom: '40px'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                    </svg>
                                    <div style={{ fontSize: '13px', color: '#166534' }}>
                                        Bu teklif <strong>{proposal.validUntil}</strong> tarihine kadar gecerlidir.
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '30px 60px', background: '#f8fafc',
                                borderTop: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>
                                            {proposal.footerName || 'Selin Alpa'}
                                        </div>
                                        <div style={{ width: '200px', height: '1px', background: '#cbd5e1', marginBottom: '8px' }} />
                                        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94a3b8' }}>
                                            {proposal.footerTitle || 'Yetkili Imza'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8', lineHeight: 1.8 }}>
                                        {proposal.footerNote && <div>{proposal.footerNote}</div>}
                                        {proposal.phone && <div>{proposal.phone}</div>}
                                        {proposal.email && <div>{proposal.email}</div>}
                                        <div style={{ fontWeight: 600, color: pc }}>
                                            {proposal.website || 'www.alpgraphics.net'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom accent bar */}
                            <div style={{ height: '4px', background: `linear-gradient(90deg, ${pc}44, ${pc}, ${pc}44)` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
