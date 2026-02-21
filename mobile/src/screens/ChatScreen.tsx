import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest, getUserData, UserData } from '../lib/auth';

type ChatScreenProps = NativeStackScreenProps<any, 'Chat'>;

interface Message {
    id: string;
    senderId: string;
    senderRole: 'admin' | 'client';
    senderName: string;
    content: string;
    createdAt: string;
    readAt?: string;
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
    const insets = useSafeAreaInsets();
    const { accountId, companyName = '', accountName = '' } = route.params ?? {};

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load current user data
    useEffect(() => {
        const loadUserData = async () => {
            const userData = await getUserData();
            setCurrentUser(userData);
        };
        loadUserData();
    }, []);

    // Load messages
    const loadMessages = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: Message[] }>(
                `/api/mobile/messages?accountId=${accountId}`
            );
            if (result.success && result.data?.data) {
                setMessages(result.data.data);
                // Auto-scroll to bottom
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        } catch (error) {
            console.log('Messages fetch failed');
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Poll for new messages while screen is focused (every 5 seconds)
    useFocusEffect(
        useCallback(() => {
            // Load immediately
            loadMessages();

            // Set up polling
            pollIntervalRef.current = setInterval(() => {
                loadMessages();
            }, 5000);

            return () => {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            };
        }, [loadMessages])
    );

    const handleSendMessage = async () => {
        if (!messageText.trim() || !currentUser) return;

        const trimmedText = messageText.trim();
        setSending(true);

        try {
            const result = await apiRequest<{ success: boolean }>(
                '/api/mobile/messages',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        content: trimmedText,
                        accountId,
                    }),
                }
            );

            if (result.success) {
                setMessageText('');
                // Reload messages after sending
                await loadMessages();
            }
        } catch (error) {
            console.log('Send message failed');
        } finally {
            setSending(false);
        }
    };

    const formatMessageTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isOwnMessage = (message: Message, userRole?: string): boolean => {
        if (!userRole) return false;
        return message.senderRole === userRole;
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isOwn = isOwnMessage(item, currentUser?.role);

        return (
            <View
                style={[
                    styles.messageContainer,
                    isOwn ? styles.messageContainerOwn : styles.messageContainerOther,
                ]}
            >
                {!isOwn && (
                    <Text style={styles.senderName}>{item.senderName}</Text>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isOwn ? styles.messageTextOwn : styles.messageTextOther,
                        ]}
                    >
                        {item.content}
                    </Text>
                </View>
                <Text style={styles.messageTime}>{formatMessageTime(item.createdAt)}</Text>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Henüz Mesaj Yok</Text>
            <Text style={styles.emptySubtitle}>Bir mesaj gönderin</Text>
        </View>
    );

    const headerTitle = companyName || accountName || 'Sohbet';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Geri</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{headerTitle}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Messages List */}
            {loading && messages.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                    <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    inverted={false}
                    ListEmptyComponent={renderEmptyState}
                    onEndReachedThreshold={0.1}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Input Bar */}
            <View
                style={[
                    styles.inputContainer,
                    { paddingBottom: insets.bottom + SPACING.sm },
                ]}
            >
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Mesaj yazın..."
                        placeholderTextColor={COLORS.textMuted}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={1000}
                        editable={!sending}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (sending || !messageText.trim()) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSendMessage}
                        disabled={sending || !messageText.trim()}
                        activeOpacity={0.7}
                    >
                        {sending ? (
                            <ActivityIndicator color={COLORS.textInverse} size="small" />
                        ) : (
                            <Text style={styles.sendButtonText}>→</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
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
        flex: 1,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
    },
    messagesList: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    messageContainer: {
        marginBottom: SPACING.md,
    },
    messageContainerOwn: {
        alignItems: 'flex-end',
    },
    messageContainerOther: {
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.medium,
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.sm,
    },
    messageBubble: {
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        maxWidth: '85%',
    },
    messageBubbleOwn: {
        backgroundColor: COLORS.primary,
    },
    messageBubbleOther: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageText: {
        fontSize: FONTS.base,
        lineHeight: FONTS.base + 6,
    },
    messageTextOwn: {
        color: COLORS.textInverse,
        fontWeight: FONTS.regular,
    },
    messageTextOther: {
        color: COLORS.text,
        fontWeight: FONTS.regular,
    },
    messageTime: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        marginHorizontal: SPACING.sm,
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
    inputContainer: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.sm,
    },
    textInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONTS.base,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.textMuted,
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: FONTS.lg,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
    },
});
