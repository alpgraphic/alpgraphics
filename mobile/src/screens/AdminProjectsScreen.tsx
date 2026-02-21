import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    RefreshControl, Alert, Modal, TextInput, ActivityIndicator,
    Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView,
    Platform, Image, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';

type Props = { navigation: NativeStackNavigationProp<any> };

interface Project {
    id: string; title: string; client: string; category: string;
    status: 'active' | 'completed' | 'paused' | 'cancelled'; progress: number;
    linkedAccountId?: string;
}

interface Milestone {
    id: string; projectId: string; title: string; description?: string;
    status: 'pending' | 'completed'; order: number;
    hasAttachments: boolean; attachmentCount: number; attachmentIds: string[];
    feedback: Record<string, 'liked' | 'disliked'>; completedAt?: string;
}

interface AttachmentWithData { id: string; imageData: string; mimeType: string; uri: string }

export default function AdminProjectsScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);

    // ── Project Detail Modal ──────────────────────────────────────────────────
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editStatus, setEditStatus] = useState<Project['status']>('active');
    const [editProgress, setEditProgress] = useState('0');
    const [submitting, setSubmitting] = useState(false);

    // ── Milestones ────────────────────────────────────────────────────────────
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [milestonesLoading, setMilestonesLoading] = useState(false);
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
    const [addingMilestone, setAddingMilestone] = useState(false);

    // ── Complete Milestone Modal ───────────────────────────────────────────────
    const [completingMilestone, setCompletingMilestone] = useState<Milestone | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [pickedImages, setPickedImages] = useState<AttachmentWithData[]>([]);
    const [completing, setCompleting] = useState(false);

    const loadProjects = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: Project[] }>('/api/mobile/projects');
            if (result.success && result.data?.data) {
                setProjects(Array.isArray(result.data.data) ? result.data.data : []);
            }
        } catch { console.log('Projects fetch failed'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadProjects(); }, [loadProjects]);
    const onRefresh = async () => { setRefreshing(true); await loadProjects(); setRefreshing(false); };

    const loadMilestones = useCallback(async (projectId: string) => {
        setMilestonesLoading(true);
        try {
            const result = await apiRequest<{ data: Milestone[] }>(
                `/api/mobile/milestones?projectId=${projectId}`
            );
            if (result.success && result.data?.data) {
                setMilestones(result.data.data);
            }
        } catch { console.log('Milestones fetch failed'); }
        finally { setMilestonesLoading(false); }
    }, []);

    const openProject = (project: Project) => {
        setSelectedProject(project);
        setEditStatus(project.status);
        setEditProgress(project.progress.toString());
        setMilestones([]);
        setShowProjectModal(true);
        loadMilestones(project.id);
    };

    // ── Save project status/progress ──────────────────────────────────────────
    const handleSaveProject = async () => {
        if (!selectedProject) return;
        const progress = parseInt(editProgress, 10);
        if (isNaN(progress) || progress < 0 || progress > 100) {
            Alert.alert('Hata', 'İlerleme 0-100 arasında olmalıdır'); return;
        }
        setSubmitting(true);
        try {
            const result = await apiRequest('/api/mobile/projects', {
                method: 'PUT',
                body: JSON.stringify({ id: selectedProject.id, status: editStatus, progress }),
            });
            if (result.success) {
                Alert.alert('Başarılı', 'Proje kaydedildi');
                await loadProjects();
                setSelectedProject(prev => prev ? { ...prev, status: editStatus, progress } : prev);
            } else { Alert.alert('Hata', result.error || 'Kaydedilemedi'); }
        } catch { Alert.alert('Hata', 'Bağlantı hatası'); }
        finally { setSubmitting(false); }
    };

    // ── Add milestone ─────────────────────────────────────────────────────────
    const handleAddMilestone = async () => {
        if (!newMilestoneTitle.trim() || !selectedProject) return;
        setAddingMilestone(true);
        try {
            const result = await apiRequest('/api/mobile/milestones', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    title: newMilestoneTitle.trim(),
                    description: newMilestoneDesc.trim() || undefined,
                }),
            });
            if (result.success) {
                setNewMilestoneTitle(''); setNewMilestoneDesc('');
                setShowAddMilestone(false);
                await loadMilestones(selectedProject.id);
            } else { Alert.alert('Hata', result.error || 'Eklenemedi'); }
        } catch { Alert.alert('Hata', 'Bağlantı hatası'); }
        finally { setAddingMilestone(false); }
    };

    // ── Delete milestone ──────────────────────────────────────────────────────
    const handleDeleteMilestone = (ms: Milestone) => {
        Alert.alert('Adımı Sil', `"${ms.title}" silinsin mi?`, [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil', style: 'destructive',
                onPress: async () => {
                    const result = await apiRequest(`/api/mobile/milestones?id=${ms.id}`, { method: 'DELETE' });
                    if (result.success && selectedProject) await loadMilestones(selectedProject.id);
                },
            },
        ]);
    };

    // ── Open complete milestone modal ─────────────────────────────────────────
    const openCompleteModal = (ms: Milestone) => {
        setCompletingMilestone(ms);
        setPickedImages([]);
        setShowCompleteModal(true);
    };

    // ── Pick image ────────────────────────────────────────────────────────────
    const pickImage = async () => {
        if (pickedImages.length >= 5) {
            Alert.alert('Uyarı', 'En fazla 5 görsel ekleyebilirsiniz'); return;
        }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Fotoğraf kitaplığına erişim izni verilmedi'); return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5 - pickedImages.length,
            quality: 0.5,  // compress to ~50% quality to keep base64 size manageable
            base64: true,
        });
        if (!result.canceled && result.assets) {
            const newImages: AttachmentWithData[] = result.assets
                .filter(a => a.base64)
                .map(a => ({
                    id: Date.now().toString() + Math.random().toString(36).slice(2),
                    imageData: a.base64!,
                    mimeType: a.mimeType ?? 'image/jpeg',
                    uri: a.uri,
                }));
            setPickedImages(prev => [...prev, ...newImages].slice(0, 5));
        }
    };

    // ── Complete milestone ────────────────────────────────────────────────────
    const handleCompleteMilestone = async () => {
        if (!completingMilestone || !selectedProject) return;
        setCompleting(true);
        try {
            const result = await apiRequest('/api/mobile/milestones', {
                method: 'PUT',
                body: JSON.stringify({
                    id: completingMilestone.id,
                    attachments: pickedImages.map(img => ({
                        id: img.id, imageData: img.imageData, mimeType: img.mimeType,
                    })),
                }),
            });
            if (result.success) {
                setShowCompleteModal(false);
                await loadMilestones(selectedProject.id);
                await loadProjects();
                Alert.alert('✅ Tamamlandı', 'Müşteriye bildirim gönderildi');
            } else { Alert.alert('Hata', result.error || 'Tamamlanamadı'); }
        } catch { Alert.alert('Hata', 'Bağlantı hatası'); }
        finally { setCompleting(false); }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const statusColor = (s: string) => ({ active: COLORS.success, completed: COLORS.primary, paused: COLORS.warning, cancelled: COLORS.error }[s] ?? COLORS.textMuted);
    const statusBg = (s: string) => ({ active: COLORS.successLight, completed: COLORS.primaryLight, paused: COLORS.warningLight, cancelled: COLORS.errorLight }[s] ?? COLORS.divider);
    const statusLabel = (s: string) => ({ active: 'Aktif', completed: 'Tamamlandı', paused: 'Beklemede', cancelled: 'İptal' }[s] ?? s);
    const feedbackEmoji = (fb: Record<string, 'liked' | 'disliked'>) => {
        const vals = Object.values(fb);
        const likes = vals.filter(v => v === 'liked').length;
        const dislikes = vals.filter(v => v === 'disliked').length;
        if (!vals.length) return null;
        return `👍 ${likes}  👎 ${dislikes}`;
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Projeler</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
                {loading ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}><ActivityIndicator color={COLORS.primary} size="large" /></View>
                ) : projects.length === 0 ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}><Text style={{ color: COLORS.textMuted }}>Henüz proje yok</Text></View>
                ) : projects.map(project => (
                    <TouchableOpacity key={project.id} style={styles.card} activeOpacity={0.7} onPress={() => openProject(project)}>
                        <Text style={styles.projectTitle}>{project.title}</Text>
                        <Text style={styles.projectSub}>{project.client} · {project.category}</Text>
                        <View style={styles.progressRow}>
                            <View style={styles.progressBg}>
                                <View style={[styles.progressFill, { width: `${Math.min(project.progress, 100)}%` }]} />
                            </View>
                            <Text style={styles.progressLabel}>{project.progress}%</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: statusBg(project.status) }]}>
                            <Text style={[styles.badgeText, { color: statusColor(project.status) }]}>{statusLabel(project.status)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Project Detail Modal ── */}
            <Modal visible={showProjectModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
                        <View style={styles.handle} />
                        <TouchableOpacity style={styles.closeX} onPress={() => setShowProjectModal(false)}>
                            <Text style={{ fontSize: 18, color: COLORS.textMuted }}>✕</Text>
                        </TouchableOpacity>

                        {selectedProject && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>{selectedProject.title}</Text>
                                <Text style={styles.modalSub}>{selectedProject.client} · {selectedProject.category}</Text>

                                {/* ── Status & Progress ── */}
                                <Text style={styles.sectionLabel}>DURUM</Text>
                                <View style={styles.statusRow}>
                                    {(['active', 'completed', 'paused', 'cancelled'] as const).map(s => (
                                        <TouchableOpacity key={s}
                                            style={[styles.statusOpt, { borderColor: statusColor(s) }, editStatus === s && { backgroundColor: statusBg(s) }]}
                                            onPress={() => setEditStatus(s)}>
                                            <Text style={[styles.statusOptText, { color: statusColor(s) }, editStatus === s && { fontWeight: '700' }]}>{statusLabel(s)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.sectionLabel}>İLERLEME (%)</Text>
                                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
                                    <TextInput style={[styles.input, { flex: 1 }]} value={editProgress}
                                        onChangeText={setEditProgress} keyboardType="decimal-pad"
                                        placeholder="0-100" placeholderTextColor={COLORS.textMuted} />
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProject} disabled={submitting}>
                                        {submitting ? <ActivityIndicator color={COLORS.textInverse} size="small" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
                                    </TouchableOpacity>
                                </View>

                                {/* ── Milestones ── */}
                                <View style={styles.milestoneHeader}>
                                    <Text style={styles.sectionLabel}>SÜRECİ ADIMLAR</Text>
                                    <TouchableOpacity style={styles.addMsBtn} onPress={() => setShowAddMilestone(true)}>
                                        <Text style={styles.addMsBtnText}>+ Adım Ekle</Text>
                                    </TouchableOpacity>
                                </View>

                                {milestonesLoading ? (
                                    <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
                                ) : milestones.length === 0 ? (
                                    <Text style={styles.emptyText}>Henüz adım yok. "+ Adım Ekle" ile başla.</Text>
                                ) : milestones.map((ms, idx) => (
                                    <View key={ms.id} style={styles.msCard}>
                                        <View style={styles.msLeft}>
                                            <View style={[styles.msDot, { backgroundColor: ms.status === 'completed' ? COLORS.success : COLORS.border }]}>
                                                {ms.status === 'completed' && <Text style={{ fontSize: 10, color: '#fff' }}>✓</Text>}
                                                {ms.status === 'pending' && <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{idx + 1}</Text>}
                                            </View>
                                            {idx < milestones.length - 1 && <View style={styles.msLine} />}
                                        </View>
                                        <View style={styles.msBody}>
                                            <Text style={[styles.msTitle, ms.status === 'completed' && styles.msTitleDone]}>{ms.title}</Text>
                                            {ms.description ? <Text style={styles.msDesc}>{ms.description}</Text> : null}
                                            {ms.hasAttachments && (
                                                <Text style={styles.msAttachInfo}>
                                                    📎 {ms.attachmentCount} görsel
                                                    {feedbackEmoji(ms.feedback) ? `  ·  ${feedbackEmoji(ms.feedback)}` : ''}
                                                </Text>
                                            )}
                                            {ms.completedAt && (
                                                <Text style={styles.msDate}>
                                                    {new Date(ms.completedAt).toLocaleDateString('tr-TR')}
                                                </Text>
                                            )}
                                            {ms.status === 'pending' && (
                                                <View style={styles.msActions}>
                                                    <TouchableOpacity style={styles.completeBtn} onPress={() => openCompleteModal(ms)}>
                                                        <Text style={styles.completeBtnText}>✓ Tamamla</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeleteMilestone(ms)}>
                                                        <Text style={styles.deleteText}>Sil</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── Add Milestone Modal ── */}
            <Modal visible={showAddMilestone} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                        <TouchableWithoutFeedback accessible={false}>
                            <View style={[styles.modalContent, { maxHeight: '60%' }]}>
                                <View style={styles.handle} />
                                <Text style={styles.modalTitle}>Yeni Adım</Text>

                                <Text style={styles.sectionLabel}>BAŞLIK</Text>
                                <TextInput style={[styles.input, { marginBottom: SPACING.md }]}
                                    placeholder="Ör: Logo eskizi hazırlandı"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newMilestoneTitle} onChangeText={setNewMilestoneTitle}
                                    returnKeyType="next" />

                                <Text style={styles.sectionLabel}>AÇIKLAMA (İSTEĞE BAĞLI)</Text>
                                <TextInput style={[styles.input, { height: 80, marginBottom: SPACING.lg, textAlignVertical: 'top' }]}
                                    placeholder="Müşteriye gösterilecek açıklama..."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newMilestoneDesc} onChangeText={setNewMilestoneDesc}
                                    multiline numberOfLines={3} />

                                <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddMilestone(false)}>
                                        <Text style={styles.cancelBtnText}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddMilestone} disabled={addingMilestone || !newMilestoneTitle.trim()}>
                                        {addingMilestone ? <ActivityIndicator color={COLORS.textInverse} size="small" />
                                            : <Text style={styles.saveBtnText}>Ekle</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* ── Complete Milestone Modal ── */}
            <Modal visible={showCompleteModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '85%', paddingBottom: insets.bottom + SPACING.lg }]}>
                        <View style={styles.handle} />
                        <Text style={styles.modalTitle}>Adımı Tamamla</Text>
                        {completingMilestone && (
                            <Text style={styles.modalSub}>{completingMilestone.title}</Text>
                        )}

                        <Text style={styles.sectionLabel}>GÖRSELLER (İSTEĞE BAĞLI · MAK. 5)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                            {pickedImages.map(img => (
                                <View key={img.id} style={styles.thumbWrap}>
                                    <Image source={{ uri: img.uri }} style={styles.thumb} />
                                    <TouchableOpacity style={styles.thumbRemove}
                                        onPress={() => setPickedImages(prev => prev.filter(i => i.id !== img.id))}>
                                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {pickedImages.length < 5 && (
                                <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                                    <Text style={styles.addImageIcon}>＋</Text>
                                    <Text style={styles.addImageText}>Görsel Ekle</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: SPACING.lg }}>
                            Görsel eklerseniz müşteri her birine 👍 ya da 👎 koyabilir.
                        </Text>

                        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCompleteModal(false)}>
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.success }]}
                                onPress={handleCompleteMilestone} disabled={completing}>
                                {completing ? <ActivityIndicator color={COLORS.textInverse} size="small" />
                                    : <Text style={styles.saveBtnText}>✓ Tamamla ve Gönder</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { padding: SPACING.sm },
    backText: { fontSize: FONTS.base, fontWeight: FONTS.medium as any, color: COLORS.text },
    title: { fontSize: FONTS.lg, fontWeight: FONTS.bold as any, color: COLORS.text },
    scroll: { flex: 1, padding: SPACING.lg },
    card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
    projectTitle: { fontSize: FONTS.md, fontWeight: FONTS.bold as any, color: COLORS.text },
    projectSub: { fontSize: FONTS.sm, color: COLORS.textSecondary },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    progressBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.primary },
    progressLabel: { fontSize: FONTS.xs, fontWeight: FONTS.semibold as any, color: COLORS.textMuted, minWidth: 28, textAlign: 'right' },
    badge: { paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm, alignSelf: 'flex-start' },
    badgeText: { fontSize: FONTS.xs, fontWeight: FONTS.semibold as any },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, maxHeight: '90%' },
    handle: { width: 40, height: 4, backgroundColor: COLORS.divider, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.lg },
    closeX: { position: 'absolute', top: SPACING.lg, right: SPACING.lg, padding: SPACING.sm },
    modalTitle: { fontSize: FONTS.xl, fontWeight: FONTS.bold as any, color: COLORS.text, marginBottom: SPACING.xs },
    modalSub: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
    sectionLabel: { fontSize: FONTS.xs, fontWeight: FONTS.bold as any, color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: SPACING.xs },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
    statusOpt: { flex: 1, minWidth: '45%', paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, backgroundColor: COLORS.background, alignItems: 'center' },
    statusOptText: { fontSize: FONTS.sm, fontWeight: FONTS.semibold as any },
    input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: FONTS.base, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
    saveBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', minWidth: 80 },
    saveBtnText: { fontSize: FONTS.base, fontWeight: FONTS.semibold as any, color: COLORS.textInverse },
    cancelBtn: { flex: 1, paddingVertical: SPACING.md, backgroundColor: COLORS.divider, borderRadius: RADIUS.md, alignItems: 'center' },
    cancelBtnText: { fontSize: FONTS.base, fontWeight: FONTS.semibold as any, color: COLORS.text },
    // Milestone list
    milestoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
    addMsBtn: { backgroundColor: COLORS.primaryLight, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md },
    addMsBtnText: { fontSize: FONTS.sm, fontWeight: FONTS.semibold as any, color: COLORS.primary },
    emptyText: { fontSize: FONTS.sm, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: SPACING.md },
    msCard: { flexDirection: 'row', marginBottom: SPACING.sm },
    msLeft: { alignItems: 'center', width: 28, marginRight: SPACING.sm },
    msDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    msLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 2 },
    msBody: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
    msTitle: { fontSize: FONTS.sm, fontWeight: FONTS.semibold as any, color: COLORS.text, marginBottom: SPACING.xs },
    msTitleDone: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
    msDesc: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
    msAttachInfo: { fontSize: FONTS.xs, color: COLORS.primary, marginBottom: SPACING.xs },
    msDate: { fontSize: FONTS.xs, color: COLORS.textMuted },
    msActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm, alignItems: 'center' },
    completeBtn: { backgroundColor: COLORS.successLight, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm },
    completeBtnText: { fontSize: FONTS.xs, fontWeight: FONTS.bold as any, color: COLORS.success },
    deleteText: { fontSize: FONTS.xs, color: COLORS.error },
    // Image picker
    thumbWrap: { position: 'relative', marginRight: SPACING.sm },
    thumb: { width: 80, height: 80, borderRadius: RADIUS.md },
    thumbRemove: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },
    addImageBtn: { width: 80, height: 80, borderRadius: RADIUS.md, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    addImageIcon: { fontSize: 22, color: COLORS.textMuted },
    addImageText: { fontSize: FONTS.xs, color: COLORS.textMuted, textAlign: 'center' },
});
