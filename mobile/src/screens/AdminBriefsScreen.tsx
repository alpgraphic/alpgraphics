import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';
import { useCache } from '../lib/useCache';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface Brief {
    id: string;
    company: string;
    name: string;
    type: string;
    status: 'none' | 'pending' | 'submitted' | 'approved';
    submittedAt?: string;
    briefFormType?: string;
    responses?: Record<string, string | string[]>;
}

export default function AdminBriefsScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [briefs, setBriefs] = useState<Brief[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // SWR cache
    const { loadCache, saveCache } = useCache<Brief[]>('admin_briefs_v1', setBriefs, setLoading);
    useEffect(() => { loadCache(); }, [loadCache]);

    const loadBriefs = useCallback(async () => {
        try {
            // Use accounts endpoint - briefs are part of accounts data
            const result = await apiRequest<{ data: any[] }>('/api/mobile/accounts');
            if (result.success && result.data?.data && Array.isArray(result.data.data)) {
                const briefsList: Brief[] = result.data.data
                    .filter((acc: any) => acc.briefStatus && acc.briefStatus !== 'none')
                    .map((acc: any) => ({
                        id: acc.id,
                        company: acc.company || acc.name,
                        name: acc.name,
                        type: acc.briefFormType || 'Genel',
                        status: acc.briefStatus,
                        submittedAt: acc.briefSubmittedAt,
                        briefFormType: acc.briefFormType,
                        responses: acc.briefResponses || undefined,
                    }));
                setBriefs(briefsList);
                saveCache(briefsList);
            }
        } catch (error) {
            console.log('Briefs fetch failed');
        } finally {
            setLoading(false);
        }
    }, [saveCache]);

    useEffect(() => {
        loadBriefs();
    }, [loadBriefs]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBriefs();
        setRefreshing(false);
    };

    const handleApprove = (id: string, company: string) => {
        Alert.alert(
            'Onayla',
            `${company} briefini onaylamak istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Onayla',
                    onPress: async () => {
                        try {
                            const result = await apiRequest(`/api/mobile/accounts`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    accountId: id,
                                    briefStatus: 'approved',
                                    briefApprovedAt: new Date().toISOString(),
                                }),
                            });
                            if (result.success) {
                                setBriefs(prev => prev.map(b =>
                                    b.id === id ? { ...b, status: 'approved' as const } : b
                                ));
                                Alert.alert('Başarılı', `${company} briefi onaylandı`);
                            } else {
                                Alert.alert('Hata', 'Onaylama başarısız');
                            }
                        } catch (error) {
                            Alert.alert('Hata', 'Bağlantı hatası');
                        }
                    },
                },
            ]
        );
    };

    const handleReject = (id: string, company: string) => {
        Alert.alert(
            'Reddet',
            `${company} briefini reddetmek istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Reddet',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await apiRequest(`/api/mobile/accounts`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    accountId: id,
                                    briefStatus: 'pending',
                                }),
                            });
                            if (result.success) {
                                setBriefs(prev => prev.map(b =>
                                    b.id === id ? { ...b, status: 'pending' as const } : b
                                ));
                                Alert.alert('Başarılı', `${company} briefi reddedildi`);
                            } else {
                                Alert.alert('Hata', 'Reddetme başarısız');
                            }
                        } catch (error) {
                            Alert.alert('Hata', 'Bağlantı hatası');
                        }
                    },
                },
            ]
        );
    };

    const handleViewDetails = (brief: Brief) => {
        setSelectedBrief(brief);
        setShowDetailModal(true);
    };

    const formatDate = (dateStr?: string): string | undefined => {
        if (!dateStr) return undefined;
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'submitted': return 'Inceleme Bekliyor';
            case 'approved': return 'Onaylandı';
            case 'pending': return 'Beklemede';
            default: return status;
        }
    };

    const pending = briefs.filter(b => b.status === 'submitted');
    const others = briefs.filter(b => b.status !== 'submitted');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Briefler</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {loading ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : briefs.length === 0 ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>Henüz brief yok</Text>
                    </View>
                ) : (
                    <>
                        {/* Pending Section */}
                        {pending.length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionLabel}>ONAY BEKLİYOR</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{pending.length}</Text>
                                    </View>
                                </View>

                                {pending.map(brief => (
                                    <View key={brief.id} style={styles.pendingCard}>
                                        <View style={styles.pendingHeader}>
                                            <View>
                                                <Text style={styles.pendingCompany}>{brief.company}</Text>
                                                <Text style={styles.pendingType}>{brief.type}</Text>
                                            </View>
                                            {brief.submittedAt && (
                                                <Text style={styles.pendingDate}>{formatDate(brief.submittedAt)}</Text>
                                            )}
                                        </View>
                                        <View style={styles.pendingActions}>
                                            <TouchableOpacity
                                                style={styles.viewBtn}
                                                onPress={() => handleViewDetails(brief)}
                                            >
                                                <Text style={styles.viewBtnText}>İncele</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.rejectBtn}
                                                onPress={() => handleReject(brief.id, brief.company)}
                                            >
                                                <Text style={styles.rejectBtnText}>Reddet</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.approveBtn}
                                                onPress={() => handleApprove(brief.id, brief.company)}
                                            >
                                                <Text style={styles.approveBtnText}>Onayla</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}

                        {/* Other Briefs */}
                        {others.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>TÜM BRİEFLER</Text>

                                {others.map(brief => (
                                    <TouchableOpacity
                                        key={brief.id}
                                        style={styles.card}
                                        activeOpacity={0.7}
                                        onPress={() => handleViewDetails(brief)}
                                    >
                                        <View style={styles.cardContent}>
                                            <Text style={styles.cardCompany}>{brief.company}</Text>
                                            <Text style={styles.cardType}>{brief.type}</Text>
                                        </View>
                                        <View style={styles.cardRight}>
                                            {brief.status === 'approved' && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: brief.status === 'approved' ? COLORS.success : COLORS.textMuted }
                                            ]} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal visible={showDetailModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        {selectedBrief && (
                            <>
                                <Text style={styles.modalTitle}>{selectedBrief.company}</Text>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Brief Tipi</Text>
                                    <Text style={styles.detailValue}>{selectedBrief.type}</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>Durum</Text>
                                    <Text style={[
                                        styles.detailValue,
                                        {
                                            color: selectedBrief.status === 'approved' ? COLORS.success
                                                : selectedBrief.status === 'submitted' ? COLORS.warning
                                                    : COLORS.textMuted
                                        }
                                    ]}>
                                        {getStatusLabel(selectedBrief.status)}
                                    </Text>
                                </View>

                                {selectedBrief.submittedAt && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Gönderim Tarihi</Text>
                                        <Text style={styles.detailValue}>{formatDate(selectedBrief.submittedAt)}</Text>
                                    </View>
                                )}

                                {/* Brief Responses */}
                                {selectedBrief.responses && Object.keys(selectedBrief.responses).length > 0 ? (
                                    <View style={{ marginTop: SPACING.sm }}>
                                        <Text style={[styles.detailLabel, { marginBottom: SPACING.md }]}>CEVAPLAR</Text>
                                        {Object.entries(selectedBrief.responses).map(([key, value]) => {
                                            const displayValue = Array.isArray(value) ? value.join(', ') : value;
                                            if (!displayValue) return null;
                                            return (
                                                <View key={key} style={styles.responseItem}>
                                                    <Text style={styles.responseKey}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                                    <Text style={styles.responseValue}>{displayValue}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <View style={[styles.detailSection, { borderBottomWidth: 0 }]}>
                                        <Text style={styles.noteText}>Henüz cevap gönderilmedi</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={() => setShowDetailModal(false)}
                                >
                                    <Text style={styles.closeBtnText}>Kapat</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
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
    scroll: {
        flex: 1,
        padding: SPACING.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
    },
    sectionLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 2,
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
    },
    badge: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        marginLeft: SPACING.sm,
        marginBottom: SPACING.md,
    },
    badgeText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
    },
    pendingCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.warningLight,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.warning,
    },
    pendingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    pendingCompany: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    pendingType: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    pendingDate: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
    pendingActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    viewBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.divider,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    viewBtnText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    rejectBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.errorLight,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    rejectBtnText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.error,
    },
    approveBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.success,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    approveBtnText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.textInverse,
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
    cardContent: {
        flex: 1,
    },
    cardCompany: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    cardType: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: SPACING.sm,
    },
    checkmark: {
        fontSize: FONTS.lg,
        color: COLORS.success,
        fontWeight: FONTS.bold,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
        marginBottom: SPACING.lg,
    },
    detailSection: {
        paddingBottom: SPACING.lg,
        marginBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 1,
        marginBottom: SPACING.sm,
    },
    detailValue: {
        fontSize: FONTS.md,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    noteText: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    responseItem: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    responseKey: {
        fontSize: FONTS.xs,
        fontWeight: '700' as any,
        color: COLORS.textMuted,
        letterSpacing: 1,
        marginBottom: 4,
    },
    responseValue: {
        fontSize: FONTS.sm,
        color: COLORS.text,
        lineHeight: 20,
    },
    closeBtn: {
        marginTop: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.textInverse,
    },
});
