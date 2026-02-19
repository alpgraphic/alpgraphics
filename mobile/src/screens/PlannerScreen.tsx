import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    Switch,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';
import { schedulePlannerReminder, cancelPlannerReminder } from '../lib/notifications';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface PlannerTask {
    id: string;
    title: string;
    notes?: string;
    date: string;
    startTime?: string;
    dueTime?: string;
    isCompleted: boolean;
    completedAt?: string;
    priority: 'high' | 'normal' | 'low';
    color?: string;
    isBreak: boolean;
    duration?: number;
    order: number;
    repeatDaily: boolean;
    projectTag?: string;
    estimatedMinutes?: number;
}

const PRIORITY_COLORS = {
    high: COLORS.error,
    normal: COLORS.primary,
    low: COLORS.textMuted,
};

const PRIORITY_LABELS = {
    high: 'Yüksek',
    normal: 'Normal',
    low: 'Düşük',
};

const TASK_COLORS = [
    { label: 'Varsayılan', value: '', bg: COLORS.surface, dot: COLORS.primary },
    { label: 'Kırmızı', value: '#ef4444', bg: '#fef2f2', dot: '#ef4444' },
    { label: 'Turuncu', value: '#f97316', bg: '#fff7ed', dot: '#f97316' },
    { label: 'Sarı', value: '#eab308', bg: '#fefce8', dot: '#eab308' },
    { label: 'Yeşil', value: '#22c55e', bg: '#f0fdf4', dot: '#22c55e' },
    { label: 'Mavi', value: '#3b82f6', bg: '#eff6ff', dot: '#3b82f6' },
    { label: 'Mor', value: '#a855f7', bg: '#faf5ff', dot: '#a855f7' },
];

function getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const today = getTodayString();
    const tomorrow = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const yesterday = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    if (dateStr === today) return 'Bugün';
    if (dateStr === tomorrow) return 'Yarın';
    if (dateStr === yesterday) return 'Dün';
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}dk`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}s ${m}dk` : `${h}s`;
}

const emptyForm = () => ({
    title: '',
    notes: '',
    startTime: '',
    dueTime: '',
    priority: 'normal' as const,
    color: '',
    isBreak: false,
    duration: '',
    repeatDaily: false,
    projectTag: '',
    estimatedMinutes: '',
});

export default function PlannerScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [currentDate, setCurrentDate] = useState(getTodayString());
    const [tasks, setTasks] = useState<PlannerTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [showColorPicker, setShowColorPicker] = useState(false);

    const loadTasks = useCallback(async (date: string) => {
        try {
            const result = await apiRequest<{ data: PlannerTask[] }>(
                `/api/mobile/planner?date=${date}`
            );
            if (result.success && result.data?.data) {
                setTasks(result.data.data);
            } else {
                setTasks([]);
            }
        } catch {
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadTasks(currentDate);
        }, [currentDate, loadTasks])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTasks(currentDate);
        setRefreshing(false);
    };

    const changeDate = (delta: number) => {
        const newDate = addDays(currentDate, delta);
        setCurrentDate(newDate);
        setLoading(true);
    };

    const openAddModal = () => {
        setEditingTask(null);
        setForm(emptyForm());
        setShowAddModal(true);
    };

    const openEditModal = (task: PlannerTask) => {
        setEditingTask(task);
        setForm({
            title: task.title,
            notes: task.notes || '',
            startTime: task.startTime || '',
            dueTime: task.dueTime || '',
            priority: task.priority,
            color: task.color || '',
            isBreak: task.isBreak,
            duration: task.duration?.toString() || '',
            repeatDaily: task.repeatDaily,
            projectTag: task.projectTag || '',
            estimatedMinutes: task.estimatedMinutes?.toString() || '',
        });
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingTask(null);
        setForm(emptyForm());
        setShowColorPicker(false);
    };

    const handleSave = async () => {
        if (!form.title.trim() && !form.isBreak) {
            Alert.alert('Hata', 'Görev başlığı gereklidir.');
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, any> = {
                title: form.isBreak ? (form.title.trim() || 'Mola') : form.title.trim(),
                notes: form.notes.trim() || undefined,
                date: currentDate,
                startTime: form.startTime.trim() || undefined,
                dueTime: form.dueTime.trim() || undefined,
                priority: form.priority,
                color: form.color || undefined,
                isBreak: form.isBreak,
                repeatDaily: form.repeatDaily,
                projectTag: form.projectTag.trim() || undefined,
                order: editingTask?.order ?? tasks.length,
            };

            if (form.duration) payload.duration = parseInt(form.duration) || undefined;
            if (form.estimatedMinutes) payload.estimatedMinutes = parseInt(form.estimatedMinutes) || undefined;

            if (editingTask) {
                // Update existing task
                await apiRequest('/api/mobile/planner', {
                    method: 'PUT',
                    body: JSON.stringify({ id: editingTask.id, ...payload }),
                });

                // Reschedule reminder if dueTime changed
                if (payload.dueTime) {
                    await schedulePlannerReminder(editingTask.id, payload.title, currentDate, payload.dueTime);
                } else {
                    await cancelPlannerReminder(editingTask.id);
                }
            } else {
                // Create new task
                const result = await apiRequest<{ task: PlannerTask }>('/api/mobile/planner', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });

                // Schedule reminder for new task if dueTime provided
                if (result.data?.task?.id && payload.dueTime) {
                    await schedulePlannerReminder(result.data.task.id, payload.title, currentDate, payload.dueTime);
                }
            }

            closeModal();
            await loadTasks(currentDate);
        } catch {
            Alert.alert('Hata', 'Görev kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleComplete = async (task: PlannerTask) => {
        const newCompleted = !task.isCompleted;
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, isCompleted: newCompleted } : t
        ));

        try {
            await apiRequest('/api/mobile/planner', {
                method: 'PUT',
                body: JSON.stringify({ id: task.id, isCompleted: newCompleted }),
            });

            // Cancel reminder if completed
            if (newCompleted) {
                await cancelPlannerReminder(task.id);
            } else if (task.dueTime) {
                await schedulePlannerReminder(task.id, task.title, task.date, task.dueTime);
            }
        } catch {
            // Revert on failure
            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, isCompleted: !newCompleted } : t
            ));
        }
    };

    const handleDelete = (task: PlannerTask) => {
        Alert.alert(
            'Görevi Sil',
            `"${task.title || 'Bu görevi'}" silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await cancelPlannerReminder(task.id);
                        await apiRequest(`/api/mobile/planner?id=${task.id}`, { method: 'DELETE' });
                        await loadTasks(currentDate);
                    },
                },
            ]
        );
    };

    const completedCount = tasks.filter(t => t.isCompleted && !t.isBreak).length;
    const totalCount = tasks.filter(t => !t.isBreak).length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const getTaskStyle = (task: PlannerTask) => {
        if (task.isBreak) return { bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' };
        const colorEntry = TASK_COLORS.find(c => c.value === task.color);
        if (colorEntry && colorEntry.value) return { bg: colorEntry.bg, border: colorEntry.dot + '40', dot: colorEntry.dot };
        return { bg: COLORS.surface, border: COLORS.border, dot: PRIORITY_COLORS[task.priority] };
    };

    const selectedColorEntry = TASK_COLORS.find(c => c.value === form.color) || TASK_COLORS[0];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Geri</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Planlayıcı</Text>
                    <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Date Navigation */}
                <View style={styles.dateNav}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
                        <Text style={styles.dateArrowText}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCurrentDate(getTodayString())}>
                        <Text style={styles.dateLabel}>{formatDateLabel(currentDate)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
                        <Text style={styles.dateArrowText}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                {totalCount > 0 && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.progressLabel}>
                            {completedCount}/{totalCount} tamamlandı
                        </Text>
                    </View>
                )}
            </View>

            {/* Task List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {tasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyTitle}>Görev Yok</Text>
                            <Text style={styles.emptySubtitle}>+ ile yeni görev ekleyin</Text>
                            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
                                <Text style={styles.emptyAddBtnText}>Görev Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        tasks.map((task) => {
                            const ts = getTaskStyle(task);
                            return (
                                <View
                                    key={task.id}
                                    style={[
                                        styles.taskCard,
                                        { backgroundColor: ts.bg, borderColor: ts.border },
                                        task.isCompleted && styles.taskCardCompleted,
                                    ]}
                                >
                                    {/* Left: Checkbox */}
                                    <TouchableOpacity
                                        style={styles.checkbox}
                                        onPress={() => handleToggleComplete(task)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <View style={[
                                            styles.checkboxInner,
                                            task.isCompleted && { backgroundColor: ts.dot, borderColor: ts.dot },
                                            !task.isCompleted && { borderColor: ts.dot },
                                        ]}>
                                            {task.isCompleted && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    {/* Content */}
                                    <TouchableOpacity
                                        style={styles.taskContent}
                                        onPress={() => openEditModal(task)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.taskHeader}>
                                            {task.isBreak ? (
                                                <Text style={styles.breakLabel}>☕ MOLA</Text>
                                            ) : (
                                                <Text
                                                    style={[
                                                        styles.taskTitle,
                                                        task.isCompleted && styles.taskTitleCompleted,
                                                    ]}
                                                    numberOfLines={2}
                                                >
                                                    {task.title}
                                                </Text>
                                            )}
                                            {task.priority === 'high' && !task.isBreak && (
                                                <View style={styles.priorityBadge}>
                                                    <Text style={styles.priorityBadgeText}>!</Text>
                                                </View>
                                            )}
                                        </View>

                                        {task.notes ? (
                                            <Text style={styles.taskNotes} numberOfLines={1}>{task.notes}</Text>
                                        ) : null}

                                        <View style={styles.taskMeta}>
                                            {task.startTime && (
                                                <Text style={styles.metaItem}>🕐 {task.startTime}</Text>
                                            )}
                                            {task.dueTime && (
                                                <Text style={styles.metaItem}>⏰ {task.dueTime}</Text>
                                            )}
                                            {task.estimatedMinutes && (
                                                <Text style={styles.metaItem}>⌛ {formatMinutes(task.estimatedMinutes)}</Text>
                                            )}
                                            {task.projectTag && (
                                                <Text style={styles.projectTag}>{task.projectTag}</Text>
                                            )}
                                            {task.repeatDaily && (
                                                <Text style={styles.metaItem}>🔁</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    {/* Delete */}
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => handleDelete(task)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Text style={styles.deleteBtnText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* Add/Edit Task Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalKA}
                    >
                        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingTask ? 'Görevi Düzenle' : 'Yeni Görev'}
                                </Text>
                                <TouchableOpacity onPress={closeModal}>
                                    <Text style={styles.modalClose}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {/* Break Toggle */}
                                <View style={styles.formRow}>
                                    <Text style={styles.formLabel}>Mola Bloğu</Text>
                                    <Switch
                                        value={form.isBreak}
                                        onValueChange={(v) => setForm(f => ({ ...f, isBreak: v }))}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                        thumbColor={COLORS.surface}
                                    />
                                </View>

                                {/* Title */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>
                                        {form.isBreak ? 'Etiket (opsiyonel)' : 'Görev Başlığı *'}
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={form.isBreak ? 'Öğle molası...' : 'Yapılacak iş...'}
                                        placeholderTextColor={COLORS.textMuted}
                                        value={form.title}
                                        onChangeText={(v) => setForm(f => ({ ...f, title: v }))}
                                        maxLength={200}
                                    />
                                </View>

                                {/* Notes */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Notlar</Text>
                                    <TextInput
                                        style={[styles.input, styles.inputMultiline]}
                                        placeholder="Ek notlar..."
                                        placeholderTextColor={COLORS.textMuted}
                                        value={form.notes}
                                        onChangeText={(v) => setForm(f => ({ ...f, notes: v }))}
                                        multiline
                                        numberOfLines={3}
                                        maxLength={1000}
                                    />
                                </View>

                                {/* Time Row */}
                                <View style={styles.formRowDouble}>
                                    <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                                        <Text style={styles.formLabel}>Başlangıç</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="09:00"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={form.startTime}
                                            onChangeText={(v) => setForm(f => ({ ...f, startTime: v }))}
                                            keyboardType="numeric"
                                            maxLength={5}
                                        />
                                    </View>
                                    <View style={[styles.formGroup, { flex: 1 }]}>
                                        <Text style={styles.formLabel}>Bitiş (hatırlatıcı)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="10:00"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={form.dueTime}
                                            onChangeText={(v) => setForm(f => ({ ...f, dueTime: v }))}
                                            keyboardType="numeric"
                                            maxLength={5}
                                        />
                                    </View>
                                </View>

                                {form.dueTime ? (
                                    <Text style={styles.reminderHint}>
                                        📱 Bitiş saatinden 10 dakika önce hatırlatıcı gönderilecek
                                    </Text>
                                ) : null}

                                {/* Estimated + Duration */}
                                <View style={styles.formRowDouble}>
                                    <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                                        <Text style={styles.formLabel}>Tahmini Süre (dk)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="30"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={form.estimatedMinutes}
                                            onChangeText={(v) => setForm(f => ({ ...f, estimatedMinutes: v.replace(/[^0-9]/g, '') }))}
                                            keyboardType="numeric"
                                            maxLength={4}
                                        />
                                    </View>
                                    {form.isBreak && (
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.formLabel}>Mola Süresi (dk)</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="15"
                                                placeholderTextColor={COLORS.textMuted}
                                                value={form.duration}
                                                onChangeText={(v) => setForm(f => ({ ...f, duration: v.replace(/[^0-9]/g, '') }))}
                                                keyboardType="numeric"
                                                maxLength={4}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Priority (only for non-break) */}
                                {!form.isBreak && (
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Öncelik</Text>
                                        <View style={styles.priorityRow}>
                                            {(['high', 'normal', 'low'] as const).map(p => (
                                                <TouchableOpacity
                                                    key={p}
                                                    style={[
                                                        styles.priorityBtn,
                                                        form.priority === p && {
                                                            backgroundColor: PRIORITY_COLORS[p],
                                                            borderColor: PRIORITY_COLORS[p],
                                                        },
                                                    ]}
                                                    onPress={() => setForm(f => ({ ...f, priority: p }))}
                                                >
                                                    <Text style={[
                                                        styles.priorityBtnText,
                                                        form.priority === p && { color: COLORS.textInverse },
                                                    ]}>
                                                        {PRIORITY_LABELS[p]}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Color Picker */}
                                {!form.isBreak && (
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Renk</Text>
                                        <TouchableOpacity
                                            style={styles.colorPickerBtn}
                                            onPress={() => setShowColorPicker(v => !v)}
                                        >
                                            <View style={[styles.colorDot, { backgroundColor: selectedColorEntry.dot }]} />
                                            <Text style={styles.colorPickerLabel}>{selectedColorEntry.label}</Text>
                                            <Text style={styles.colorPickerArrow}>{showColorPicker ? '▲' : '▼'}</Text>
                                        </TouchableOpacity>
                                        {showColorPicker && (
                                            <View style={styles.colorGrid}>
                                                {TASK_COLORS.map(c => (
                                                    <TouchableOpacity
                                                        key={c.value}
                                                        style={[
                                                            styles.colorOption,
                                                            { backgroundColor: c.bg, borderColor: c.dot },
                                                            form.color === c.value && { borderWidth: 2 },
                                                        ]}
                                                        onPress={() => {
                                                            setForm(f => ({ ...f, color: c.value }));
                                                            setShowColorPicker(false);
                                                        }}
                                                    >
                                                        <View style={[styles.colorDotSmall, { backgroundColor: c.dot }]} />
                                                        <Text style={styles.colorOptionLabel}>{c.label}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Project Tag */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Proje / Etiket</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Müşteri adı, proje adı..."
                                        placeholderTextColor={COLORS.textMuted}
                                        value={form.projectTag}
                                        onChangeText={(v) => setForm(f => ({ ...f, projectTag: v }))}
                                        maxLength={50}
                                    />
                                </View>

                                {/* Repeat Daily */}
                                <View style={styles.formRow}>
                                    <Text style={styles.formLabel}>Her Gün Tekrarla</Text>
                                    <Switch
                                        value={form.repeatDaily}
                                        onValueChange={(v) => setForm(f => ({ ...f, repeatDaily: v }))}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                        thumbColor={COLORS.surface}
                                    />
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={[styles.saveButton, saving && { opacity: 0.6 }]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color={COLORS.textInverse} size="small" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {editingTask ? 'Güncelle' : 'Ekle'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    backButton: { fontSize: FONTS.md, fontWeight: FONTS.medium, color: COLORS.textSecondary },
    headerTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.text },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: { fontSize: 22, color: COLORS.textInverse, lineHeight: 28, fontWeight: FONTS.regular },
    dateNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    dateArrow: { padding: SPACING.sm },
    dateArrowText: { fontSize: 28, color: COLORS.primary, lineHeight: 32 },
    dateLabel: { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.text, minWidth: 180, textAlign: 'center' },
    progressSection: { marginTop: SPACING.sm },
    progressBar: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: SPACING.xs,
    },
    progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
    progressLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, textAlign: 'center' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { flex: 1, alignItems: 'center', paddingTop: 80 },
    emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
    emptyTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: SPACING.sm },
    emptySubtitle: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: SPACING.xl },
    emptyAddBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.full,
    },
    emptyAddBtnText: { color: COLORS.textInverse, fontWeight: FONTS.bold, fontSize: FONTS.base },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    taskCardCompleted: { opacity: 0.6 },
    checkbox: { marginRight: SPACING.md },
    checkboxInner: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: { color: COLORS.textInverse, fontSize: 14, fontWeight: FONTS.bold },
    taskContent: { flex: 1 },
    taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    taskTitle: { flex: 1, fontSize: FONTS.base, fontWeight: FONTS.semibold, color: COLORS.text },
    taskTitleCompleted: { textDecorationLine: 'line-through', color: COLORS.textMuted },
    breakLabel: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: '#22c55e', letterSpacing: 1 },
    priorityBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.error,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.sm,
    },
    priorityBadgeText: { color: COLORS.textInverse, fontSize: 10, fontWeight: FONTS.bold },
    taskNotes: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
    taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
    metaItem: { fontSize: FONTS.xs, color: COLORS.textMuted },
    projectTag: {
        fontSize: FONTS.xs,
        color: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
        fontWeight: FONTS.medium,
    },
    deleteBtn: { padding: SPACING.sm, marginLeft: SPACING.sm },
    deleteBtnText: { fontSize: FONTS.sm, color: COLORS.textMuted },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalKA: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.text },
    modalClose: { fontSize: FONTS.lg, color: COLORS.textMuted, padding: SPACING.xs },
    formGroup: { marginBottom: SPACING.md },
    formLabel: { fontSize: FONTS.xs, fontWeight: FONTS.semibold, color: COLORS.textMuted, marginBottom: SPACING.xs, letterSpacing: 0.5, textTransform: 'uppercase' },
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    formRowDouble: { flexDirection: 'row', marginBottom: 0 },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        fontSize: FONTS.base,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },
    reminderHint: {
        fontSize: FONTS.xs,
        color: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
        padding: SPACING.sm,
        borderRadius: RADIUS.sm,
        marginBottom: SPACING.md,
        marginTop: -SPACING.sm,
    },
    priorityRow: { flexDirection: 'row', gap: SPACING.sm },
    priorityBtn: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    priorityBtnText: { fontSize: FONTS.sm, fontWeight: FONTS.semibold, color: COLORS.text },
    colorPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
    },
    colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: SPACING.sm },
    colorPickerLabel: { flex: 1, fontSize: FONTS.base, color: COLORS.text },
    colorPickerArrow: { fontSize: FONTS.xs, color: COLORS.textMuted },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
    colorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        minWidth: '30%',
    },
    colorDotSmall: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.xs },
    colorOptionLabel: { fontSize: FONTS.xs, color: COLORS.text },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    saveButtonText: { color: COLORS.textInverse, fontWeight: FONTS.bold, fontSize: FONTS.md },
});
