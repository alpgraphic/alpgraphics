import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';

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

export default function AdminMessagesScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const loadConversations = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: Conversation[] }>(
                '/api/mobile/messages'
            );
            if (result.success && result.data?.data) {
                setConversations(result.data.data);
            }
        } catch (error) {
            console.log('Conversations fetch failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Poll for new messages every 15 seconds
    useEffect(() => {
        pollIntervalRef.current = setInterval(() => {
            loadConversations();
        }, 15000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [loadConversations]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    };

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

    const getAvatarLetter = (name: string): string => {
        return (name && name.length > 0) ? name.charAt(0).toUpperCase() : '?';
    };

    const handleSelectConversation = (conversation: Conversation) => {
        navigation.navigate('Chat', {
            accountId: conversation.accountId,
            companyName: conversation.companyName,
            accountName: conversation.accountName,
        });
    };

    const renderConversationCard = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={styles.conversationCard}
            onPress={() => handleSelectConversation(item)}
            activeOpacity={0.6}
        >
            {/* Avatar */}
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

            {/* Content */}
            <View style={styles.cardContent}>
                <Text style={styles.companyName}>{item.companyName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>

            {/* Time */}
            <Text style={styles.timeText}>{formatTime(item.lastCreatedAt)}</Text>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Henüz Mesaj Yok</Text>
            <Text style={styles.emptySubtitle}>Müşterilerden gelen mesajlar burada gösterilecek</Text>
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
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Content */}
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
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
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
    backButton: {
        fontSize: FONTS.md,
        fontWeight: FONTS.medium,
        color: COLORS.textSecondary,
    },
    headerTitle: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        flexGrow: 1,
    },
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
    avatarContainer: {
        position: 'relative',
        marginRight: SPACING.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.bold,
        color: COLORS.primary,
    },
    unreadBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        minWidth: 24,
        minHeight: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    unreadBadgeText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
        paddingHorizontal: 6,
    },
    cardContent: {
        flex: 1,
    },
    companyName: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    lastMessage: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
    },
    timeText: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
        marginLeft: SPACING.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
