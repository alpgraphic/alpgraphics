import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS, API_BASE_URL } from '../lib/constants';
import { apiRequest } from '../lib/auth';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface Project {
    id: string;
    title: string;
    client: string;
    category: string;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    progress: number;
}

export default function AdminProjectsScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'paused' | 'cancelled'>('active');
    const [editProgress, setEditProgress] = useState('0');
    const [submitting, setSubmitting] = useState(false);

    const loadProjects = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: Project[] }>('/api/mobile/projects');
            if (result.success && result.data?.data) {
                setProjects(Array.isArray(result.data.data) ? result.data.data : []);
            }
        } catch (error) {
            console.log('Projects fetch failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProjects();
        setRefreshing(false);
    };

    const handleProjectPress = (project: Project) => {
        setSelectedProject(project);
        setEditStatus(project.status);
        setEditProgress(project.progress.toString());
        setShowEditModal(true);
    };

    const handleSaveProject = async () => {
        if (!selectedProject) return;

        const progress = parseInt(editProgress, 10);
        if (isNaN(progress) || progress < 0 || progress > 100) {
            Alert.alert('Hata', 'İlerleme 0-100 arasında olmalıdır');
            return;
        }

        setSubmitting(true);
        try {
            const result = await apiRequest('/api/mobile/projects', {
                method: 'PUT',
                body: JSON.stringify({
                    id: selectedProject.id,
                    status: editStatus,
                    progress,
                }),
            });

            if (result.success) {
                Alert.alert('Başarılı', 'Proje kaydedildi');
                setShowEditModal(false);
                await loadProjects();
            } else {
                Alert.alert('Hata', result.error || 'Proje kaydedilemedi');
            }
        } catch (error) {
            Alert.alert('Hata', 'Bağlantı hatası');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return COLORS.success;
            case 'completed':
                return COLORS.primary;
            case 'paused':
                return COLORS.warning;
            case 'cancelled':
                return COLORS.error;
            default:
                return COLORS.textMuted;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active':
                return 'Aktif';
            case 'completed':
                return 'Tamamlandı';
            case 'paused':
                return 'Beklemede';
            case 'cancelled':
                return 'İptal';
            default:
                return status;
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case 'active':
                return COLORS.successLight;
            case 'completed':
                return COLORS.primaryLight;
            case 'paused':
                return COLORS.warningLight;
            case 'cancelled':
                return COLORS.errorLight;
            default:
                return COLORS.divider;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Projeler</Text>
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
                ) : projects.length === 0 ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>Henüz proje yok</Text>
                    </View>
                ) : (
                    projects.map(project => (
                        <TouchableOpacity
                            key={project.id}
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => handleProjectPress(project)}
                        >
                            <View style={styles.cardContent}>
                                <Text style={styles.projectTitle}>{project.title}</Text>
                                <Text style={styles.projectClient}>{project.client}</Text>
                                <Text style={styles.projectCategory}>{project.category}</Text>

                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBarBg}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                { width: `${Math.min(project.progress, 100)}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressLabel}>{project.progress}%</Text>
                                </View>

                                {/* Status Badge */}
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusBgColor(project.status) },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: getStatusColor(project.status) },
                                        ]}
                                    >
                                        {getStatusLabel(project.status)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Project Modal */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                        <TouchableWithoutFeedback accessible={false}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHandle} />

                                {selectedProject && (
                                    <>
                                        <Text style={styles.modalTitle}>{selectedProject.title}</Text>

                                        {/* Project Info - Read Only */}
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>MÜŞTERİ</Text>
                                            <Text style={styles.detailValue}>{selectedProject.client}</Text>
                                        </View>

                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>KATEGORİ</Text>
                                            <Text style={styles.detailValue}>{selectedProject.category}</Text>
                                        </View>

                                        {/* Status Selector */}
                                        <Text style={styles.inputLabel}>DURUM</Text>
                                        <View style={styles.statusSelector}>
                                            {(['active', 'completed', 'paused', 'cancelled'] as const).map(status => (
                                                <TouchableOpacity
                                                    key={status}
                                                    style={[
                                                        styles.statusOption,
                                                        editStatus === status && styles.statusOptionActive,
                                                        { borderColor: getStatusColor(status) },
                                                    ]}
                                                    onPress={() => setEditStatus(status)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusOptionText,
                                                            editStatus === status && styles.statusOptionTextActive,
                                                            { color: getStatusColor(status) },
                                                        ]}
                                                    >
                                                        {getStatusLabel(status)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        {/* Progress Input */}
                                        <Text style={styles.inputLabel}>İLERLEME (%)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0-100"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={editProgress}
                                            onChangeText={setEditProgress}
                                            keyboardType="decimal-pad"
                                        />

                                        <View style={styles.modalButtons}>
                                            <TouchableOpacity
                                                style={styles.cancelBtn}
                                                onPress={() => setShowEditModal(false)}
                                                disabled={submitting}
                                            >
                                                <Text style={styles.cancelBtnText}>Kapat</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.submitBtn}
                                                onPress={handleSaveProject}
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <ActivityIndicator color={COLORS.textInverse} size="small" />
                                                ) : (
                                                    <Text style={styles.submitBtnText}>Kaydet</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
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
        fontSize: FONTS.base,
        fontWeight: FONTS.medium,
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
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardContent: {
        gap: SPACING.md,
    },
    projectTitle: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    projectClient: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
    },
    projectCategory: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: RADIUS.sm,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    progressLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
        color: COLORS.textMuted,
        minWidth: 28,
        textAlign: 'right',
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
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
    detailSection: {
        paddingBottom: SPACING.md,
        marginBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    detailValue: {
        fontSize: FONTS.md,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    inputLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 1.5,
        marginBottom: SPACING.xs,
    },
    statusSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    statusOption: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.md,
        borderWidth: 2,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusOptionActive: {
        backgroundColor: COLORS.primaryLight,
    },
    statusOptionText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
    },
    statusOptionTextActive: {
        fontWeight: FONTS.bold,
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
