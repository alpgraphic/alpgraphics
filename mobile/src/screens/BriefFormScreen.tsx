import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { apiRequest } from '../lib/auth';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'BriefForm'>;
    route: RouteProp<RootStackParamList, 'BriefForm'>;
};

interface BriefQuestion {
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect';
    placeholder?: string;
    options?: string[];
    required?: boolean;
}

interface BriefType {
    id: string;
    name: string;
    description: string;
    questions: BriefQuestion[];
}

export default function BriefFormScreen({ navigation, route }: Props) {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [template, setTemplate] = useState<BriefType | null>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [status, setStatus] = useState<'none' | 'pending' | 'submitted' | 'approved'>('pending');

    const loadBriefData = useCallback(async () => {
        try {
            // Sadece Müşteri (Client) olarak kendi brief bilgilerini alıyoruz
            const result = await apiRequest<{ data: any }>('/api/mobile/briefs');

            if (result.success && result.data?.data) {
                const data = result.data.data;
                setStatus(data.status);

                if (data.formType) {
                    // API'den gelen form tipine göre Template'i yüklüyoruz
                    const tempResult = await apiRequest<{ template: BriefType }>(`/api/mobile/briefs/template?type=${data.formType}`);
                    if (tempResult.success && tempResult.data?.template) {
                        setTemplate(tempResult.data.template);
                    }
                }

                if (data.responses) {
                    setResponses(data.responses);
                }
            }
        } catch (error) {
            console.log('Brief template fetch failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBriefData();
    }, [loadBriefData]);

    const handleInputChange = (questionId: string, value: string | string[]) => {
        if (status !== 'pending') return; // Sadece pending durumunda değiştirilebilir
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleMultiSelectToggle = (questionId: string, option: string) => {
        if (status !== 'pending') return;
        const current = (responses[questionId] as string[]) || [];
        if (current.includes(option)) {
            handleInputChange(questionId, current.filter(o => o !== option));
        } else {
            handleInputChange(questionId, [...current, option]);
        }
    };

    const handleSubmit = async () => {
        if (!template) return;

        // Validasyon: Zorunlu alanların kontrolü
        const missingFields = template.questions.filter(q => q.required && !responses[q.id]);
        if (missingFields.length > 0) {
            Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu (*) alanları doldurun.');
            return;
        }

        Alert.alert(
            'Briefi Gönder',
            'Briefinizi iletmek istediğinize emin misiniz? Gönderildikten sonra düzenleme yapamazsınız.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Gönder',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const result = await apiRequest('/api/mobile/briefs', {
                                method: 'POST',
                                body: JSON.stringify({ responses })
                            });

                            if (result.success) {
                                Alert.alert('Başarılı', 'Briefiniz incelenmek üzere iletildi.');
                                navigation.goBack();
                            } else {
                                Alert.alert('Hata', result.error || 'Gönderim başarısız.');
                            }
                        } catch {
                            Alert.alert('Hata', 'Bağlantı hatası.');
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const isReadOnly = status === 'submitted' || status === 'approved';

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Brief Formu</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : !template ? (
                    <View style={styles.messageBox}>
                        <Text style={styles.messageText}>Size tanımlanmış bir form bulunmuyor.</Text>
                    </View>
                ) : (
                    <>
                        {isReadOnly && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    Bu brief {status === 'approved' ? 'onaylandı' : 'inceleme aşamasında'} olduğu için sadece okunabilir durumdadır.
                                </Text>
                            </View>
                        )}

                        {template.questions.map((question, index) => (
                            <View key={question.id} style={styles.questionCard}>
                                <Text style={styles.questionLabel}>
                                    {question.question} {question.required && <Text style={{ color: COLORS.error }}>*</Text>}
                                </Text>

                                {question.type === 'text' && (
                                    <TextInput
                                        style={[styles.input, isReadOnly && styles.inputDisabled]}
                                        value={(responses[question.id] as string) || ''}
                                        onChangeText={(text) => handleInputChange(question.id, text)}
                                        placeholder={question.placeholder}
                                        placeholderTextColor={COLORS.textMuted}
                                        editable={!isReadOnly}
                                    />
                                )}

                                {question.type === 'textarea' && (
                                    <TextInput
                                        style={[styles.inputArea, isReadOnly && styles.inputDisabled]}
                                        value={(responses[question.id] as string) || ''}
                                        onChangeText={(text) => handleInputChange(question.id, text)}
                                        placeholder={question.placeholder}
                                        placeholderTextColor={COLORS.textMuted}
                                        multiline
                                        numberOfLines={4}
                                        editable={!isReadOnly}
                                    />
                                )}

                                {(question.type === 'select' || question.type === 'multiselect') && (
                                    <View style={styles.tagsContainer}>
                                        {question.options?.map(option => {
                                            const isSelected = question.type === 'multiselect'
                                                ? ((responses[question.id] as string[]) || []).includes(option)
                                                : responses[question.id] === option;

                                            return (
                                                <TouchableOpacity
                                                    key={option}
                                                    disabled={isReadOnly}
                                                    onPress={() => {
                                                        if (question.type === 'multiselect') {
                                                            handleMultiSelectToggle(question.id, option);
                                                        } else {
                                                            handleInputChange(question.id, option);
                                                        }
                                                    }}
                                                    style={[
                                                        styles.tagBtn,
                                                        isSelected && styles.tagActive,
                                                        isReadOnly && !isSelected && styles.tagDisabled
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.tagText,
                                                        isSelected && styles.tagActiveText,
                                                        isReadOnly && !isSelected && styles.tagDisabledText
                                                    ]}>
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        ))}

                        {!isReadOnly && (
                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={COLORS.textInverse} />
                                ) : (
                                    <Text style={styles.submitBtnText}>Briefi İlet</Text>
                                )}
                            </TouchableOpacity>
                        )}
                        <View style={{ height: 40 }} />
                    </>
                )}
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
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        padding: SPACING.sm,
        marginLeft: -SPACING.sm,
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
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    messageBox: {
        backgroundColor: COLORS.surface,
        padding: SPACING.xl,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    messageText: {
        fontSize: FONTS.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    warningBox: {
        backgroundColor: COLORS.warningLight,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.lg,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
    },
    warningText: {
        fontSize: FONTS.sm,
        color: COLORS.warning,
        fontWeight: FONTS.semibold,
    },
    questionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    questionLabel: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONTS.base,
        color: COLORS.text,
    },
    inputArea: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONTS.base,
        color: COLORS.text,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputDisabled: {
        backgroundColor: COLORS.surface,
        color: COLORS.textSecondary,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.xs,
    },
    tagBtn: {
        backgroundColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    tagActive: {
        backgroundColor: COLORS.primary,
    },
    tagDisabled: {
        opacity: 0.5,
    },
    tagText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.medium,
        color: COLORS.text,
    },
    tagActiveText: {
        color: COLORS.textInverse,
    },
    tagDisabledText: {
        color: COLORS.textMuted,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        marginTop: SPACING.md,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: COLORS.textInverse,
        fontSize: FONTS.lg,
        fontWeight: FONTS.bold,
    }
});
