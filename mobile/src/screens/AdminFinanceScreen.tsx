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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS, API_BASE_URL } from '../lib/constants';
import { apiRequest } from '../lib/auth';

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

export default function AdminFinanceScreen({ navigation }: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses'>('overview');
    const [rates, setRates] = useState({ USD: 34.85, EUR: 37.50 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        pending: 0,
    });

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
            const [txResult, dashResult] = await Promise.all([
                apiRequest<{ data: Transaction[] }>('/api/mobile/transactions'),
                apiRequest<{ data: { stats: any } }>('/api/mobile/dashboard'),
            ]);

            if (txResult.success && txResult.data?.data) {
                setTransactions(txResult.data.data);
            }

            if (dashResult.success && dashResult.data?.data?.stats) {
                const s = dashResult.data.data.stats;
                setStats({
                    revenue: s.totalRevenue || 0,
                    expenses: s.totalExpenses || 0,
                    profit: s.profit || 0,
                    pending: s.pendingPayments || 0,
                });
            }
        } catch (error) {
            console.log('Finance data fetch failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRates();
        loadFinanceData();
    }, [loadFinanceData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchRates(), loadFinanceData()]);
        setRefreshing(false);
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Finans</Text>
                <View style={{ width: 44 }} />
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
        paddingTop: 60,
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
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
});
