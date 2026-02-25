import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    StatusBar,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCache } from '../lib/useCache';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProposalItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface Proposal {
    _id?: string;
    title: string;
    clientName: string;
    date: string;
    validUntil: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    currency: string;
    currencySymbol: string;
    taxRate: number;
    items: ProposalItem[];
    totalAmount: number;
    showKdv: boolean;
    useDirectTotal: boolean;
    notes: string;
    logoText: string;
}

const DEFAULT_PROPOSAL: Proposal = {
    title: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'draft',
    currency: 'TRY',
    currencySymbol: '₺',
    taxRate: 20,
    items: [{ id: 1, description: '', quantity: 1, unitPrice: 0, total: 0 }],
    totalAmount: 0,
    showKdv: true,
    useDirectTotal: false,
    notes: '',
    logoText: 'alpgraphics',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Taslak',
    sent: 'Gönderildi',
    accepted: 'Onaylandı',
    rejected: 'Reddedildi',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'rgba(0,0,0,0.06)', text: COLORS.textMuted },
    sent: { bg: COLORS.primaryLight, text: COLORS.primary },
    accepted: { bg: COLORS.successLight, text: COLORS.success },
    rejected: { bg: COLORS.errorLight, text: COLORS.error },
};

// ─── HTML PDF Template ────────────────────────────────────────────────────────

function generateProposalHtml(proposal: Proposal): string {
    const showKdv = proposal.showKdv !== false;
    const useDirectTotal = proposal.useDirectTotal === true;
    const allNoUnitPrice = proposal.items.length > 0 && proposal.items.every(i => i.unitPrice === 0);
    const hideBirim = useDirectTotal || allNoUnitPrice;
    const sym = proposal.currencySymbol || '₺';
    const taxRate = Number(proposal.taxRate) || 20;

    const subtotal = useDirectTotal
        ? Number(proposal.totalAmount) || 0
        : proposal.items.reduce((sum, i) =>
            sum + (i.unitPrice === 0 ? (Number(i.total) || 0) : i.quantity * i.unitPrice), 0);
    const tax = subtotal * (taxRate / 100);
    const total = showKdv ? subtotal + tax : subtotal;

    const fmtN = (n: number) =>
        `${sym}${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const itemRows = proposal.items.map(item => {
        const rowTotal = item.unitPrice === 0 ? (item.total || 0) : item.quantity * item.unitPrice;
        return `
        <tr>
          <td>${item.description || ''}</td>
          <td style="text-align:center;">${item.quantity}</td>
          ${!hideBirim ? `<td style="text-align:right;">${item.unitPrice === 0 ? '' : fmtN(item.unitPrice)}</td>` : ''}
          ${!useDirectTotal ? `<td style="text-align:right;">${fmtN(rowTotal)}</td>` : ''}
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=794" />
<style>
  /* width=794 → A4 kağıt genişliği (210mm @ 96dpi ≈ 794px)
     Telefonda da masaüstünde de aynı genişlikte render edilir. */
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 794px; }
  body { font-family: Arial, Helvetica, sans-serif; padding: 48px 56px; color: #1a1a1a; background: #fff; font-size: 14px; }
  .header { margin-bottom: 40px; border-bottom: 3px solid #a62932; padding-bottom: 24px; }
  .brand { font-size: 28px; font-weight: 900; color: #a62932; letter-spacing: -1px; }
  .brand-sub { font-size: 11px; letter-spacing: 2px; color: #999; text-transform: uppercase; margin-top: 4px; }
  .info-row { display: flex; gap: 32px; margin-bottom: 32px; flex-wrap: nowrap; }
  .info-block { min-width: 120px; }
  .info-label { font-size: 10px; letter-spacing: 1.5px; color: #999; text-transform: uppercase; margin-bottom: 4px; }
  .info-value { font-size: 15px; font-weight: 600; color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
  thead tr { border-bottom: 2px solid #1a1a1a; }
  th { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #666; padding: 10px 8px; text-align: left; font-weight: 600; }
  td { padding: 12px 8px; border-bottom: 1px solid #f0f0f0; font-size: 14px; vertical-align: top; word-wrap: break-word; }
  .totals { margin-top: 24px; margin-left: auto; width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #444; }
  .total-final { display: flex; justify-content: space-between; border-top: 2px solid #a62932; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 700; color: #a62932; }
  .notes-box { margin-top: 32px; padding: 16px 20px; background: #fafaf8; border-left: 3px solid #a62932; border-radius: 4px; }
  .notes-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #999; margin-bottom: 6px; }
  .notes-text { font-size: 13px; color: #555; line-height: 1.6; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">${proposal.logoText || 'alpgraphics'}</div>
    <div class="brand-sub">TEKLİF</div>
  </div>

  <div class="info-row">
    <div class="info-block">
      <div class="info-label">Firma Adı</div>
      <div class="info-value">${proposal.clientName || '—'}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Başlık</div>
      <div class="info-value">${proposal.title || '—'}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Tarih</div>
      <div class="info-value">${proposal.date || '—'}</div>
    </div>
    ${proposal.validUntil ? `
    <div class="info-block">
      <div class="info-label">Geçerlilik</div>
      <div class="info-value">${proposal.validUntil}</div>
    </div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Hizmet / Ürün</th>
        <th style="text-align:center;">Adet</th>
        ${!hideBirim ? '<th style="text-align:right;">Birim Fiyat</th>' : ''}
        ${!useDirectTotal ? '<th style="text-align:right;">Toplam</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Ara Toplam</span><span>${fmtN(subtotal)}</span></div>
    ${showKdv ? `<div class="total-row"><span>KDV (%${taxRate})</span><span>${fmtN(tax)}</span></div>` : ''}
    <div class="total-final"><span>TOPLAM</span><span>${fmtN(total)}</span></div>
  </div>

  ${proposal.notes ? `
  <div class="notes-box">
    <div class="notes-label">Notlar</div>
    <div class="notes-text">${proposal.notes}</div>
  </div>` : ''}
</body>
</html>`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminProposalsScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<'list' | 'edit'>('list');
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [editing, setEditing] = useState<Proposal>({ ...DEFAULT_PROPOSAL });
    const [isNew, setIsNew] = useState(true);

    // ── Data loading ──────────────────────────────────────────────────────────

    // SWR cache
    const { loadCache, saveCache } = useCache<Proposal[]>('admin_proposals_v1', setProposals, setLoading);
    useEffect(() => { loadCache(); }, [loadCache]);

    const loadProposals = useCallback(async () => {
        try {
            const result = await apiRequest<{ proposals: Proposal[] }>('/api/mobile/proposals');
            if (result.success && result.data?.proposals) {
                setProposals(result.data.proposals);
                saveCache(result.data.proposals);
            }
        } catch {
            Alert.alert('Hata', 'Teklifler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [saveCache]);

    useEffect(() => {
        loadProposals();
    }, [loadProposals]);

    // ── Computed values ───────────────────────────────────────────────────────

    const showKdv = editing.showKdv !== false;
    const useDirectTotal = editing.useDirectTotal === true;
    const taxRate = Number(editing.taxRate) || 20;
    const allNoUnitPrice = editing.items.length > 0 && editing.items.every(i => i.unitPrice === 0);
    const hideBirim = useDirectTotal || allNoUnitPrice;

    const eSubtotal = useDirectTotal
        ? Number(editing.totalAmount) || 0
        : editing.items.reduce((sum, i) =>
            sum + (i.unitPrice === 0 ? (Number(i.total) || 0) : i.quantity * i.unitPrice), 0);
    const eTax = eSubtotal * (taxRate / 100);
    const eTotal = showKdv ? eSubtotal + eTax : eSubtotal;

    const sym = editing.currencySymbol || '₺';
    const fmtN = (n: number) =>
        `${sym}${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // ── Proposal field helpers ────────────────────────────────────────────────

    const setField = <K extends keyof Proposal>(key: K, value: Proposal[K]) => {
        setEditing(prev => ({ ...prev, [key]: value }));
    };

    const setItem = (idx: number, field: keyof ProposalItem, rawValue: string | number) => {
        setEditing(prev => {
            const items = prev.items.map((item, i) => {
                if (i !== idx) return item;
                const updated = { ...item, [field]: rawValue };
                // Recalc total if qty or unitPrice changes
                if (field === 'quantity' || field === 'unitPrice') {
                    const qty = field === 'quantity' ? Number(rawValue) || 0 : item.quantity;
                    const up = field === 'unitPrice' ? Number(rawValue) || 0 : item.unitPrice;
                    if (up !== 0) updated.total = qty * up;
                }
                return updated;
            });
            return { ...prev, items };
        });
    };

    const addItem = () => {
        setEditing(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { id: Date.now() + Math.random(), description: '', quantity: 1, unitPrice: 0, total: 0 },
            ],
        }));
    };

    const removeItem = (idx: number) => {
        setEditing(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx),
        }));
    };

    // ── Currency toggle ───────────────────────────────────────────────────────

    const setCurrency = (currency: string) => {
        const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' };
        setEditing(prev => ({ ...prev, currency, currencySymbol: symbols[currency] || '₺' }));
    };

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!editing.title.trim()) {
            Alert.alert('Uyarı', 'Lütfen bir başlık girin');
            return;
        }
        if (!editing.useDirectTotal && editing.items.length === 0) {
            Alert.alert('Uyarı', 'En az bir kalem ekleyin');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...editing, totalAmount: eSubtotal };
            let result;
            if (isNew) {
                result = await apiRequest<{ proposal: Proposal }>('/api/mobile/proposals', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            } else {
                result = await apiRequest('/api/mobile/proposals', {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            }
            if (result.success) {
                if (isNew && (result.data as any)?.proposal?._id) {
                    setEditing(prev => ({ ...prev, _id: (result.data as any).proposal._id, totalAmount: eSubtotal }));
                    setIsNew(false);
                }
                await loadProposals();
                Alert.alert('Kaydedildi', 'Teklif başarıyla kaydedildi');
            } else {
                Alert.alert('Hata', result.error || 'Kaydedilemedi');
            }
        } catch {
            Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = () => {
        if (!editing._id) return;
        Alert.alert('Sil', 'Bu teklifi silmek istiyor musunuz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await apiRequest(`/api/mobile/proposals?id=${editing._id}`, {
                            method: 'DELETE',
                        });
                        if (result.success) {
                            await loadProposals();
                            setMode('list');
                        } else {
                            Alert.alert('Hata', result.error || 'Silinemedi');
                        }
                    } catch {
                        Alert.alert('Hata', 'Silme sırasında bir hata oluştu');
                    }
                },
            },
        ]);
    };

    // ── PDF ───────────────────────────────────────────────────────────────────

    const handleGeneratePdf = async () => {
        setGeneratingPdf(true);
        try {
            const html = generateProposalHtml({ ...editing, totalAmount: eSubtotal });
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `${editing.title || 'Teklif'} - PDF`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('PDF Oluşturuldu', uri);
            }
        } catch (e) {
            Alert.alert('Hata', 'PDF oluşturulamadı. expo-print ve expo-sharing yüklü olduğundan emin olun.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    // ── Open edit ─────────────────────────────────────────────────────────────

    const openNew = () => {
        setEditing({ ...DEFAULT_PROPOSAL, date: new Date().toISOString().split('T')[0] });
        setIsNew(true);
        setMode('edit');
    };

    const openEdit = (proposal: Proposal) => {
        setEditing({ ...proposal });
        setIsNew(false);
        setMode('edit');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LIST VIEW
    // ─────────────────────────────────────────────────────────────────────────

    if (mode === 'list') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.backBtn}>← Geri</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Teklifler</Text>
                    <TouchableOpacity onPress={openNew} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.headerAction}>+ Yeni</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : proposals.length === 0 ? (
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>Henüz teklif yok</Text>
                        <TouchableOpacity style={styles.createBtn} onPress={openNew}>
                            <Text style={styles.createBtnText}>İlk Teklifi Oluştur</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {proposals.map((p, idx) => {
                            const sc = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                            const subtot = p.useDirectTotal
                                ? (p.totalAmount || 0)
                                : (p.items || []).reduce((sum, i) =>
                                    sum + (i.unitPrice === 0 ? (i.total || 0) : i.quantity * i.unitPrice), 0);
                            const s = p.currencySymbol || '₺';
                            const kdv = p.showKdv !== false;
                            const tr = Number(p.taxRate) || 20;
                            const tot = kdv ? subtot * (1 + tr / 100) : subtot;
                            return (
                                <TouchableOpacity
                                    key={p._id || idx}
                                    style={styles.proposalCard}
                                    onPress={() => openEdit(p)}
                                    activeOpacity={0.65}
                                >
                                    <View style={styles.cardTop}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>
                                            {p.title || '(Başlıksız)'}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                                            <Text style={[styles.statusText, { color: sc.text }]}>
                                                {STATUS_LABELS[p.status] || p.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardClient} numberOfLines={1}>
                                        {p.clientName || '—'}
                                    </Text>
                                    <View style={styles.cardBottom}>
                                        <Text style={styles.cardDate}>{p.date || ''}</Text>
                                        <Text style={styles.cardTotal}>
                                            {s}{Number(tot).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EDIT VIEW
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Sticky Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity
                    onPress={() => setMode('list')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.backBtn}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {isNew ? 'Yeni Teklif' : 'Teklif Düzenle'}
                </Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    {saving
                        ? <ActivityIndicator size="small" color={COLORS.primary} />
                        : <Text style={styles.headerAction}>Kaydet</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.editContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Basic Info ──────────────────────────────────────────── */}
                <Text style={styles.sectionLabel}>TEMEL BİLGİLER</Text>
                <View style={styles.card}>
                    <FieldRow label="Başlık">
                        <TextInput
                            style={styles.input}
                            value={editing.title}
                            onChangeText={v => setField('title', v)}
                            placeholder="Teklif başlığı"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </FieldRow>
                    <FieldRow label="Firma Adı" last>
                        <TextInput
                            style={styles.input}
                            value={editing.clientName}
                            onChangeText={v => setField('clientName', v)}
                            placeholder="Müşteri firma adı"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </FieldRow>
                </View>

                <View style={styles.card}>
                    <FieldRow label="Tarih">
                        <TextInput
                            style={styles.input}
                            value={editing.date}
                            onChangeText={v => setField('date', v)}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="numbers-and-punctuation"
                        />
                    </FieldRow>
                    <FieldRow label="Geçerlilik" last>
                        <TextInput
                            style={styles.input}
                            value={editing.validUntil}
                            onChangeText={v => setField('validUntil', v)}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="numbers-and-punctuation"
                        />
                    </FieldRow>
                </View>

                {/* ── Currency & Tax ──────────────────────────────────────── */}
                <Text style={styles.sectionLabel}>PARA BİRİMİ & KDV</Text>
                <View style={styles.card}>
                    {/* Currency Selector */}
                    <FieldRow label="Para Birimi">
                        <View style={styles.segmentRow}>
                            {(['TRY', 'USD', 'EUR'] as const).map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.segmentBtn, editing.currency === c && styles.segmentBtnActive]}
                                    onPress={() => setCurrency(c)}
                                >
                                    <Text style={[styles.segmentText, editing.currency === c && styles.segmentTextActive]}>
                                        {c}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </FieldRow>

                    {/* KDV Rate + Toggle */}
                    <FieldRow label="KDV Oranı (%)">
                        <TextInput
                            style={[styles.input, !showKdv && styles.inputDisabled]}
                            value={String(editing.taxRate)}
                            onChangeText={v => setField('taxRate', Number(v) || 0)}
                            keyboardType="numeric"
                            editable={showKdv}
                        />
                    </FieldRow>
                    <FieldRow label="KDV Göster" last>
                        <Switch
                            value={showKdv}
                            onValueChange={v => setField('showKdv', v)}
                            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                            thumbColor={showKdv ? COLORS.primary : COLORS.textMuted}
                        />
                    </FieldRow>
                </View>

                {/* ── Items ──────────────────────────────────────────────── */}
                <View style={styles.itemsHeader}>
                    <Text style={styles.sectionLabel}>KALEMLER</Text>
                    <TouchableOpacity
                        style={[styles.toggleBtn, useDirectTotal && styles.toggleBtnActive]}
                        onPress={() => setField('useDirectTotal', !useDirectTotal)}
                    >
                        <Text style={[styles.toggleBtnText, useDirectTotal && styles.toggleBtnTextActive]}>
                            Tek Fiyat
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    {/* Column Headers */}
                    <View style={styles.itemColHeader}>
                        <Text style={[styles.colHeaderText, { flex: 3 }]}>Hizmet / Ürün</Text>
                        <Text style={[styles.colHeaderText, { width: 44, textAlign: 'center' }]}>Adet</Text>
                        {!hideBirim && (
                            <Text style={[styles.colHeaderText, { width: 72, textAlign: 'right' }]}>Birim</Text>
                        )}
                        {!useDirectTotal && (
                            <Text style={[styles.colHeaderText, { width: 72, textAlign: 'right' }]}>Toplam</Text>
                        )}
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Item Rows */}
                    {editing.items.map((item, idx) => (
                        <View key={item.id} style={styles.itemRow}>
                            <TextInput
                                style={[styles.itemInput, { flex: 3 }]}
                                value={item.description}
                                onChangeText={v => setItem(idx, 'description', v)}
                                placeholder="Açıklama"
                                placeholderTextColor={COLORS.textLight}
                                multiline
                            />
                            {/* Quantity — always visible */}
                            <TextInput
                                style={[styles.itemInput, { width: 44, textAlign: 'center' }]}
                                value={String(item.quantity)}
                                onChangeText={v => setItem(idx, 'quantity', Number(v) || 0)}
                                keyboardType="numeric"
                            />
                            {/* Birim Fiyat — hidden when hideBirim */}
                            {!hideBirim && (
                                <TextInput
                                    style={[styles.itemInput, { width: 72, textAlign: 'right' }]}
                                    value={item.unitPrice === 0 ? '' : String(item.unitPrice)}
                                    onChangeText={v => setItem(idx, 'unitPrice', v === '' ? 0 : Number(v) || 0)}
                                    keyboardType="numeric"
                                    placeholder="—"
                                    placeholderTextColor={COLORS.textLight}
                                />
                            )}
                            {/* Toplam — editable if unitPrice=0 or useDirectTotal hidden, else auto */}
                            {!useDirectTotal && (
                                item.unitPrice === 0
                                    ? <TextInput
                                        style={[styles.itemInput, { width: 72, textAlign: 'right' }]}
                                        value={item.total === 0 ? '' : String(item.total)}
                                        onChangeText={v => setItem(idx, 'total', v === '' ? 0 : Number(v) || 0)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                    : <Text style={[styles.itemCalc, { width: 72 }]}>
                                        {fmtN(item.quantity * item.unitPrice)}
                                    </Text>
                            )}
                            {/* Remove button */}
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() => removeItem(idx)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.removeBtnText}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Add Item */}
                    <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                        <Text style={styles.addItemText}>+ Kalem Ekle</Text>
                    </TouchableOpacity>

                    {/* Tek Fiyat — single total input */}
                    {useDirectTotal && (
                        <View style={styles.directTotalRow}>
                            <Text style={styles.directTotalLabel}>Tüm Kalemlerin Toplam Fiyatı</Text>
                            <TextInput
                                style={styles.directTotalInput}
                                value={editing.totalAmount === 0 ? '' : String(editing.totalAmount)}
                                onChangeText={v => setField('totalAmount', v === '' ? 0 : Number(v) || 0)}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>
                    )}
                </View>

                {/* ── Totals Summary ──────────────────────────────────────── */}
                <View style={styles.totalsCard}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Ara Toplam</Text>
                        <Text style={styles.totalValue}>{fmtN(eSubtotal)}</Text>
                    </View>
                    {showKdv && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>KDV (%{taxRate})</Text>
                            <Text style={styles.totalValue}>{fmtN(eTax)}</Text>
                        </View>
                    )}
                    <View style={[styles.totalRow, styles.totalRowFinal]}>
                        <Text style={styles.totalFinalLabel}>TOPLAM</Text>
                        <Text style={styles.totalFinalValue}>{fmtN(eTotal)}</Text>
                    </View>
                </View>

                {/* ── Status ──────────────────────────────────────────────── */}
                <Text style={styles.sectionLabel}>DURUM</Text>
                <View style={styles.card}>
                    <View style={styles.segmentRow}>
                        {(['draft', 'sent', 'accepted', 'rejected'] as const).map(s => {
                            const active = editing.status === s;
                            const sc = STATUS_COLORS[s];
                            return (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.statusBtn,
                                        active && { backgroundColor: sc.bg, borderColor: sc.text },
                                    ]}
                                    onPress={() => setField('status', s)}
                                >
                                    <Text style={[styles.statusBtnText, active && { color: sc.text }]}>
                                        {STATUS_LABELS[s]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Notes ───────────────────────────────────────────────── */}
                <Text style={styles.sectionLabel}>NOTLAR</Text>
                <View style={styles.card}>
                    <TextInput
                        style={[styles.input, styles.notesInput]}
                        value={editing.notes}
                        onChangeText={v => setField('notes', v)}
                        placeholder="Teklif notları veya ek bilgiler..."
                        placeholderTextColor={COLORS.textLight}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* ── Actions ─────────────────────────────────────────────── */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPrimary, saving && styles.actionBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.actionBtnTextLight}>Kaydet</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnSecondary, generatingPdf && styles.actionBtnDisabled]}
                        onPress={handleGeneratePdf}
                        disabled={generatingPdf}
                    >
                        {generatingPdf
                            ? <ActivityIndicator size="small" color={COLORS.primary} />
                            : <Text style={styles.actionBtnTextDark}>PDF Oluştur</Text>
                        }
                    </TouchableOpacity>
                </View>

                {!isNew && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                        <Text style={styles.deleteBtnText}>Teklifi Sil</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: insets.bottom + 32 }} />
            </ScrollView>
        </View>
    );
}

// ─── Small helper component ───────────────────────────────────────────────────

function FieldRow({
    label,
    last,
    children,
}: {
    label: string;
    last?: boolean;
    children: React.ReactNode;
}) {
    return (
        <View style={[fieldRowStyles.row, !last && fieldRowStyles.rowBorder]}>
            <Text style={fieldRowStyles.label}>{label}</Text>
            <View style={fieldRowStyles.control}>{children}</View>
        </View>
    );
}

const fieldRowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        minHeight: 48,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    label: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.textSecondary,
        width: 110,
    },
    control: {
        flex: 1,
        alignItems: 'flex-end',
    },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    backBtn: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.textMuted,
    },
    headerTitle: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        flex: 1,
        textAlign: 'center',
    },
    headerAction: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.primary,
    },
    scroll: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    emptyText: {
        fontSize: FONTS.base,
        color: COLORS.textMuted,
        marginBottom: SPACING.lg,
    },
    createBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
    },
    createBtnText: {
        color: '#fff',
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
    },

    // List
    listContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    proposalCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    cardTitle: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        flex: 1,
        marginRight: SPACING.sm,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        borderRadius: RADIUS.sm,
    },
    statusText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
    },
    cardClient: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardDate: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
    cardTotal: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.primary,
    },

    // Edit
    editContent: {
        padding: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 2,
        marginBottom: SPACING.sm,
        marginTop: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: SPACING.sm,
    },
    input: {
        fontSize: FONTS.base,
        color: COLORS.text,
        textAlign: 'right',
        flex: 1,
        paddingVertical: 4,
    },
    inputDisabled: {
        color: COLORS.textMuted,
    },
    notesInput: {
        textAlign: 'left',
        padding: SPACING.md,
        minHeight: 80,
    },
    segmentRow: {
        flexDirection: 'row',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        flexWrap: 'wrap',
    },
    segmentBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    segmentBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    segmentText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.textSecondary,
    },
    segmentTextActive: {
        color: '#fff',
    },
    statusBtn: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs + 2,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        marginBottom: SPACING.xs,
    },
    statusBtnText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.medium,
        color: COLORS.textSecondary,
    },

    // Items
    itemsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    toggleBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    toggleBtnText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
        color: COLORS.textSecondary,
    },
    toggleBtnTextActive: {
        color: '#fff',
    },
    itemColHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    colHeaderText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
        color: COLORS.textMuted,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        gap: 6,
    },
    itemInput: {
        fontSize: FONTS.sm,
        color: COLORS.text,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    itemCalc: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
    removeBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeBtnText: {
        fontSize: 20,
        color: COLORS.textMuted,
        lineHeight: 22,
    },
    addItemBtn: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
    },
    addItemText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.primary,
    },
    directTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.primaryLight,
    },
    directTotalLabel: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.primary,
        flex: 1,
    },
    directTotalInput: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.primary,
        textAlign: 'right',
        width: 120,
    },

    // Totals
    totalsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginTop: SPACING.sm,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.xs + 2,
    },
    totalLabel: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
    },
    totalValue: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.text,
    },
    totalRowFinal: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginTop: SPACING.xs,
        paddingTop: SPACING.sm,
    },
    totalFinalLabel: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    totalFinalValue: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.black,
        color: COLORS.primary,
    },

    // Actions
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnPrimary: {
        backgroundColor: COLORS.primary,
    },
    actionBtnSecondary: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    actionBtnDisabled: {
        opacity: 0.5,
    },
    actionBtnTextLight: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: '#fff',
    },
    actionBtnTextDark: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.primary,
    },
    deleteBtn: {
        marginTop: SPACING.sm,
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    deleteBtnText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.error,
    },
});
