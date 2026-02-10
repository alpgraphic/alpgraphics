'use client';

import React, { useRef } from 'react';

interface ProposalItem {
    title: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Proposal {
    id: number;
    title: string;
    clientName: string;
    status: string;
    totalAmount: number;
    currency: string;
    validUntil: string;
    items: ProposalItem[];
    logoText?: string;
    primaryColor?: string;
}

interface ProposalPrintTemplateProps {
    proposal: Proposal;
    onClose: () => void;
}

export default function ProposalPrintTemplate({ proposal, onClose }: ProposalPrintTemplateProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const primaryColor = proposal.primaryColor || '#a62932';

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Teklif - ${proposal.title}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        color: #1a1a1a;
                        line-height: 1.6;
                        background: white;
                    }
                    
                    .proposal {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 60px;
                    }
                    
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 60px;
                        padding-bottom: 30px;
                        border-bottom: 2px solid ${primaryColor};
                    }
                    
                    .logo {
                        font-size: 28px;
                        font-weight: 900;
                        letter-spacing: -0.5px;
                    }
                    
                    .logo-dot {
                        color: ${primaryColor};
                    }
                    
                    .proposal-info {
                        text-align: right;
                    }
                    
                    .proposal-number {
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        opacity: 0.4;
                        margin-bottom: 4px;
                    }
                    
                    .proposal-date {
                        font-size: 13px;
                        opacity: 0.6;
                    }
                    
                    .title-section {
                        margin-bottom: 50px;
                    }
                    
                    .title {
                        font-size: 32px;
                        font-weight: 700;
                        margin-bottom: 10px;
                    }
                    
                    .client-name {
                        font-size: 16px;
                        opacity: 0.6;
                    }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 40px;
                    }
                    
                    .items-table th {
                        text-align: left;
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1.5px;
                        opacity: 0.4;
                        padding: 12px 0;
                        border-bottom: 1px solid rgba(0,0,0,0.1);
                    }
                    
                    .items-table th:last-child,
                    .items-table td:last-child {
                        text-align: right;
                    }
                    
                    .items-table td {
                        padding: 20px 0;
                        border-bottom: 1px solid rgba(0,0,0,0.05);
                        vertical-align: top;
                    }
                    
                    .item-title {
                        font-weight: 600;
                        font-size: 15px;
                        margin-bottom: 4px;
                    }
                    
                    .item-desc {
                        font-size: 13px;
                        opacity: 0.6;
                        max-width: 400px;
                    }
                    
                    .item-qty {
                        font-size: 14px;
                        opacity: 0.8;
                    }
                    
                    .item-price {
                        font-size: 14px;
                        font-weight: 500;
                    }
                    
                    .item-total {
                        font-size: 15px;
                        font-weight: 600;
                    }
                    
                    .totals {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 60px;
                    }
                    
                    .totals-box {
                        width: 280px;
                    }
                    
                    .totals-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        font-size: 14px;
                    }
                    
                    .totals-row.subtotal {
                        border-bottom: 1px solid rgba(0,0,0,0.1);
                    }
                    
                    .totals-row.total {
                        font-size: 20px;
                        font-weight: 700;
                        padding-top: 20px;
                        border-top: 2px solid ${primaryColor};
                        margin-top: 10px;
                    }
                    
                    .total-amount {
                        color: ${primaryColor};
                    }
                    
                    .validity {
                        background: rgba(0,0,0,0.03);
                        padding: 20px 30px;
                        border-radius: 12px;
                        margin-bottom: 40px;
                    }
                    
                    .validity-label {
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1.5px;
                        opacity: 0.4;
                        margin-bottom: 4px;
                    }
                    
                    .validity-date {
                        font-size: 15px;
                        font-weight: 600;
                    }
                    
                    .footer {
                        text-align: center;
                        padding-top: 40px;
                        border-top: 1px solid rgba(0,0,0,0.05);
                    }
                    
                    .footer-text {
                        font-size: 12px;
                        opacity: 0.4;
                    }
                    
                    .footer-brand {
                        font-weight: 700;
                        opacity: 0.6;
                        margin-top: 8px;
                    }
                    
                    @media print {
                        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        .proposal { padding: 40px; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const formatCurrency = (amount: number) => {
        const symbol = proposal.currency === 'USD' ? '$' : proposal.currency === 'EUR' ? '€' : '₺';
        return `${symbol}${amount.toLocaleString()}`;
    };

    const subtotal = proposal.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || proposal.totalAmount;
    const tax = subtotal * 0.20; // %20 KDV
    const total = subtotal + tax;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
                    <h3 className="font-bold text-lg">Teklif Önizleme</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-5 py-2.5 bg-[#a62932] text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-[#c4323d] transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Yazdır / PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Print Preview */}
                <div className="overflow-auto max-h-[calc(90vh-80px)] bg-gray-100 p-8">
                    <div ref={printRef} className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="proposal" style={{ padding: '60px' }}>
                            {/* Header */}
                            <div className="header" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '60px',
                                paddingBottom: '30px',
                                borderBottom: `2px solid ${primaryColor}`
                            }}>
                                <div className="logo" style={{ fontSize: '28px', fontWeight: 900 }}>
                                    {proposal.logoText || 'alpgraphics'}
                                    <span style={{ color: primaryColor }}>.</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.4, marginBottom: '4px' }}>
                                        Teklif No: #{proposal.id}
                                    </div>
                                    <div style={{ fontSize: '13px', opacity: 0.6 }}>
                                        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div style={{ marginBottom: '50px' }}>
                                <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '10px' }}>
                                    {proposal.title}
                                </h1>
                                <p style={{ fontSize: '16px', opacity: 0.6 }}>
                                    Hazırlayan: alpgraphics • Alıcı: {proposal.clientName}
                                </p>
                            </div>

                            {/* Items Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                            Hizmet
                                        </th>
                                        <th style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', width: '80px' }}>
                                            Adet
                                        </th>
                                        <th style={{ textAlign: 'right', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', width: '120px' }}>
                                            Birim Fiyat
                                        </th>
                                        <th style={{ textAlign: 'right', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', width: '120px' }}>
                                            Toplam
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(proposal.items && proposal.items.length > 0) ? proposal.items.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{item.title}</div>
                                                <div style={{ fontSize: '13px', opacity: 0.6, maxWidth: '400px' }}>{item.description}</div>
                                            </td>
                                            <td style={{ padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', verticalAlign: 'top' }}>
                                                <span style={{ fontSize: '14px', opacity: 0.8 }}>{item.quantity}</span>
                                            </td>
                                            <td style={{ padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', textAlign: 'right', verticalAlign: 'top' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatCurrency(item.unitPrice)}</span>
                                            </td>
                                            <td style={{ padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', textAlign: 'right', verticalAlign: 'top' }}>
                                                <span style={{ fontSize: '15px', fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice)}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td style={{ padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }} colSpan={4}>
                                                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{proposal.title}</div>
                                                <div style={{ fontSize: '13px', opacity: 0.6 }}>Proje kapsamındaki tüm hizmetler</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' }}>
                                <div style={{ width: '280px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '14px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                        <span style={{ opacity: 0.6 }}>Ara Toplam</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '14px' }}>
                                        <span style={{ opacity: 0.6 }}>KDV (%20)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', fontSize: '20px', fontWeight: 700, borderTop: `2px solid ${primaryColor}`, marginTop: '10px' }}>
                                        <span>Toplam</span>
                                        <span style={{ color: primaryColor }}>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Validity */}
                            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '20px 30px', borderRadius: '12px', marginBottom: '40px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.4, marginBottom: '4px' }}>
                                    Geçerlilik Tarihi
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 600 }}>
                                    Bu teklif {proposal.validUntil} tarihine kadar geçerlidir.
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ textAlign: 'center', paddingTop: '40px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '12px', opacity: 0.4 }}>
                                    Bu teklif profesyonel bir iş anlaşması teklifidir.
                                </div>
                                <div style={{ fontWeight: 700, opacity: 0.6, marginTop: '8px' }}>
                                    alpgraphics • www.alpgraphics.com
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
