import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    Animated,
    Clipboard,
    Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
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
    _optimistic?: boolean;
    _type?: 'date_separator'; // virtual item for date grouping
}

// ─── Typing Dots Component ──────────────────────────────────────────────────
function TypingIndicator() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay(600 - delay),
                ])
            );
        const a1 = animate(dot1, 0);
        const a2 = animate(dot2, 200);
        const a3 = animate(dot3, 400);
        a1.start(); a2.start(); a3.start();
        return () => { a1.stop(); a2.stop(); a3.stop(); };
    }, [dot1, dot2, dot3]);

    const dotStyle = (dot: Animated.Value) => ({
        opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
    });

    return (
        <View style={typingStyles.container}>
            <View style={typingStyles.bubble}>
                <Animated.View style={[typingStyles.dot, dotStyle(dot1)]} />
                <Animated.View style={[typingStyles.dot, dotStyle(dot2)]} />
                <Animated.View style={[typingStyles.dot, dotStyle(dot3)]} />
            </View>
        </View>
    );
}

const typingStyles = StyleSheet.create({
    container: { alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 4 },
    bubble: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4,
        paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.45)' },
});

// ─── Date helpers ───────────────────────────────────────────────────────────
function formatDateSeparator(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (today.getTime() - msgDay.getTime()) / 86400000;
    if (diff < 1) return 'Bugün';
    if (diff < 2) return 'Dün';
    if (diff < 7) {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        return days[d.getDay()];
    }
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDateKey(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ─── Insert date separators into message list ───────────────────────────────
// Insert date separators, then reverse for inverted FlatList
function withDateSeparatorsReversed(messages: Message[]): Message[] {
    const result: Message[] = [];
    let lastDateKey = '';
    for (const msg of messages) {
        if (msg._type === 'date_separator') continue;
        const key = getDateKey(msg.createdAt);
        if (key !== lastDateKey) {
            result.push({
                id: `sep_${key}`,
                senderId: '', senderRole: 'admin', senderName: '',
                content: formatDateSeparator(msg.createdAt),
                createdAt: msg.createdAt,
                _type: 'date_separator',
            });
            lastDateKey = key;
        }
        result.push(msg);
    }
    // Reverse for inverted FlatList (newest first)
    return result.slice().reverse();
}

// ─── Read receipt ticks ─────────────────────────────────────────────────────
function ReadReceipt({ message }: { message: Message }) {
    if (message._optimistic) return <Text style={tickStyles.tick}>○</Text>; // pending
    if (message.readAt) return <Text style={[tickStyles.tick, tickStyles.read]}>✓✓</Text>;
    return <Text style={tickStyles.tick}>✓</Text>; // sent but unread
}

const tickStyles = StyleSheet.create({
    tick: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 4 },
    read: { color: '#34b7f1' }, // WhatsApp blue
});

// ═════════════════════════════════════════════════════════════════════════════
// MAIN CHAT SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
    const insets = useSafeAreaInsets();
    const { accountId, companyName = '', accountName = '' } = route.params ?? {};

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTimestampRef = useRef<string | null>(null);
    const cacheKey = `chat_cache_${accountId}`;

    // Load current user data
    useEffect(() => {
        (async () => {
            const userData = await getUserData();
            setCurrentUser(userData);
        })();
    }, []);

    // ── Load cache on mount ──────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const cached = await SecureStore.getItemAsync(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached) as Message[];
                    if (parsed.length > 0) {
                        setMessages(parsed);
                        setLoading(false);
                        lastTimestampRef.current = parsed[parsed.length - 1].createdAt;
                    }
                }
            } catch { /* ignore */ }
        })();
    }, [cacheKey]);

    // ── Message loading (full + incremental) ─────────────────────────────
    const loadMessages = useCallback(async (incremental = false) => {
        try {
            let url = `/api/mobile/messages?accountId=${accountId}`;
            if (incremental && lastTimestampRef.current) {
                url += `&after=${encodeURIComponent(lastTimestampRef.current)}`;
            }
            const result = await apiRequest<{ data: Message[] }>(url);
            if (result.success && result.data?.data) {
                const newMsgs = result.data.data;
                if (incremental && newMsgs.length > 0) {
                    setMessages(prev => {
                        const newIds = new Set(newMsgs.map(m => m.id));
                        const existing = prev.filter(m => !newIds.has(m.id));
                        const merged = [...existing, ...newMsgs];
                        SecureStore.setItemAsync(cacheKey, JSON.stringify(merged.filter(m => !m._type).slice(-200))).catch(() => { });
                        return merged;
                    });
                    lastTimestampRef.current = newMsgs[newMsgs.length - 1].createdAt;
                } else if (!incremental) {
                    setMessages(newMsgs);
                    if (newMsgs.length > 0) lastTimestampRef.current = newMsgs[newMsgs.length - 1].createdAt;
                    SecureStore.setItemAsync(cacheKey, JSON.stringify(newMsgs)).catch(() => { });
                }
            }
        } catch { /* silent */ } finally { setLoading(false); }
    }, [accountId, cacheKey]);

    useEffect(() => { loadMessages(false); }, [loadMessages]);

    // ── Polling: messages + typing indicator ─────────────────────────────
    const pollTyping = useCallback(async () => {
        try {
            const result = await apiRequest<{ typing: boolean }>(`/api/mobile/messages/typing?accountId=${accountId}`);
            if (result.success && result.data) {
                setIsCounterpartTyping(result.data.typing);
            }
        } catch { /* silent */ }
    }, [accountId]);

    useFocusEffect(
        useCallback(() => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = setInterval(() => {
                loadMessages(true);
                pollTyping();
            }, 3000); // 3s for more responsive typing
            return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
        }, [loadMessages, pollTyping])
    );

    // ── Send typing status ───────────────────────────────────────────────
    const sendTypingStatus = useCallback(() => {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        apiRequest('/api/mobile/messages/typing', {
            method: 'POST',
            body: JSON.stringify({ accountId }),
        }).catch(() => { });
        typingTimerRef.current = setTimeout(() => { typingTimerRef.current = null; }, 3000);
    }, [accountId]);

    const handleTextChange = useCallback((text: string) => {
        setMessageText(text);
        if (text.length > 0) sendTypingStatus();
    }, [sendTypingStatus]);

    // ── Optimistic Send ──────────────────────────────────────────────────
    const handleSendMessage = async () => {
        if (!messageText.trim() || !currentUser) return;
        const trimmedText = messageText.trim();
        const now = new Date().toISOString();

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });

        const optimisticMsg: Message = {
            id: `opt_${Date.now()}`,
            senderId: currentUser.id || '',
            senderRole: (currentUser.role as 'admin' | 'client') || 'admin',
            senderName: currentUser.name || 'Alp Graphics',
            content: trimmedText,
            createdAt: now,
            _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setMessageText('');
        // No scroll needed — inverted FlatList shows newest at bottom automatically

        setSending(true);
        try {
            const result = await apiRequest<{ success: boolean; message?: Message }>(
                '/api/mobile/messages',
                { method: 'POST', body: JSON.stringify({ content: trimmedText, accountId }) }
            );
            if (result.success && result.data?.message) {
                const realMsg = result.data.message;
                setMessages(prev =>
                    prev.map(m => m.id === optimisticMsg.id ? { ...realMsg, id: realMsg.id || optimisticMsg.id } : m)
                );
                lastTimestampRef.current = realMsg.createdAt || now;
            }
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setMessageText(trimmedText);
        } finally { setSending(false); }
    };

    // ── Copy message ─────────────────────────────────────────────────────
    const handleLongPress = useCallback((content: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        Clipboard.setString(content);
        Alert.alert('', 'Mesaj kopyalandı ✓', [{ text: 'Tamam' }]);
    }, []);

    // ── Scroll tracking (inverted: offset 0 = bottom) ────────────────────
    const handleScroll = useCallback((e: any) => {
        const { contentOffset } = e.nativeEvent;
        // In inverted list, offset 0 = bottom. Show FAB when scrolled up
        setShowScrollBtn(contentOffset.y > 300);
    }, []);

    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    // ── Formatted time ───────────────────────────────────────────────────
    const formatTime = (dateStr: string): string => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '--:--';
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    // ── Render items ─────────────────────────────────────────────────────
    const userRole = currentUser?.role;

    // Memoize reversed messages for inverted FlatList
    const displayMessages = useMemo(() => withDateSeparatorsReversed(messages), [messages]);

    const renderItem = useCallback(({ item }: { item: Message }) => {
        // Date separator
        if (item._type === 'date_separator') {
            return (
                <View style={s.dateSep}>
                    <View style={s.dateSepPill}>
                        <Text style={s.dateSepText}>{item.content}</Text>
                    </View>
                </View>
            );
        }

        const isOwn = userRole ? item.senderRole === userRole : false;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => handleLongPress(item.content)}
                delayLongPress={400}
                style={[s.row, isOwn ? s.rowOwn : s.rowOther]}
            >
                {/* Avatar for other */}
                {!isOwn && (
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>
                            {(item.senderName || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther, item._optimistic && { opacity: 0.6 }]}>
                    {!isOwn && <Text style={s.senderLabel}>{item.senderName}</Text>}
                    <Text style={[s.msgText, isOwn ? s.msgTextOwn : s.msgTextOther]}>
                        {item.content}
                    </Text>
                    <View style={s.meta}>
                        <Text style={[s.time, isOwn && s.timeOwn]}>{formatTime(item.createdAt)}</Text>
                        {isOwn && <ReadReceipt message={item} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [userRole, handleLongPress]);

    const keyExtractor = useCallback((item: Message) => item.id, []);
    const headerTitle = companyName || accountName || 'Sohbet';
    const avatarLetter = (companyName || accountName || '?').charAt(0).toUpperCase();

    return (
        <KeyboardAvoidingView
            style={s.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar barStyle="dark-content" />

            {/* ── Header ─────────────────────────────────────────────── */}
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={s.backBtn}>‹</Text>
                </TouchableOpacity>
                <View style={s.headerAvatar}>
                    <Text style={s.headerAvatarText}>{avatarLetter}</Text>
                </View>
                <View style={s.headerInfo}>
                    <Text style={s.headerName} numberOfLines={1}>{headerTitle}</Text>
                    <Text style={s.headerStatus}>
                        {isCounterpartTyping ? 'yazıyor...' : 'mesajlar'}
                    </Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            {/* ── Messages ───────────────────────────────────────────── */}
            {loading && messages.length === 0 ? (
                <View style={s.loadingBox}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={displayMessages}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={s.list}
                        inverted
                        showsVerticalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        maxToRenderPerBatch={15}
                        windowSize={11}
                        initialNumToRender={25}
                        updateCellsBatchingPeriod={50}
                        ListHeaderComponent={isCounterpartTyping ? <TypingIndicator /> : null}
                        keyboardDismissMode="interactive"
                        keyboardShouldPersistTaps="handled"
                    />

                    {/* Scroll to bottom FAB */}
                    {showScrollBtn && (
                        <TouchableOpacity style={s.scrollFab} onPress={scrollToBottom} activeOpacity={0.8}>
                            <Text style={s.scrollFabText}>↓</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* ── Input ──────────────────────────────────────────────── */}
            <View style={[s.inputWrap, { paddingBottom: insets.bottom + 6 }]}>
                <View style={s.inputRow}>
                    <TextInput
                        style={s.input}
                        placeholder="Mesaj yazın..."
                        placeholderTextColor="rgba(0,0,0,0.3)"
                        value={messageText}
                        onChangeText={handleTextChange}
                        multiline
                        maxLength={2000}
                    />
                    <TouchableOpacity
                        style={[s.sendBtn, (!messageText.trim()) && s.sendBtnHidden]}
                        onPress={handleSendMessage}
                        disabled={sending || !messageText.trim()}
                        activeOpacity={0.7}
                    >
                        {sending ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={s.sendIcon}>➤</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f3e9' }, // Brand warm ivory

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backBtn: { fontSize: 32, color: COLORS.primary, fontWeight: '300', marginRight: 4, lineHeight: 32 },
    headerAvatar: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    headerAvatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    headerStatus: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },

    // Messages list
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingVertical: 8 },

    // Date separator
    dateSep: { alignItems: 'center', marginVertical: 12 },
    dateSepPill: {
        backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    dateSepText: { fontSize: 12, fontWeight: '600', color: 'rgba(0,0,0,0.45)' },

    // Message row
    row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, paddingHorizontal: 8 },
    rowOwn: { justifyContent: 'flex-end' },
    rowOther: { justifyContent: 'flex-start' },

    // Avatar
    avatar: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryLight,
        justifyContent: 'center', alignItems: 'center', marginRight: 6, marginBottom: 2,
    },
    avatarText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

    // Bubble
    bubble: {
        maxWidth: '78%', borderRadius: 16,
        paddingTop: 7, paddingBottom: 6, paddingHorizontal: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 0.5 }, shadowOpacity: 0.04, shadowRadius: 1,
    },
    bubbleOwn: {
        backgroundColor: COLORS.primary, // Brand bordeaux
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4,
    },

    senderLabel: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginBottom: 2 },

    msgText: { fontSize: 15, lineHeight: 20 },
    msgTextOwn: { color: '#ffffff' },
    msgTextOther: { color: '#1a1a1a' },

    // Meta (time + receipts)
    meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
    time: { fontSize: 11, color: 'rgba(0,0,0,0.4)' },
    timeOwn: { color: 'rgba(255,255,255,0.55)' },

    // Scroll FAB
    scrollFab: {
        position: 'absolute', right: 16, bottom: 8,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
        elevation: 4,
    },
    scrollFabText: { fontSize: 18, color: 'rgba(0,0,0,0.5)', fontWeight: '600' },

    // Input
    inputWrap: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8, paddingTop: 6,
    },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    input: {
        flex: 1, backgroundColor: '#fff', borderRadius: 22,
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 15, color: '#1a1a1a', maxHeight: 120, minHeight: 40,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    },
    sendBtnHidden: { backgroundColor: 'rgba(0,0,0,0.15)' },
    sendIcon: { fontSize: 18, color: '#fff', marginLeft: 2 },
});
