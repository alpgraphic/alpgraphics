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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [transactionMode, setTransactionMode] = useState<'debt' | 'payment' | null>(null);
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionDescription, setTransactionDescription] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [submittingTransaction, setSubmittingTransaction] = useState(false);

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

    const handleAccountPress = (account: Account) => {
        setSelectedAccount(account);
        setTransactionMode(null);
        setShowDetailModal(true);
    };

    const handleTransactionStart = (mode: 'debt' | 'payment') => {
        setTransactionMode(mode);
        setTransactionAmount('');
        setTransactionDescription('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
    };

    const handleSubmitTransaction = async () => {
        if (!transactionAmount || !selectedAccount) {
            Alert.alert('Hata', 'Tutarı girin');
            return;
        }

        const amount = parseFloat(transactionAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Hata', 'Geçerli bir tutar girin');
            return;
        }

        setSubmittingTransaction(true);
        try {
            const result = await apiRequest('/api/mobile/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    accountId: selectedAccount.id,
                    type: transactionMode === 'debt' ? 'Debt' : 'Payment',
                    amount,
                    description: transactionDescription.trim(),
                    date: transactionDate,
                }),
            });

            if (result.success) {
                Alert.alert(
                    'Başarılı',
                    `İşlem kaydedildi`
                );
                setTransactionMode(null);
                setTransactionAmount('');
                setTransactionDescription('');
                await loadAccounts(); // Refresh accounts list
                setShowDetailModal(false);
            } else {
                Alert.alert('Hata', result.error || 'İşlem kaydedilemedi');
            }
        } catch (error) {
            Alert.alert('Hata', 'Bağlantı hatası');
        } finally {
            setSubmittingTransaction(false);
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

    const calculateBalance = (account: Account) => {
        return account.balance || (account.totalDebt - account.totalPaid);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
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
                        const balance = calculateBalance(account);
                        return (
                            <TouchableOpacity
                                key={account.id}
                                style={styles.card}
                                activeOpacity={0.7}
                                onPress={() => handleAccountPress(account)}
                            >
                                <View style={styles.cardAvatar}>
                                    <Text style={styles.avatarText}>{account.name[0]}</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardName}>{account.name}</Text>
                                    <Text style={styles.cardCompany}>{account.company}</Text>
                                    <Text style={[
                                        styles.cardBalance,
                                        { color: balance < 0 ? COLORS.error : COLORS.success }
                                    ]}>
                                        Bakiye: ₺{Math.abs(balance).toLocaleString('tr-TR')}
                                    </Text>
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

            {/* Create Account Modal */}
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

            {/* Account Detail & Transaction Modal */}
            <Modal visible={showDetailModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        {selectedAccount && !transactionMode && (
                            <>
                                <Text style={styles.modalTitle}>{selectedAccount.company}</Text>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>YETKİLİ</Text>
                                    <Text style={styles.detailValue}>{selectedAccount.name}</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>E-POSTA</Text>
                                    <Text style={styles.detailValue}>{selectedAccount.email}</Text>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={styles.detailLabel}>BAKİYE</Text>
                                    <Text style={[
                                        styles.detailValue,
                                        { color: calculateBalance(selectedAccount) < 0 ? COLORS.error : COLORS.success }
                                    ]}>
                                        ₺{Math.abs(calculateBalance(selectedAccount)).toLocaleString('tr-TR')}
                                    </Text>
                                </View>

                                {selectedAccount.briefStatus && selectedAccount.briefStatus !== 'none' && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>DURUM</Text>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusStyle(selectedAccount.briefStatus).bg }
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                { color: getStatusStyle(selectedAccount.briefStatus).text }
                                            ]}>
                                                {getStatusLabel(selectedAccount.briefStatus)}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => handleTransactionStart('debt')}
                                    >
                                        <Text style={styles.actionBtnText}>Borç Ekle</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
                                        onPress={() => handleTransactionStart('payment')}
                                    >
                                        <Text style={styles.actionBtnText}>Ödeme Al</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={() => setShowDetailModal(false)}
                                >
                                    <Text style={styles.closeBtnText}>Kapat</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {selectedAccount && transactionMode && (
                            <>
                                <Text style={styles.modalTitle}>
                                    {transactionMode === 'debt' ? 'Borç Ekle' : 'Ödeme Al'}
                                </Text>
                                <Text style={styles.transactionSubtitle}>{selectedAccount.company}</Text>

                                <Text style={styles.inputLabel}>TUTAR (₺)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1000"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={transactionAmount}
                                    onChangeText={setTransactionAmount}
                                    keyboardType="decimal-pad"
                                />

                                <Text style={styles.inputLabel}>AÇIKLAMA</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Proje bedeli, ödeme vb."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={transactionDescription}
                                    onChangeText={setTransactionDescription}
                                    multiline
                                    numberOfLines={3}
                                />

                                <Text style={styles.inputLabel}>TARİH</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={transactionDate}
                                    onChangeText={setTransactionDate}
                                />

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setTransactionMode(null)}
                                        disabled={submittingTransaction}
                                    >
                                        <Text style={styles.cancelBtnText}>Geri</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.submitBtn}
                                        onPress={handleSubmitTransaction}
                                        disabled={submittingTransaction}
                                    >
                                        {submittingTransaction ? (
                                            <ActivityIndicator color={COLORS.textInverse} size="small" />
                                        ) : (
                                            <Text style={styles.submitBtnText}>Kaydet</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
        marginTop: 2,
    },
    cardBalance: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
        marginTop: 4,
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
    transactionSubtitle: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
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
    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.textInverse,
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
    closeBtn: {
        marginTop: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.divider,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
});
