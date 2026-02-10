import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../lib/constants';
import { logout, apiRequest, isBiometricAvailable, authenticateWithBiometric } from '../lib/auth';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface BriefData {
    status: 'none' | 'pending' | 'submitted' | 'approved';
    formType?: string;
    submittedAt?: string;
}

export default function DashboardScreen({ navigation }: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [briefData, setBriefData] = useState<BriefData>({ status: 'pending' });
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    useEffect(() => {
        checkBiometric();
        loadData();
    }, []);

    const checkBiometric = async () => {
        const available = await isBiometricAvailable();
        setBiometricEnabled(available);
    };

    const loadData = async () => {
        const result = await apiRequest<{ data: BriefData }>('/api/mobile/briefs');
        if (result.success && result.data) {
            setBriefData(result.data.data || { status: 'pending' });
        }
    };

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
});
