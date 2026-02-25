import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    RefreshControl, Alert, Modal, TextInput, ActivityIndicator,
    Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView,
    Platform, Image, FlatList, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';
import { useCache } from '../lib/useCache';

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
    const [newMilestonePhotos, setNewMilestonePhotos] = useState<{ id: string; uri: string; base64: string; mimeType: string }[]>([]);

    // ── Complete Milestone Modal ───────────────────────────────────────────────
    const [completingMilestone, setCompletingMilestone] = useState<Milestone | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [pickedImages, setPickedImages] = useState<AttachmentWithData[]>([]);
    const [completing, setCompleting] = useState(false);
    // Lightbox + milestone image cache
    const [lightboxRef, setLightboxRef] = useState<{ msId: string; attIdx: number } | null>(null);
    const [msImageCache, setMsImageCache] = useState<Record<string, AttachmentWithData[]>>({});
    const [loadingMsImages, setLoadingMsImages] = useState<Set<string>>(new Set());

    // ── Create Project Modal ────────────────────────────────────────────────
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createClient, setCreateClient] = useState('');
    const [createCategory, setCreateCategory] = useState('New Work');
    const [createAccountId, setCreateAccountId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string; name: string; company?: string }[]>([]);

    // SWR cache
    const { loadCache, saveCache } = useCache<Project[]>('admin_projects_v1', setProjects, setLoading);
    useEffect(() => { loadCache(); }, [loadCache]);

    const loadProjects = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: Project[] }>('/api/mobile/projects');
            if (result.success && result.data?.data) {
                const arr = Array.isArray(result.data.data) ? result.data.data : [];
                setProjects(arr);
                saveCache(arr);
            }
        } catch { console.log('Projects fetch failed'); }
        finally { setLoading(false); }
    }, [saveCache]);

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

    // ── Pick photos for new milestone ─────────────────────────────────────────
    const pickMilestonePhoto = async () => {
        if (newMilestonePhotos.length >= 5) { Alert.alert('Limit', 'En fazla 5 görsel'); return; }
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('', 'Galeri izni gerekli'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
            allowsMultipleSelection: true,
            selectionLimit: 5 - newMilestonePhotos.length,
        });
        if (!result.canceled && result.assets) {
            const newPhotos = result.assets.filter(a => a.base64).map(a => ({
                id: Math.random().toString(36).slice(2),
                uri: a.uri,
                base64: a.base64!,
                mimeType: a.mimeType || 'image/jpeg',
            }));
            setNewMilestonePhotos(prev => [...prev, ...newPhotos].slice(0, 5));
        }
    };

    // ── Add milestone ─────────────────────────────────────────────────────────────
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

    // ── Load milestone images (lazy) ──────────────────────────────────────────
    const loadMsImages = useCallback(async (msId: string) => {
        if (msImageCache[msId] || loadingMsImages.has(msId)) return;
        setLoadingMsImages(prev => new Set(prev).add(msId));
        try {
            const result = await apiRequest<{ data: any }>(`/api/mobile/milestones?milestoneId=${msId}`);
            if (result.success && result.data?.data?.attachments) {
                const atts = result.data.data.attachments.map((a: any) => ({
                    id: a.id, imageData: a.imageData, mimeType: a.mimeType,
                    uri: `data:${a.mimeType};base64,${a.imageData}`,
                }));
                setMsImageCache(prev => ({ ...prev, [msId]: atts }));
            }
        } catch { }
        finally { setLoadingMsImages(prev => { const s = new Set(prev); s.delete(msId); return s; }); }
    }, [msImageCache, loadingMsImages]);
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
        console.log('[COMPLETE_MODAL] opening for:', ms.title);
        setCompletingMilestone(ms);
        setPickedImages([]);
        // iOS doesn't support nested modals — close project modal first
        setShowProjectModal(false);
        setTimeout(() => setShowCompleteModal(true), 350);
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
                // Reopen project modal to show updated state
                setTimeout(() => setShowProjectModal(true), 350);
                Alert.alert('✅ Tamamlandı', 'Müşteriye bildirim gönderildi');
            } else { Alert.alert('Hata', result.error || 'Tamamlanamadı'); }
        } catch { Alert.alert('Hata', 'Bağlantı hatası'); }
        finally { setCompleting(false); }
    };

    // ── Create project ─────────────────────────────────────────────────────
    const openCreateModal = async () => {
        setCreateTitle(''); setCreateClient(''); setCreateCategory('New Work'); setCreateAccountId(null);
        setShowCreateModal(true);
        // Fetch accounts for client picker
        try {
            const res = await apiRequest<{ data: any[] }>('/api/mobile/accounts');
            if (res.success && res.data?.data) {
                setAccounts(res.data.data.map((a: any) => ({ id: a.id || a._id, name: a.name, company: a.company })));
            }
        } catch { }
    };

    const handleCreateProject = async () => {
        if (!createTitle.trim()) return;
        setCreating(true);
        try {
            const result = await apiRequest('/api/mobile/projects', {
                method: 'POST',
                body: JSON.stringify({
                    title: createTitle.trim(),
                    client: createClient.trim(),
                    category: createCategory,
                    linkedAccountId: createAccountId || undefined,
                }),
            });
            if (result.success) {
                setShowCreateModal(false);
                await loadProjects();
                Alert.alert('✅ Başarılı', 'Yeni proje oluşturuldu');
            } else { Alert.alert('Hata', result.error || 'Oluşturulamadı'); }
        } catch { Alert.alert('Hata', 'Bağlantı hatası'); }
        finally { setCreating(false); }
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
                <TouchableOpacity onPress={openCreateModal} style={{ backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: COLORS.textInverse, fontSize: 22, fontWeight: '700', marginTop: -1 }}>+</Text>
                </TouchableOpacity>
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
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
                            <View style={styles.handle} />
                            <TouchableOpacity style={styles.closeX} onPress={() => setShowProjectModal(false)}>
                                <Text style={{ fontSize: 18, color: COLORS.textMuted }}>✕</Text>
                            </TouchableOpacity>

                            {selectedProject && (
                                <ScrollView showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    keyboardDismissMode="on-drag">
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

                                    <Text style={styles.sectionLabel}>İLERLEME</Text>
                                    <View style={{ marginBottom: SPACING.md }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs }}>
                                            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.primary }}>%{editProgress}</Text>
                                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProject} disabled={submitting}>
                                                {submitting ? <ActivityIndicator color={COLORS.textInverse} size="small" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ height: 36, backgroundColor: COLORS.divider, borderRadius: 18, overflow: 'hidden', position: 'relative' }}
                                            onTouchEnd={(e) => {
                                                const w = Dimensions.get('window').width - (SPACING.lg * 2) - (SPACING.md * 2);
                                                const x = Math.max(0, Math.min(e.nativeEvent.locationX, w));
                                                const pct = Math.round((x / w) * 100);
                                                setEditProgress(String(Math.max(0, Math.min(100, pct))));
                                            }}>
                                            <View style={{
                                                height: '100%', width: `${editProgress}%` as any,
                                                backgroundColor: COLORS.primary, borderRadius: 18,
                                            }} />
                                            <View style={{
                                                position: 'absolute', right: parseInt(editProgress) > 90 ? undefined : 0, left: parseInt(editProgress) > 90 ? 0 : undefined,
                                                top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: SPACING.sm,
                                            }}>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>0%</Text>
                                            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>50%</Text>
                                            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>100%</Text>
                                        </View>
                                    </View>

                                    {/* ── Milestones ── */}
                                    <View style={styles.milestoneHeader}>
                                        <Text style={styles.sectionLabel}>SÜRECİ ADIMLAR</Text>
                                        <TouchableOpacity style={styles.addMsBtn} onPress={() => setShowAddMilestone(!showAddMilestone)}>
                                            <Text style={styles.addMsBtnText}>{showAddMilestone ? '✕ Kapat' : '+ Adım Ekle'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* ── Inline Add Milestone Form ── */}
                                    {showAddMilestone && (
                                        <View style={{ backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border }}>
                                            <Text style={[styles.sectionLabel, { marginBottom: SPACING.xs }]}>BAŞLIK</Text>
                                            <TextInput style={[styles.input, { marginBottom: SPACING.sm }]}
                                                placeholder="Ör: Logo eskizi hazırlandı"
                                                placeholderTextColor={COLORS.textMuted}
                                                value={newMilestoneTitle} onChangeText={setNewMilestoneTitle}
                                                returnKeyType="next" />

                                            <Text style={[styles.sectionLabel, { marginBottom: SPACING.xs }]}>AÇIKLAMA (İSTEĞE BAĞLI)</Text>
                                            <TextInput style={[styles.input, { height: 60, marginBottom: SPACING.sm, textAlignVertical: 'top' }]}
                                                placeholder="Müşteriye gösterilecek açıklama..."
                                                placeholderTextColor={COLORS.textMuted}
                                                value={newMilestoneDesc} onChangeText={setNewMilestoneDesc}
                                                multiline numberOfLines={2} />

                                            <TouchableOpacity style={[styles.saveBtn, { alignSelf: 'stretch', alignItems: 'center', marginTop: SPACING.sm }]} onPress={handleAddMilestone} disabled={addingMilestone || !newMilestoneTitle.trim()}>
                                                {addingMilestone ? <ActivityIndicator color={COLORS.textInverse} size="small" />
                                                    : <Text style={styles.saveBtnText}>Adımı Kaydet</Text>}
                                            </TouchableOpacity>
                                        </View>
                                    )}

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
                                                {/* Show images for completed milestones */}
                                                {ms.status === 'completed' && ms.hasAttachments && (
                                                    <View style={{ marginTop: SPACING.xs }}>
                                                        {!msImageCache[ms.id] ? (
                                                            <TouchableOpacity onPress={() => loadMsImages(ms.id)}
                                                                style={{ paddingVertical: 4 }}>
                                                                {loadingMsImages.has(ms.id)
                                                                    ? <ActivityIndicator size="small" color={COLORS.primary} />
                                                                    : <Text style={{ fontSize: FONTS.xs, color: COLORS.primary, fontWeight: FONTS.semibold as any }}>📷 Görselleri Gör</Text>}
                                                            </TouchableOpacity>
                                                        ) : (
                                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                                {msImageCache[ms.id].map(att => (
                                                                    <TouchableOpacity key={att.id} activeOpacity={0.85}
                                                                        onPress={() => {
                                                                            const attIdx = msImageCache[ms.id].findIndex(a => a.id === att.id);
                                                                            setLightboxRef({ msId: ms.id, attIdx });
                                                                            setShowProjectModal(false);
                                                                        }}>
                                                                        <Image source={{ uri: att.uri }}
                                                                            style={{ width: 80, height: 80, borderRadius: RADIUS.sm, marginRight: SPACING.xs }}
                                                                            resizeMode="cover" />
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        )}
                                                    </View>
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
                                    <View style={{ height: 40 }} />
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCompleteModal(false); setTimeout(() => setShowProjectModal(true), 350); }}>
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

            {/* ── Create Project Modal ── */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
                                <View style={styles.handle} />
                                <TouchableOpacity style={styles.closeX} onPress={() => setShowCreateModal(false)}>
                                    <Text style={{ fontSize: 18, color: COLORS.textMuted }}>✕</Text>
                                </TouchableOpacity>

                                <Text style={styles.modalTitle}>Yeni Proje</Text>
                                <Text style={styles.modalSub}>Proje bilgilerini doldurun</Text>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Text style={styles.sectionLabel}>PROJE ADI</Text>
                                    <TextInput style={[styles.input, { marginBottom: SPACING.md }]}
                                        value={createTitle} onChangeText={setCreateTitle}
                                        placeholder="Ör: Logo Tasarımı" placeholderTextColor={COLORS.textMuted} />

                                    <Text style={styles.sectionLabel}>MÜŞTERİ SEÇ (İSTEĞE BAĞLI)</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                                        <TouchableOpacity
                                            style={[styles.statusOpt, { minWidth: 0, paddingHorizontal: SPACING.md, borderColor: !createAccountId ? COLORS.primary : COLORS.border }, !createAccountId && { backgroundColor: COLORS.primaryLight }]}
                                            onPress={() => { setCreateAccountId(null); setCreateClient(''); }}>
                                            <Text style={[styles.statusOptText, { color: !createAccountId ? COLORS.primary : COLORS.textMuted }]}>Yok</Text>
                                        </TouchableOpacity>
                                        {accounts.map(acc => (
                                            <TouchableOpacity key={acc.id}
                                                style={[styles.statusOpt, { minWidth: 0, paddingHorizontal: SPACING.md, borderColor: createAccountId === acc.id ? COLORS.primary : COLORS.border }, createAccountId === acc.id && { backgroundColor: COLORS.primaryLight }]}
                                                onPress={() => { setCreateAccountId(acc.id); setCreateClient(acc.company || acc.name); }}>
                                                <Text style={[styles.statusOptText, { color: createAccountId === acc.id ? COLORS.primary : COLORS.text }]}>{acc.company || acc.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.sectionLabel}>MÜŞTERİ ADI</Text>
                                    <TextInput style={[styles.input, { marginBottom: SPACING.md }]}
                                        value={createClient} onChangeText={setCreateClient}
                                        placeholder="Müşteri/Şirket Adı" placeholderTextColor={COLORS.textMuted} />

                                    <Text style={styles.sectionLabel}>KATEGORİ</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg }}>
                                        {['New Work', 'Brand Page', 'Social Media', 'Web', 'Print'].map(cat => (
                                            <TouchableOpacity key={cat}
                                                style={[styles.statusOpt, { flex: 0, minWidth: 0, paddingHorizontal: SPACING.md, borderColor: createCategory === cat ? COLORS.primary : COLORS.border }, createCategory === cat && { backgroundColor: COLORS.primaryLight }]}
                                                onPress={() => setCreateCategory(cat)}>
                                                <Text style={[styles.statusOptText, { color: createCategory === cat ? COLORS.primary : COLORS.text }]}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TouchableOpacity style={[styles.saveBtn, { alignSelf: 'stretch', alignItems: 'center' }]}
                                        onPress={handleCreateProject} disabled={creating || !createTitle.trim()}>
                                        {creating ? <ActivityIndicator color={COLORS.textInverse} size="small" />
                                            : <Text style={styles.saveBtnText}>Proje Oluştur</Text>}
                                    </TouchableOpacity>
                                    <View style={{ height: 20 }} />
                                </ScrollView>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Lightbox */}
            <Modal visible={!!lightboxRef} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => { setLightboxRef(null); setTimeout(() => setShowProjectModal(true), 350); }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={{ position: 'absolute', top: insets.top + 10, right: 20, zIndex: 10, padding: 10 }}
                            onPress={() => { setLightboxRef(null); setTimeout(() => setShowProjectModal(true), 350); }}>
                            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>✕</Text>
                        </TouchableOpacity>
                        {lightboxRef && msImageCache[lightboxRef.msId]?.[lightboxRef.attIdx] ? (
                            <Image source={{ uri: msImageCache[lightboxRef.msId][lightboxRef.attIdx].uri }}
                                style={{ width: Dimensions.get('window').width - 20, height: Dimensions.get('window').height * 0.75 }}
                                resizeMode="contain" />
                        ) : null}
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </View >
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
