import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Image, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';

type Props = NativeStackScreenProps<any, 'ProjectMilestones'>;

interface MilestoneAttachment {
    id: string; imageData: string; mimeType: string;
}
interface MilestoneDetail {
    id: string; title: string; description?: string;
    status: 'pending' | 'completed'; order: number;
    attachments: MilestoneAttachment[];
    feedback: Record<string, 'liked' | 'disliked'>;
    completedAt?: string;
    hasAttachments?: boolean; attachmentCount?: number;
}

export default function ProjectMilestonesScreen({ route, navigation }: Props) {
    const { projectId, projectTitle } = route.params ?? {};
    const insets = useSafeAreaInsets();
    const [milestones, setMilestones] = useState<MilestoneDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Which milestone's images are expanded
    const [expandedId, setExpandedId] = useState<string | null>(null);
    // Track local feedback state (optimistic update)
    const [localFeedback, setLocalFeedback] = useState<Record<string, Record<string, 'liked' | 'disliked'>>>({});
    // Which milestones have their images loaded
    const [imageData, setImageData] = useState<Record<string, MilestoneAttachment[]>>({});
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

    const loadMilestones = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: MilestoneDetail[] }>(
                `/api/mobile/milestones?projectId=${projectId}`
            );
            if (result.success && result.data?.data) {
                setMilestones(result.data.data);
            }
        } catch { console.log('Milestones load failed'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [projectId]);

    useEffect(() => { loadMilestones(); }, [loadMilestones]);
    const onRefresh = () => { setRefreshing(true); loadMilestones(); };

    // Load full image data for a milestone (lazy)
    const loadImages = useCallback(async (milestoneId: string) => {
        if (imageData[milestoneId] || loadingImages.has(milestoneId)) return;
        setLoadingImages(prev => new Set(prev).add(milestoneId));
        try {
            const result = await apiRequest<{ data: MilestoneDetail }>(
                `/api/mobile/milestones?milestoneId=${milestoneId}`
            );
            if (result.success && result.data?.data?.attachments) {
                setImageData(prev => ({ ...prev, [milestoneId]: result.data!.data.attachments }));
            }
        } catch { }
        finally {
            setLoadingImages(prev => { const s = new Set(prev); s.delete(milestoneId); return s; });
        }
    }, [imageData, loadingImages]);

    const toggleExpand = (ms: MilestoneDetail) => {
        if (expandedId === ms.id) { setExpandedId(null); return; }
        setExpandedId(ms.id);
        if (ms.hasAttachments || (ms.attachments && ms.attachments.length > 0)) {
            loadImages(ms.id);
        }
    };

    // Submit feedback
    const submitFeedback = async (milestoneId: string, attachmentId: string, feedback: 'liked' | 'disliked') => {
        // Optimistic update
        setLocalFeedback(prev => ({
            ...prev,
            [milestoneId]: { ...(prev[milestoneId] ?? {}), [attachmentId]: feedback },
        }));
        try {
            await apiRequest('/api/mobile/milestones/feedback', {
                method: 'POST',
                body: JSON.stringify({ milestoneId, attachmentId, feedback }),
            });
        } catch {
            Alert.alert('Hata', 'Geri bildirim kaydedilemedi');
        }
    };

    const getFeedback = (milestoneId: string, attachmentId: string): 'liked' | 'disliked' | null => {
        return localFeedback[milestoneId]?.[attachmentId]
            ?? milestones.find(m => m.id === milestoneId)?.feedback?.[attachmentId]
            ?? null;
    };

    const completedCount = milestones.filter(m => m.status === 'completed').length;
    const totalCount = milestones.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{projectTitle ?? 'Süreç'}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

                {/* Progress Summary */}
                {totalCount > 0 && (
                    <View style={styles.progressCard}>
                        <View style={styles.progressTop}>
                            <Text style={styles.progressTitle}>Proje İlerlemesi</Text>
                            <Text style={styles.progressPct}>{progress}%</Text>
                        </View>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressSub}>{completedCount} / {totalCount} adım tamamlandı</Text>
                    </View>
                )}

                {loading ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : milestones.length === 0 ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <Text style={styles.emptyText}>Henüz bir süreç adımı eklenmedi.</Text>
                    </View>
                ) : milestones.map((ms, idx) => {
                    const isExpanded = expandedId === ms.id;
                    const images = imageData[ms.id] ?? [];
                    const isLoadingImg = loadingImages.has(ms.id);
                    const attachCount = ms.attachmentCount ?? ms.attachments?.length ?? 0;

                    return (
                        <View key={ms.id} style={styles.msRow}>
                            {/* Timeline */}
                            <View style={styles.timeline}>
                                <View style={[styles.dot, { backgroundColor: ms.status === 'completed' ? COLORS.success : COLORS.border }]}>
                                    {ms.status === 'completed'
                                        ? <Text style={styles.dotCheck}>✓</Text>
                                        : <Text style={styles.dotNum}>{idx + 1}</Text>}
                                </View>
                                {idx < milestones.length - 1 && <View style={styles.line} />}
                            </View>

                            {/* Card */}
                            <TouchableOpacity
                                style={[styles.msCard, ms.status === 'pending' && styles.msCardPending]}
                                activeOpacity={0.85}
                                onPress={() => ms.status === 'completed' ? toggleExpand(ms) : null}
                                disabled={ms.status === 'pending'}
                            >
                                <View style={styles.msCardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.msTitle, ms.status === 'pending' && styles.msTitlePending]}>
                                            {ms.title}
                                        </Text>
                                        {ms.description ? (
                                            <Text style={styles.msDesc}>{ms.description}</Text>
                                        ) : null}
                                        {ms.completedAt ? (
                                            <Text style={styles.msDate}>
                                                {new Date(ms.completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {ms.status === 'completed' && attachCount > 0 && (
                                        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                                    )}
                                    {ms.status === 'pending' && (
                                        <View style={styles.pendingBadge}>
                                            <Text style={styles.pendingBadgeText}>Bekliyor</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Images + Feedback */}
                                {isExpanded && ms.status === 'completed' && (
                                    <View style={styles.attachSection}>
                                        {isLoadingImg ? (
                                            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
                                        ) : images.length === 0 ? (
                                            <Text style={styles.noImages}>Bu adımda görsel yok.</Text>
                                        ) : images.map(att => {
                                            const fb = getFeedback(ms.id, att.id);
                                            return (
                                                <View key={att.id} style={styles.attachCard}>
                                                    <Image
                                                        source={{ uri: `data:${att.mimeType};base64,${att.imageData}` }}
                                                        style={styles.attachImg}
                                                        resizeMode="contain"
                                                    />
                                                    <View style={styles.fbRow}>
                                                        <TouchableOpacity
                                                            style={[styles.fbBtn, fb === 'liked' && styles.fbBtnActive]}
                                                            onPress={() => submitFeedback(ms.id, att.id, 'liked')}
                                                        >
                                                            <Text style={styles.fbEmoji}>👍</Text>
                                                            <Text style={[styles.fbLabel, fb === 'liked' && styles.fbLabelActive]}>Beğendim</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[styles.fbBtn, fb === 'disliked' && styles.fbBtnDisliked]}
                                                            onPress={() => submitFeedback(ms.id, att.id, 'disliked')}
                                                        >
                                                            <Text style={styles.fbEmoji}>👎</Text>
                                                            <Text style={[styles.fbLabel, fb === 'disliked' && styles.fbLabelDisliked]}>Beğenmedim</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    );
                })}

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { padding: SPACING.sm },
    backText: { fontSize: FONTS.base, fontWeight: FONTS.medium as any, color: COLORS.text },
    headerTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold as any, color: COLORS.text, flex: 1, textAlign: 'center' },
    scroll: { flex: 1 },
    // Progress card
    progressCard: { margin: SPACING.lg, padding: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    progressTitle: { fontSize: FONTS.base, fontWeight: FONTS.bold as any, color: COLORS.text },
    progressPct: { fontSize: FONTS.lg, fontWeight: FONTS.bold as any, color: COLORS.primary },
    progressBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.sm },
    progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
    progressSub: { fontSize: FONTS.xs, color: COLORS.textMuted },
    // Milestone row
    msRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
    timeline: { alignItems: 'center', width: 28, marginRight: SPACING.sm, marginTop: SPACING.md },
    dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    dotCheck: { fontSize: 12, color: '#fff', fontWeight: '700' },
    dotNum: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
    line: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 2 },
    // Milestone card
    msCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    msCardPending: { opacity: 0.6 },
    msCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
    msTitle: { fontSize: FONTS.sm, fontWeight: FONTS.semibold as any, color: COLORS.text, marginBottom: 2 },
    msTitlePending: { color: COLORS.textSecondary },
    msDesc: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 2 },
    msDate: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 4 },
    chevron: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    pendingBadge: { backgroundColor: COLORS.divider, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
    pendingBadgeText: { fontSize: FONTS.xs, color: COLORS.textMuted },
    emptyText: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center' },
    // Attachments
    attachSection: { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
    noImages: { fontSize: FONTS.xs, color: COLORS.textMuted, fontStyle: 'italic' },
    attachCard: { marginBottom: SPACING.lg },
    attachImg: { width: '100%', height: 220, borderRadius: RADIUS.md, backgroundColor: COLORS.background },
    fbRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    fbBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.background },
    fbBtnActive: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
    fbBtnDisliked: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
    fbEmoji: { fontSize: 16 },
    fbLabel: { fontSize: FONTS.xs, fontWeight: FONTS.semibold as any, color: COLORS.textSecondary },
    fbLabelActive: { color: COLORS.success },
    fbLabelDisliked: { color: COLORS.error },
});
