import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface Account {
    id: string;
    name: string;
    company: string;
    email: string;
    balance: number;
    totalDebt: number;
    totalPaid: number;
    briefStatus: 'none' | 'pending' | 'submitted' | 'approved';
}

export default function AdminAccountsScreen({ navigation }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const loadAccounts = useCallback(async () => {
        try {
            const result = await apiRequest<{ data: Account[] }>('/api/mobile/accounts');
            if (result.success && result.data?.data) {
                const data = result.data.data;
                // Handle both array (admin) and single object (shouldn't happen here)
                setAccounts(Array.isArray(data) ? data : [data]);
            }
        } catch (error) {
            console.log('Accounts fetch failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAccounts();
        setRefreshing(false);
    };

    const handleCreate = async () => {
        if (!newName || !newCompany || !newEmail || !newPassword) {
            Alert.alert('Hata', 'Tüm alanları doldurun');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
            return;
        }

        try {
            const result = await apiRequest('/api/mobile/accounts', {
                method: 'POST',
                body: JSON.stringify({
                    name: newName.trim(),
                    company: newCompany.trim(),
                    email: newEmail.trim().toLowerCase(),
                    password: newPassword,
                }),
            });

            if (result.success) {
                Alert.alert('Başarılı', `${newCompany} hesabı oluşturuldu`);
                setShowModal(false);
                setNewName('');
                setNewCompany('');
                setNewEmail('');
                setNewPassword('');
                loadAccounts(); // Refresh list
            } else {
                Alert.alert('Hata', result.error || 'Hesap oluşturulamadı');
            }
        } catch (error) {
            Alert.alert('Hata', 'Bağlantı hatası');
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'none': return 'Form Yok';
            case 'pending': return 'Bekliyor';
            case 'submitted': return 'İnceleme';
            case 'approved': return 'Aktif';
            default: return status;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return { bg: COLORS.successLight, text: COLORS.success };
            case 'submitted': return { bg: COLORS.warningLight, text: COLORS.warning };
            case 'pending': return { bg: COLORS.primaryLight, text: COLORS.primary };
            default: return { bg: COLORS.divider, text: COLORS.textMuted };
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Hesaplar</Text>
                <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
                    <Text style={styles.addText}>+ Ekle</Text>
                </TouchableOpacity>
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
                ) : accounts.length === 0 ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>Henüz hesap yok</Text>
                    </View>
                ) : (
                accounts.map(account => {
                    const statusStyle = getStatusStyle(account.briefStatus || 'none');
                    return (
                        <TouchableOpacity
                            key={account.id}
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => Alert.alert(
                                account.company || account.name,
                                `${account.email}\nBakiye: ₺${(account.balance || 0).toLocaleString()}\nDurum: ${getStatusLabel(account.briefStatus || 'none')}`
                            )}
                        >
                            <View style={styles.cardAvatar}>
                                <Text style={styles.avatarText}>{account.name[0]}</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardName}>{account.name}</Text>
                                <Text style={styles.cardCompany}>{account.company}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                    {getStatusLabel(account.briefStatus || 'none')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Yeni Hesap</Text>

                        <Text style={styles.inputLabel}>YETKİLİ ADI</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ahmet Yılmaz"
                            placeholderTextColor={COLORS.textMuted}
                            value={newName}
                            onChangeText={setNewName}
                        />

                        <Text style={styles.inputLabel}>ŞİRKET</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tech Start A.Ş."
                            placeholderTextColor={COLORS.textMuted}
                            value={newCompany}
                            onChangeText={setNewCompany}
                        />

                        <Text style={styles.inputLabel}>E-POSTA</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="info@firma.com"
                            placeholderTextColor={COLORS.textMuted}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.inputLabel}>ŞİFRE</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={COLORS.textMuted}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                                <Text style={styles.submitBtnText}>Oluştur</Text>
                            </TouchableOpacity>
                        </View>
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
        paddingTop: 60,
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
    addBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
    },
    addText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.textInverse,
    },
    scroll: {
        flex: 1,
        padding: SPACING.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardAvatar: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.text,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarText: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
    },
    cardContent: {
        flex: 1,
    },
    cardName: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    cardCompany: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
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
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 1.5,
        marginBottom: SPACING.xs,
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
        marginTop: SPACING.md,
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
    },
    submitBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.textInverse,
    },
});
