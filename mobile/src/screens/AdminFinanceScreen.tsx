import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS, API_BASE_URL } from '../lib/constants';
import { apiRequest } from '../lib/auth';
import { useCache } from '../lib/useCache';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface Transaction {
    id: string;
    accountId: string;
    type: 'Debt' | 'Payment';
    amount: number;
    description: string;
    date: string;
    accountName?: string;
}

interface Account {
    id: string;
    name: string;
    company: string;
}

export default function AdminFinanceScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses'>('overview');
    const [rates, setRates] = useState({ USD: 34.85, EUR: 37.50 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [stats, setStats] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        pending: 0,
    });
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
    const [newTransactionType, setNewTransactionType] = useState<'Debt' | 'Payment'>('Payment');
    const [newTransactionAccountId, setNewTransactionAccountId] = useState('');
    const [newTransactionAmount, setNewTransactionAmount] = useState('');
    const [newTransactionDescription, setNewTransactionDescription] = useState('');
    const [newTransactionDate, setNewTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [submittingTransaction, setSubmittingTransaction] = useState(false);

    // SWR cache — show cached data instantly
    interface FinanceCacheData { transactions: Transaction[]; stats: { revenue: number; expenses: number; profit: number; pending: number }; accounts: Account[] }
    const setFinanceCacheData = useCallback((data: FinanceCacheData) => {
        setTransactions(data.transactions);
        setStats(data.stats);
        setAccounts(data.accounts);
    }, []);
    const { loadCache, saveCache } = useCache<FinanceCacheData>('admin_finance_v1', setFinanceCacheData, setLoading);
    useEffect(() => { loadCache(); }, [loadCache]);

    const fetchRates = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/exchange-rates`);
            const data = await res.json();
            if (data.rates) setRates(data.rates);
        } catch (e) {
            console.log('Rate fetch failed');
        }
    };

    const loadFinanceData = useCallback(async () => {
        try {
            const [txResult, dashResult, accountsResult] = await Promise.all([
                apiRequest<{ data: Transaction[] }>('/api/mobile/transactions'),
                apiRequest<{ data: { stats: any } }>('/api/mobile/dashboard'),
                apiRequest<{ data: Account[] }>('/api/mobile/accounts'),
            ]);

            const txData = (txResult.success && txResult.data?.data) ? txResult.data.data : [];
            setTransactions(txData);

            const statsData = { revenue: 0, expenses: 0, profit: 0, pending: 0 };
            if (dashResult.success && dashResult.data?.data?.stats) {
                const s = dashResult.data.data.stats;
                statsData.revenue = s.totalRevenue || 0;
                statsData.expenses = s.totalExpenses || 0;
                statsData.profit = s.profit || 0;
                statsData.pending = s.pendingPayments || 0;
            }
            setStats(statsData);

            const accData = (accountsResult.success && accountsResult.data?.data) ? (Array.isArray(accountsResult.data.data) ? accountsResult.data.data : []) : [];
            setAccounts(accData);

            saveCache({ transactions: txData, stats: statsData, accounts: accData });
        } catch (error) {
            console.log('Finance data fetch failed');
        } finally {
            setLoading(false);
        }
    }, [saveCache]);

    useEffect(() => {
        fetchRates();
        loadFinanceData();
    }, [loadFinanceData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchRates(), loadFinanceData()]);
        setRefreshing(false);
    };

    const handleAddTransactionPress = () => {
        setNewTransactionType('Payment');
        setNewTransactionAccountId('');
        setNewTransactionAmount('');
        setNewTransactionDescription('');
        setNewTransactionDate(new Date().toISOString().split('T')[0]);
        setShowAddTransactionModal(true);
    };

    const handleSubmitTransaction = async () => {
        if (!newTransactionAccountId || !newTransactionAmount) {
            Alert.alert('Hata', 'Hesap ve tutar gereklidir');
            return;
        }

        // Guard against stale/deleted account ID
        if (!accounts.find(a => a.id === newTransactionAccountId)) {
            Alert.alert('Hata', 'Seçili hesap bulunamadı, lütfen yenileyin');
            return;
        }

        const amount = parseFloat(newTransactionAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Hata', 'Geçerli bir tutar girin');
            return;
        }

        setSubmittingTransaction(true);
        try {
            const result = await apiRequest('/api/mobile/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    accountId: newTransactionAccountId,
                    type: newTransactionType,
                    amount,
                    description: newTransactionDescription.trim(),
                    date: newTransactionDate,
                }),
            });

            if (result.success) {
                Alert.alert('Başarılı', 'İşlem kaydedildi');
                setShowAddTransactionModal(false);
                await loadFinanceData();
            } else {
                Alert.alert('Hata', result.error || 'İşlem kaydedilemedi');
            }
        } catch (error) {
            Alert.alert('Hata', 'Bağlantı hatası');
        } finally {
            setSubmittingTransaction(false);
        }
    };

    // Derived data
    const payments = transactions.filter(t => t.type === 'Payment');
    const debts = transactions.filter(t => t.type === 'Debt');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Paid': return { bg: COLORS.successLight, text: COLORS.success };
            case 'Pending': return { bg: COLORS.warningLight, text: COLORS.warning };
            case 'Overdue': return { bg: COLORS.errorLight, text: COLORS.error };
            default: return { bg: COLORS.divider, text: COLORS.textMuted };
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Finans</Text>
                <TouchableOpacity onPress={handleAddTransactionPress} style={styles.addBtn}>
                    <Text style={styles.addText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Exchange Rates */}
            <View style={styles.ratesBar}>
                <View style={styles.rateItem}>
                    <Text style={styles.rateLabel}>USD</Text>
                    <Text style={styles.rateValue}>₺{rates.USD.toFixed(2)}</Text>
                </View>
                <View style={styles.rateDivider} />
                <View style={styles.rateItem}>
                    <Text style={styles.rateLabel}>EUR</Text>
                    <Text style={styles.rateValue}>₺{rates.EUR.toFixed(2)}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {(['overview', 'invoices', 'expenses'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'overview' ? 'Özet' : tab === 'invoices' ? 'Faturalar' : 'Giderler'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <>
                                <View style={styles.statRow}>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statLabel}>Gelir</Text>
                                        <Text style={[styles.statValue, { color: COLORS.success }]}>
                                            ₺{stats.revenue >= 1000 ? `${(stats.revenue / 1000).toFixed(0)}K` : stats.revenue.toFixed(0)}
                                        </Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statLabel}>Gider</Text>
                                        <Text style={[styles.statValue, { color: COLORS.error }]}>
                                            ₺{stats.expenses >= 1000 ? `${(stats.expenses / 1000).toFixed(0)}K` : stats.expenses.toFixed(0)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.profitCard}>
                                    <Text style={styles.profitLabel}>Net Kar</Text>
                                    <Text style={styles.profitValue}>₺{stats.profit.toLocaleString()}</Text>
                                </View>
                                <View style={styles.pendingCard}>
                                    <Text style={styles.pendingLabel}>Bekleyen Ödemeler</Text>
                                    <Text style={styles.pendingValue}>₺{stats.pending.toLocaleString()}</Text>
                                </View>
                            </>
                        )}

                        {activeTab === 'invoices' && (
                            <>
                                {payments.length === 0 ? (
                                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                                        <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>Henüz ödeme yok</Text>
                                    </View>
                                ) : (
                                    payments.map(tx => (
                                        <View key={tx.id} style={styles.invoiceCard}>
                                            <View style={styles.invoiceLeft}>
                                                <Text style={styles.invoiceClient}>{tx.description || 'Ödeme'}</Text>
                                                <Text style={styles.invoiceDate}>
                                                    {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </Text>
                                            </View>
                                            <View style={styles.invoiceRight}>
                                                <Text style={styles.invoiceAmount}>₺{tx.amount.toLocaleString()}</Text>
                                                <View style={[styles.invoiceStatus, { backgroundColor: COLORS.successLight }]}>
                                                    <Text style={[styles.invoiceStatusText, { color: COLORS.success }]}>Ödendi</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === 'expenses' && (
                            <>
                                {debts.length === 0 ? (
                                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                                        <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>Henüz gider yok</Text>
                                    </View>
                                ) : (
                                    debts.map(tx => (
                                        <View key={tx.id} style={styles.expenseCard}>
                                            <View>
                                                <Text style={styles.expenseTitle}>{tx.description || 'Borç'}</Text>
                                                <Text style={styles.expenseCategory}>
                                                    {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </Text>
                                            </View>
                                            <Text style={styles.expenseAmount}>-₺{tx.amount.toLocaleString()}</Text>
                                        </View>
                                    ))
                                )}
                            </>
                        )}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add Transaction Modal */}
            <Modal visible={showAddTransactionModal} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                        <TouchableWithoutFeedback accessible={false}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHandle} />
                                <Text style={styles.modalTitle}>Yeni İşlem</Text>

                                {/* Transaction Type Selector */}
                                <Text style={styles.inputLabel}>İŞLEM TİPİ</Text>
                                <View style={styles.typeSelector}>
                                    {(['Payment', 'Debt'] as const).map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.typeOption,
                                                newTransactionType === type && styles.typeOptionActive,
                                            ]}
                                            onPress={() => setNewTransactionType(type)}
                                        >
                                            <Text
                                                style={[
                                                    styles.typeOptionText,
                                                    newTransactionType === type && styles.typeOptionTextActive,
                                                ]}
                                            >
                                                {type === 'Payment' ? 'Ödeme' : 'Borç'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Account Selector */}
                                <Text style={styles.inputLabel}>HESAP</Text>
                                <ScrollView style={styles.accountList} nestedScrollEnabled>
                                    {accounts.length === 0 ? (
                                        <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted, padding: SPACING.md }}>
                                            Hesap yok
                                        </Text>
                                    ) : (
                                        accounts.map(account => (
                                            <TouchableOpacity
                                                key={account.id}
                                                style={[
                                                    styles.accountOption,
                                                    newTransactionAccountId === account.id && styles.accountOptionActive,
                                                ]}
                                                onPress={() => setNewTransactionAccountId(account.id)}
                                            >
                                                <View style={styles.accountOptionContent}>
                                                    <Text
                                                        style={[
                                                            styles.accountOptionName,
                                                            newTransactionAccountId === account.id && styles.accountOptionNameActive,
                                                        ]}
                                                    >
                                                        {account.company}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.accountOptionPerson,
                                                            newTransactionAccountId === account.id && styles.accountOptionPersonActive,
                                                        ]}
                                                    >
                                                        {account.name}
                                                    </Text>
                                                </View>
                                                {newTransactionAccountId === account.id && (
                                                    <Text style={{ fontSize: FONTS.md, color: COLORS.primary }}>✓</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </ScrollView>

                                {/* Amount Input */}
                                <Text style={styles.inputLabel}>TUTAR (₺)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1000"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newTransactionAmount}
                                    onChangeText={setNewTransactionAmount}
                                    keyboardType="decimal-pad"
                                />

                                {/* Description Input */}
                                <Text style={styles.inputLabel}>AÇIKLAMA</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Proje bedeli, ödeme vb."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newTransactionDescription}
                                    onChangeText={setNewTransactionDescription}
                                    multiline
                                    numberOfLines={3}
                                />

                                {/* Date Input */}
                                <Text style={styles.inputLabel}>TARİH</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newTransactionDate}
                                    onChangeText={setNewTransactionDate}
                                />

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setShowAddTransactionModal(false)}
                                        disabled={submittingTransaction}
                                    >
                                        <Text style={styles.cancelBtnText}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.submitBtn}
                                        onPress={handleSubmitTransaction}
                                        disabled={submittingTransaction}
                                    >
                                        {submittingTransaction ? (
                                            <ActivityIndicator color={COLORS.textInverse} size="small" />
                                        ) : (
                                            <Text style={styles.submitBtnText}>Kaydet</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        padding: SPACING.sm,
    },
    backText: {
        fontSize: FONTS.xl,
        color: COLORS.text,
    },
    title: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        fontSize: FONTS.xl,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
    },
    ratesBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.text,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
    },
    rateItem: {
        flex: 1,
        alignItems: 'center',
    },
    rateDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    rateLabel: {
        fontSize: FONTS.xs,
        color: 'rgba(255,255,255,0.5)',
    },
    rateValue: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: SPACING.sm,
    },
    tab: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.full,
    },
    tabActive: {
        backgroundColor: COLORS.text,
    },
    tabText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        color: COLORS.textInverse,
    },
    scroll: {
        flex: 1,
        padding: SPACING.lg,
    },
    statRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statLabel: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
    },
    statValue: {
        fontSize: FONTS.xxl,
        fontWeight: FONTS.black,
    },
    profitCard: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    profitLabel: {
        fontSize: FONTS.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    profitValue: {
        fontSize: FONTS.xxl,
        fontWeight: FONTS.black,
        color: COLORS.textInverse,
    },
    pendingCard: {
        backgroundColor: COLORS.warningLight,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.warning,
    },
    pendingLabel: {
        fontSize: FONTS.xs,
        color: COLORS.warning,
    },
    pendingValue: {
        fontSize: FONTS.xl,
        fontWeight: FONTS.bold,
        color: COLORS.warning,
    },
    invoiceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    invoiceLeft: {},
    invoiceClient: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    invoiceDate: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    invoiceRight: {
        alignItems: 'flex-end',
    },
    invoiceAmount: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    invoiceStatus: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
        marginTop: SPACING.xs,
    },
    invoiceStatusText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
    },
    expenseCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    expenseTitle: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    expenseCategory: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
    expenseAmount: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.error,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
        maxHeight: '90%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.divider,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: FONTS.xl,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    inputLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 1.5,
        marginBottom: SPACING.xs,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    typeOption: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.md,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        alignItems: 'center',
    },
    typeOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    typeOptionText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.textSecondary,
    },
    typeOptionTextActive: {
        color: COLORS.primary,
        fontWeight: FONTS.bold,
    },
    accountList: {
        maxHeight: 180,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    accountOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    accountOptionActive: {
        backgroundColor: COLORS.primaryLight,
    },
    accountOptionContent: {
        flex: 1,
    },
    accountOptionName: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    accountOptionNameActive: {
        color: COLORS.primary,
    },
    accountOptionPerson: {
        fontSize: FONTS.xs,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    accountOptionPersonActive: {
        color: COLORS.primary,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONTS.base,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.lg,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.divider,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    submitBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.textInverse,
    },
});
