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
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { logout, apiRequest, isBiometricAvailable, authenticateWithBiometric } from '../lib/auth';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface BriefData {
    status: 'none' | 'pending' | 'submitted' | 'approved';
    formType?: string;
    submittedAt?: string;
}

interface Project {
    id: string;
    title: string;
    category: string;
    status: string;
    progress: number;
}

interface Transaction {
    id: string;
    type: 'Debt' | 'Payment';
    amount: number;
    description: string;
    date: string;
}

interface AccountData {
    name: string;
    company: string;
    balance: number;
    totalDebt: number;
    totalPaid: number;
}

export default function DashboardScreen({ navigation }: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [briefData, setBriefData] = useState<BriefData>({ status: 'pending' });
    const [projects, setProjects] = useState<Project[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [account, setAccount] = useState<AccountData | null>(null);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [briefResult, projectsResult, transResult, accountResult] = await Promise.all([
                apiRequest<{ data: BriefData }>('/api/mobile/briefs'),
                apiRequest<{ data: Project[] }>('/api/mobile/projects'),
                apiRequest<{ data: Transaction[] }>('/api/mobile/transactions'),
                apiRequest<{ data: AccountData }>('/api/mobile/accounts'),
            ]);

            if (briefResult.success && briefResult.data?.data) {
                setBriefData(briefResult.data.data);
            }
            if (projectsResult.success && projectsResult.data?.data) {
                setProjects(projectsResult.data.data);
            }
            if (transResult.success && transResult.data?.data) {
                setTransactions(transResult.data.data);
            }
            if (accountResult.success && accountResult.data?.data) {
                const accData = accountResult.data.data;
                // Handle single object (not array)
                if (!Array.isArray(accData)) {
                    setAccount(accData as any);
                }
            }
        } catch (error) {
            console.log('Dashboard data fetch failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        isBiometricAvailable().then(setBiometricEnabled);
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Çıkış',
            'Çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.replace('Login');
                    },
                },
            ]
        );
    };

    const handleBiometricAuth = async () => {
        const success = await authenticateWithBiometric();
        if (success) {
            Alert.alert('Başarılı', 'Kimlik doğrulandı!');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>alpgraphics</Text>
                    <Text style={styles.subtitle}>Müşteri Paneli</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Çıkış</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={[styles.statusIcon, getStatusStyle(briefData.status).iconBg]}>
                        <Text style={styles.statusIconText}>{getStatusIcon(briefData.status)}</Text>
                    </View>
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusTitle}>{getStatusTitle(briefData.status)}</Text>
                        <Text style={styles.statusDesc}>{getStatusDescription(briefData.status)}</Text>
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, getStatusStyle(briefData.status).dotBg]} />
                            <Text style={styles.statusBadgeText}>{getStatusLabel(briefData.status)}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Cards */}
                {briefData.status === 'pending' && (
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('BriefForm')}
                    >
                        <Text style={styles.actionIcon}>📝</Text>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Brief Formunu Doldur</Text>
                            <Text style={styles.actionDesc}>Projeniz için bilgileri girin</Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                )}

                {/* Account Balance */}
                {account && (
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceRow}>
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>Toplam Borç</Text>
                                <Text style={[styles.balanceValue, { color: COLORS.error || '#cf222e' }]}>
                                    ₺{(account.totalDebt || 0).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.balanceDivider} />
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>Ödenen</Text>
                                <Text style={[styles.balanceValue, { color: COLORS.success || '#1a7f37' }]}>
                                    ₺{(account.totalPaid || 0).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.balanceDivider} />
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>Bakiye</Text>
                                <Text style={[styles.balanceValue, { color: COLORS.primary }]}>
                                    ₺{(account.balance || 0).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Projects Section */}
                {projects.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Projelerim</Text>
                        {projects.map(project => (
                            <View key={project.id} style={styles.projectCard}>
                                <View style={styles.projectInfo}>
                                    <Text style={styles.projectTitle}>{project.title}</Text>
                                    <Text style={styles.projectCategory}>{project.category}</Text>
                                </View>
                                {project.progress > 0 && (
                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${Math.min(project.progress, 100)}%` }]} />
                                        </View>
                                        <Text style={styles.progressText}>{project.progress}%</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Son İşlemler</Text>
                        {transactions.slice(0, 5).map(tx => (
                            <View key={tx.id} style={styles.transactionRow}>
                                <View style={[styles.txDot, {
                                    backgroundColor: tx.type === 'Payment' ? (COLORS.success || '#1a7f37') : (COLORS.error || '#cf222e')
                                }]} />
                                <View style={styles.txInfo}>
                                    <Text style={styles.txDesc}>{tx.description || (tx.type === 'Payment' ? 'Ödeme' : 'Borç')}</Text>
                                    <Text style={styles.txDate}>
                                        {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                    </Text>
                                </View>
                                <Text style={[styles.txAmount, {
                                    color: tx.type === 'Payment' ? (COLORS.success || '#1a7f37') : (COLORS.error || '#cf222e')
                                }]}>
                                    {tx.type === 'Payment' ? '-' : '+'}₺{tx.amount.toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Info Cards */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Sonraki Adım</Text>
                        <Text style={styles.infoValue}>
                            {briefData.status === 'none' && 'Form bekleniyor'}
                            {briefData.status === 'pending' && 'Formu doldurun'}
                            {briefData.status === 'submitted' && 'İnceleniyor'}
                            {briefData.status === 'approved' && 'Proje başladı'}
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>İletişim</Text>
                        <Text style={[styles.infoValue, styles.infoValuePrimary]}>
                            hello@alpgraphics.com
                        </Text>
                    </View>
                </View>

                {/* Biometric Button */}
                {biometricEnabled && (
                    <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
                        <Text style={styles.biometricIcon}>🔐</Text>
                        <Text style={styles.biometricText}>Face ID / Touch ID ile Doğrula</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

// Helper functions
function getStatusIcon(status: string): string {
    switch (status) {
        case 'none': return '📄';
        case 'pending': return '📝';
        case 'submitted': return '⏳';
        case 'approved': return '✅';
        default: return '📋';
    }
}

function getStatusTitle(status: string): string {
    switch (status) {
        case 'none': return 'Form Bekleniyor';
        case 'pending': return 'Brief Formu';
        case 'submitted': return 'İnceleniyor';
        case 'approved': return 'Proje Başladı';
        default: return 'Durum';
    }
}

function getStatusDescription(status: string): string {
    switch (status) {
        case 'none': return 'Henüz size atanmış bir form bulunmuyor.';
        case 'pending': return 'Projeniz için brief formunu doldurun.';
        case 'submitted': return 'Brifiniz inceleniyor. En kısa sürede dönüş yapılacak.';
        case 'approved': return 'Brifiniz onaylandı. Proje süreci başladı!';
        default: return '';
    }
}

function getStatusLabel(status: string): string {
    switch (status) {
        case 'none': return 'Bekleniyor';
        case 'pending': return 'Doldurulacak';
        case 'submitted': return 'İnceleniyor';
        case 'approved': return 'Aktif';
        default: return status;
    }
}

function getStatusStyle(status: string): { iconBg: object; dotBg: object } {
    switch (status) {
        case 'none':
            return { iconBg: { backgroundColor: 'rgba(59, 130, 246, 0.1)' }, dotBg: { backgroundColor: COLORS.blue } };
        case 'pending':
            return { iconBg: { backgroundColor: 'rgba(166, 41, 50, 0.1)' }, dotBg: { backgroundColor: COLORS.primary } };
        case 'submitted':
            return { iconBg: { backgroundColor: 'rgba(234, 179, 8, 0.1)' }, dotBg: { backgroundColor: COLORS.warning } };
        case 'approved':
            return { iconBg: { backgroundColor: 'rgba(34, 197, 94, 0.1)' }, dotBg: { backgroundColor: COLORS.success } };
        default:
            return { iconBg: {}, dotBg: {} };
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 60,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    logo: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 10,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    logoutText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    statusCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        flexDirection: 'row',
        marginBottom: SPACING.md,
    },
    statusIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    statusIconText: {
        fontSize: 24,
    },
    statusInfo: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    statusDesc: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: SPACING.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    actionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    actionIcon: {
        fontSize: 28,
        marginRight: SPACING.md,
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    actionDesc: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    actionArrow: {
        fontSize: 20,
        color: COLORS.primary,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    infoCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    infoValuePrimary: {
        color: COLORS.primary,
    },
    biometricButton: {
        backgroundColor: COLORS.border,
        borderRadius: 12,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    biometricIcon: {
        fontSize: 20,
        marginRight: SPACING.sm,
    },
    biometricText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    // Balance card
    balanceCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceItem: {
        flex: 1,
        alignItems: 'center',
    },
    balanceDivider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.border,
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: COLORS.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 16,
        fontWeight: '900' as const,
    },
    // Section
    sectionContainer: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: COLORS.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        marginBottom: SPACING.sm,
    },
    // Project card
    projectCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    projectInfo: {
        marginBottom: SPACING.sm,
    },
    projectTitle: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: COLORS.text,
    },
    projectCategory: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        marginRight: SPACING.sm,
    },
    progressFill: {
        height: '100%' as any,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: COLORS.textMuted,
    },
    // Transaction
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.xs,
    },
    txDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.md,
    },
    txInfo: {
        flex: 1,
    },
    txDesc: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: COLORS.text,
    },
    txDate: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: '700' as const,
    },
});
