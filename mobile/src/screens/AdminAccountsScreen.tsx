import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface Account {
    id: number;
    name: string;
    company: string;
    email: string;
    status: 'none' | 'pending' | 'submitted' | 'approved';
}

export default function AdminAccountsScreen({ navigation }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [accounts, setAccounts] = useState<Account[]>([
        { id: 1, name: 'Ahmet Yılmaz', company: 'Tech Start A.Ş.', email: 'ahmet@techstart.tr', status: 'submitted' },
        { id: 2, name: 'Zeynep Kaya', company: 'Design Co', email: 'zeynep@design.co', status: 'pending' },
        { id: 3, name: 'Mehmet Demir', company: 'Startup Labs', email: 'mehmet@startup.io', status: 'approved' },
    ]);

    const handleCreate = () => {
        if (!newName || !newCompany || !newEmail || !newPassword) {
            Alert.alert('Hata', 'Tüm alanları doldurun');
            return;
        }

        setAccounts([{
            id: Date.now(),
            name: newName,
            company: newCompany,
            email: newEmail,
            status: 'none',
        }, ...accounts]);

        Alert.alert('Başarılı', `${newCompany} hesabı oluşturuldu`);
        setShowModal(false);
        setNewName('');
        setNewCompany('');
        setNewEmail('');
        setNewPassword('');
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

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {accounts.map(account => {
                    const statusStyle = getStatusStyle(account.status);
                    return (
                        <TouchableOpacity
                            key={account.id}
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => Alert.alert(account.company, `${account.email}\nDurum: ${getStatusLabel(account.status)}`)}
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
                                    {getStatusLabel(account.status)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
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
