import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Dimensions,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { logout, apiRequest } from '../lib/auth';
import { registerForPushNotifications } from '../lib/notifications';
import { useCache } from '../lib/useCache';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface DashboardStats {
    totalAccounts: number;
    totalProjects: number;
    pendingBriefs: number;
    activeBriefs: number;
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    pendingPayments: number;
}

interface ActivityItem {
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
    accountName: string;
}

export default function AdminDashboardScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalAccounts: 0,
        totalProjects: 0,
        pendingBriefs: 0,
        activeBriefs: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0,
        pendingPayments: 0,
    });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

    // SWR cache — show cached data instantly, refresh in background
    const setCacheData = useCallback((data: { stats: DashboardStats; recentActivity: ActivityItem[] }) => {
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
    }, []);
    const { loadCache, saveCache } = useCache<{ stats: DashboardStats; recentActivity: ActivityItem[] }>(
        'admin_dashboard_v1', setCacheData, setLoading
    );

    useEffect(() => { loadCache(); }, [loadCache]);

    const loadDashboard = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: { stats: DashboardStats; recentActivity: ActivityItem[] } }>(
                '/api/mobile/dashboard'
            );
            if (result.success && result.data?.data) {
                setStats(result.data.data.stats);
                setRecentActivity(result.data.data.recentActivity || []);
                saveCache(result.data.data);
            }
        } catch (error) {
            console.log('Dashboard fetch failed');
        } finally {
            setLoading(false);
        }
    }, [saveCache]);

    useEffect(() => {
        loadDashboard();
        // Register for push notifications
        registerForPushNotifications().catch(console.error);
    }, [loadDashboard]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert('', 'Çıkış yapmak istiyor musunuz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    navigation.replace('Welcome');
                },
            },
        ]);
    };

    const formatCurrency = (value: number): string => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(0);
    };

    const formatActivityTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffHours < 1) return 'az önce';
        if (diffHours < 24) return `${diffHours}s`;
        if (diffDays < 7) return `${diffDays}g`;
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Fixed Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <View style={styles.brand}>
                        <View style={styles.brandDot} />
                        <Text style={styles.brandText}>alpgraphics</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.logoutText}>Çıkış</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : (
                    <>
                        {/* Hero Stats Section */}
                        <View style={styles.heroSection}>
                            <Text style={styles.heroLabel}>TOPLAM GELİR</Text>
                            <View style={styles.heroRow}>
                                <Text style={styles.heroCurrency}>₺</Text>
                                <Text style={styles.heroValue}>{formatCurrency(stats.totalRevenue)}</Text>
                            </View>
                            <View style={styles.heroLine} />
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.totalAccounts}</Text>
                                <Text style={styles.statLabel}>Hesap</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, styles.statAccent]}>{stats.pendingBriefs}</Text>
                                <Text style={styles.statLabel}>Bekleyen</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.totalProjects}</Text>
                                <Text style={styles.statLabel}>Proje</Text>
                            </View>
                        </View>

                        {/* Navigation Cards */}
                        <View style={styles.cardsSection}>
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('AdminAccounts')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.cardLeft}>
                                    <Text style={styles.cardTitle}>Müşteriler</Text>
                                    <Text style={styles.cardSub}>Hesap yönetimi</Text>
                                </View>
                                <Text style={styles.cardArrow}>→</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('AdminBriefs')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.cardLeft}>
                                    <Text style={styles.cardTitle}>Briefler</Text>
                                    <Text style={styles.cardSub}>İncele ve onayla</Text>
                                </View>
                                {stats.pendingBriefs > 0 && (
                                    <View style={styles.cardBadge}>
                                        <Text style={styles.cardBadgeText}>{stats.pendingBriefs}</Text>
                                    </View>
                                )}
                                <Text style={styles.cardArrow}>→</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('AdminFinance')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.cardLeft}>
                                    <Text style={styles.cardTitle}>Finans</Text>
                                    <Text style={styles.cardSub}>Gelir ve gider</Text>
                                </View>
                                <Text style={styles.cardArrow}>→</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('AdminProposals')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.cardLeft}>
                                    <Text style={styles.cardTitle}>Teklifler</Text>
                                    <Text style={styles.cardSub}>Oluştur ve PDF al</Text>
                                </View>
                                <Text style={styles.cardArrow}>→</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('AdminProjects')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.cardLeft}>
                                    <Text style={styles.cardTitle}>Projeler</Text>
                                    <Text style={styles.cardSub}>Durum ve ilerleme</Text>
                                </View>
                                <Text style={styles.cardArrow}>→</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('AdminMessages')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.cardLeft}>
                                    <Text style={styles.cardTitle}>Mesajlar</Text>
                                    <Text style={styles.cardSub}>Müşterilerle iletişim</Text>
                                </View>
                                <Text style={styles.cardArrow}>→</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => navigation.navigate('Planner')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.cardLeft}>
                                    <Text style={styles.cardTitle}>Planlayıcı</Text>
                                    <Text style={styles.cardSub}>Günlük görev listesi</Text>
                                </View>
                                <Text style={styles.cardArrow}>→</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Activity Section */}
                        <View style={styles.activitySection}>
                            <Text style={styles.sectionTitle}>Son Hareketler</Text>

                            {recentActivity.length === 0 ? (
                                <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center', padding: SPACING.md }}>
                                    Henüz hareket yok
                                </Text>
                            ) : (
                                recentActivity.map((item, index) => (
                                    <View key={item.id || index} style={styles.activityRow}>
                                        <View style={styles.activityDot} />
                                        <Text style={styles.activityText}>
                                            {item.accountName} — {item.type === 'Payment' ? 'Ödeme' : 'Borç'} ₺{item.amount?.toLocaleString()}
                                        </Text>
                                        <Text style={styles.activityTime}>{formatActivityTime(item.date)}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}
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
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.sm,
    },
    brandText: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.black,
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    logoutText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.textMuted,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    heroSection: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl,
    },
    heroLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
        color: COLORS.textMuted,
        letterSpacing: 2,
        marginBottom: SPACING.sm,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    heroCurrency: {
        fontSize: FONTS.xl,
        fontWeight: FONTS.medium,
        color: COLORS.primary,
        marginRight: 4,
        marginTop: 8,
    },
    heroValue: {
        fontSize: 64,
        fontWeight: FONTS.black,
        color: COLORS.text,
        letterSpacing: -3,
        lineHeight: 70,
    },
    heroLine: {
        height: 3,
        backgroundColor: COLORS.primary,
        width: 48,
        marginTop: SPACING.md,
        borderRadius: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.divider,
    },
    statNumber: {
        fontSize: FONTS.xxl,
        fontWeight: FONTS.black,
        color: COLORS.text,
    },
    statAccent: {
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.medium,
        color: COLORS.textMuted,
        marginTop: 2,
        letterSpacing: 0.5,
    },
    cardsSection: {
        marginBottom: SPACING.xl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardLeft: {
        flex: 1,
    },
    cardTitle: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    cardSub: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    cardBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs,
        marginRight: SPACING.md,
    },
    cardBadgeText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
    },
    cardArrow: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.medium,
        color: COLORS.textMuted,
    },
    activitySection: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 2,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm + 2,
    },
    activityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.md,
    },
    activityText: {
        flex: 1,
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.text,
    },
    activityTime: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
});
