import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    FlatList,
    Modal,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';

const CACHE_KEY = 'messages_cache_v1';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface Conversation {
    accountId: string;
    accountName: string;
    companyName: string;
    lastMessage: string;
    lastSenderRole: 'admin' | 'client';
    lastCreatedAt: string;
    unreadCount: number;
}

interface Account {
    id: string;
    name: string;
    company: string;
    email: string;
}

export default function AdminMessagesScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const cacheLoaded = useRef(false);

    // New conversation modal
    const [showNewModal, setShowNewModal] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // ── Load cache on mount (instant render) ─────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const cached = await SecureStore.getItemAsync(CACHE_KEY);
                if (cached && !cacheLoaded.current) {
                    const parsed = JSON.parse(cached) as Conversation[];
                    if (parsed.length > 0) {
                        setConversations(parsed);
                        setLoading(false); // Hide spinner immediately
                    }
                    cacheLoaded.current = true;
                }
            } catch { /* ignore */ }
        })();
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: Conversation[] }>(
                '/api/mobile/messages'
            );
            if (result.success && result.data?.data) {
                setConversations(result.data.data);
                // Save to cache (fire-and-forget)
                SecureStore.setItemAsync(
                    CACHE_KEY,
                    JSON.stringify(result.data.data)
                ).catch(() => { });
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    // Reload on focus + poll every 15s
    useFocusEffect(
        useCallback(() => {
            loadConversations();
            const interval = setInterval(loadConversations, 15000);
            return () => clearInterval(interval);
        }, [loadConversations])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    };

    const openNewModal = async () => {
        setSearchText('');
        setShowNewModal(true);
        setAccountsLoading(true);
        try {
            const result = await apiRequest<{ data: Account[] }>('/api/mobile/accounts');
            if (result.success && result.data?.data) {
                setAccounts(result.data.data);
            }
        } catch {
            // silent
        } finally {
            setAccountsLoading(false);
        }
    };

    const handleSelectAccount = (account: Account) => {
        setShowNewModal(false);
        navigation.navigate('Chat', {
            accountId: account.id,
            companyName: account.company,
            accountName: account.name,
        });
    };

    const filteredAccounts = accounts.filter(acc => {
        const q = searchText.toLowerCase();
        return (
            acc.name.toLowerCase().includes(q) ||
            acc.company.toLowerCase().includes(q) ||
            acc.email.toLowerCase().includes(q)
        );
    });

    const formatTime = (dateStr: string): string => {
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

    const getAvatarLetter = (name: string): string =>
        name?.charAt(0).toUpperCase() || '?';

    const renderConversationCard = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={styles.conversationCard}
            onPress={() => navigation.navigate('Chat', {
                accountId: item.accountId,
                companyName: item.companyName,
                accountName: item.accountName,
            })}
            activeOpacity={0.6}
        >
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getAvatarLetter(item.companyName)}</Text>
                </View>
                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                            {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                    <Text style={styles.companyName} numberOfLines={1}>{item.companyName}</Text>
                    <Text style={styles.timeText}>{formatTime(item.lastCreatedAt)}</Text>
                </View>
                <Text
                    style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]}
                    numberOfLines={1}
                >
                    {item.lastSenderRole === 'admin' ? 'Siz: ' : ''}{item.lastMessage}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Henüz Mesaj Yok</Text>
            <Text style={styles.emptySubtitle}>Sağ üstteki + ile müşteriye mesaj başlatabilirsiniz</Text>
            <TouchableOpacity style={styles.emptyStartBtn} onPress={openNewModal}>
                <Text style={styles.emptyStartBtnText}>Mesaj Başlat</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Geri</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                    <TouchableOpacity style={styles.newBtn} onPress={openNewModal}>
                        <Text style={styles.newBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Conversation List */}
            {loading && conversations.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationCard}
                    keyExtractor={(item) => item.accountId}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* New Conversation Modal */}
            <Modal
                visible={showNewModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowNewModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Müşteri Seç</Text>
                            <TouchableOpacity onPress={() => setShowNewModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <TextInput
                            style={styles.searchInput}
                            placeholder="İsim, şirket veya e-posta..."
                            placeholderTextColor={COLORS.textMuted}
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus
                        />

                        {/* Account List */}
                        {accountsLoading ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator color={COLORS.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredAccounts}
                                keyExtractor={(item) => item.id}
                                style={styles.accountList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.accountRow}
                                        onPress={() => handleSelectAccount(item)}
                                        activeOpacity={0.6}
                                    >
                                        <View style={styles.accountAvatar}>
                                            <Text style={styles.accountAvatarText}>
                                                {getAvatarLetter(item.company)}
                                            </Text>
                                        </View>
                                        <View style={styles.accountInfo}>
                                            <Text style={styles.accountCompany}>{item.company}</Text>
                                            <Text style={styles.accountName}>{item.name}</Text>
                                        </View>
                                        <Text style={styles.accountArrow}>→</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.noResults}>
                                        <Text style={styles.noResultsText}>Müşteri bulunamadı</Text>
                                    </View>
                                }
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: { fontSize: FONTS.md, fontWeight: FONTS.medium, color: COLORS.textSecondary },
    headerTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.text },
    newBtn: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newBtnText: { fontSize: 22, color: COLORS.textInverse, lineHeight: 28 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, flexGrow: 1 },
    conversationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarContainer: { position: 'relative', marginRight: SPACING.md },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.primary },
    unreadBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        minWidth: 22,
        minHeight: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    unreadBadgeText: { fontSize: FONTS.xs, fontWeight: FONTS.bold, color: COLORS.textInverse, paddingHorizontal: 4 },
    cardContent: { flex: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
    companyName: { fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.text, flex: 1 },
    timeText: { fontSize: FONTS.xs, color: COLORS.textMuted, marginLeft: SPACING.sm },
    lastMessage: { fontSize: FONTS.sm, color: COLORS.textSecondary },
    lastMessageUnread: { color: COLORS.text, fontWeight: FONTS.semibold },
    // Empty state
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg },
    emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
    emptyTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: SPACING.sm },
    emptySubtitle: { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    emptyStartBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.full,
    },
    emptyStartBtnText: { color: COLORS.textInverse, fontWeight: FONTS.bold, fontSize: FONTS.base },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        maxHeight: '80%',
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    modalTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.text },
    modalClose: { fontSize: FONTS.lg, color: COLORS.textMuted, padding: SPACING.xs },
    searchInput: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        fontSize: FONTS.base,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xl },
    accountList: { flex: 1 },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    accountAvatar: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    accountAvatarText: { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.primary },
    accountInfo: { flex: 1 },
    accountCompany: { fontSize: FONTS.base, fontWeight: FONTS.semibold, color: COLORS.text },
    accountName: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
    accountArrow: { fontSize: FONTS.md, color: COLORS.textMuted },
    noResults: { paddingVertical: SPACING.xl, alignItems: 'center' },
    noResultsText: { fontSize: FONTS.base, color: COLORS.textMuted },
});
