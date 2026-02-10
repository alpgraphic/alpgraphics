import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

interface Brief {
    id: number;
    company: string;
    type: string;
    status: 'pending' | 'submitted' | 'approved';
    date?: string;
}

export default function AdminBriefsScreen({ navigation }: Props) {
    const [briefs, setBriefs] = useState<Brief[]>([
        { id: 1, company: 'Tech Start A.Ş.', type: 'Web Tasarım', status: 'submitted', date: '14 Ocak' },
        { id: 2, company: 'Design Co', type: 'Logo', status: 'pending' },
        { id: 3, company: 'Startup Labs', type: 'Kurumsal Kimlik', status: 'approved', date: '10 Ocak' },
    ]);

    const handleApprove = (id: number, company: string) => {
        Alert.alert(
            'Onayla',
            `${company} briefini onaylamak istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Onayla',
                    onPress: () => {
                        setBriefs(prev => prev.map(b =>
                            b.id === id ? { ...b, status: 'approved' as const } : b
                        ));
                        Alert.alert('Başarılı', `${company} briefi onaylandı`);
                    },
                },
            ]
        );
    };

    const pending = briefs.filter(b => b.status === 'submitted');
    const others = briefs.filter(b => b.status !== 'submitted');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Briefler</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Pending Section */}
                {pending.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>ONAY BEKLİYOR</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{pending.length}</Text>
                            </View>
                        </View>

                        {pending.map(brief => (
                            <View key={brief.id} style={styles.pendingCard}>
                                <View style={styles.pendingHeader}>
                                    <View>
                                        <Text style={styles.pendingCompany}>{brief.company}</Text>
                                        <Text style={styles.pendingType}>{brief.type}</Text>
                                    </View>
                                    {brief.date && (
                                        <Text style={styles.pendingDate}>{brief.date}</Text>
                                    )}
                                </View>
                                <View style={styles.pendingActions}>
                                    <TouchableOpacity
                                        style={styles.viewBtn}
                                        onPress={() => Alert.alert('Brief', `${brief.company} - ${brief.type}`)}
                                    >
                                        <Text style={styles.viewBtnText}>İncele</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.approveBtn}
                                        onPress={() => handleApprove(brief.id, brief.company)}
                                    >
                                        <Text style={styles.approveBtnText}>Onayla</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Other Briefs */}
                <Text style={styles.sectionLabel}>TÜM BRİEFLER</Text>

                {others.map(brief => (
                    <TouchableOpacity key={brief.id} style={styles.card} activeOpacity={0.7}>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardCompany}>{brief.company}</Text>
                            <Text style={styles.cardType}>{brief.type}</Text>
                        </View>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: brief.status === 'approved' ? COLORS.success : COLORS.textMuted }
                        ]} />
                    </TouchableOpacity>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
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
    scroll: {
        flex: 1,
        padding: SPACING.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
    },
    sectionLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textMuted,
        letterSpacing: 2,
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
    },
    badge: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        marginLeft: SPACING.sm,
        marginBottom: SPACING.md,
    },
    badgeText: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
    },
    pendingCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.warningLight,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.warning,
    },
    pendingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    pendingCompany: {
        fontSize: FONTS.md,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    pendingType: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    pendingDate: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
    pendingActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    viewBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.divider,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    viewBtnText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    approveBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.success,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    approveBtnText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.textInverse,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardContent: {
        flex: 1,
    },
    cardCompany: {
        fontSize: FONTS.base,
        fontWeight: FONTS.semibold,
        color: COLORS.text,
    },
    cardType: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
