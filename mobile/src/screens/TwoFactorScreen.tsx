import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    StatusBar,
    Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { verify2FA } from '../lib/auth';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'TwoFactor'>;
    route: RouteProp<RootStackParamList, 'TwoFactor'>;
};

export default function TwoFactorScreen({ navigation, route }: Props) {
    const insets = useSafeAreaInsets();
    const { adminId } = route.params;
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const handleCodeChange = (text: string, index: number) => {
        // Only allow digits
        const digit = text.replace(/[^0-9]/g, '');

        const newCode = [...code];

        if (digit.length > 1) {
            // Handle paste of full code
            const digits = digit.slice(0, 6).split('');
            digits.forEach((d, i) => {
                if (i < 6) newCode[i] = d;
            });
            setCode(newCode);
            if (digits.length >= 6) {
                Keyboard.dismiss();
                submitCode(newCode.join(''));
            } else {
                inputRefs.current[Math.min(digits.length, 5)]?.focus();
            }
            return;
        }

        newCode[index] = digit;
        setCode(newCode);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        const fullCode = newCode.join('');
        if (fullCode.length === 6 && !newCode.includes('')) {
            Keyboard.dismiss();
            submitCode(fullCode);
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            const newCode = [...code];
            newCode[index - 1] = '';
            setCode(newCode);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const submitCode = async (codeStr: string) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const result = await verify2FA(adminId, codeStr);

            if (result.success) {
                // verify2FA in auth.ts already stores full user data with account info
                navigation.replace('AdminDashboard');
            } else {
                Alert.alert('Hata', result.error || 'Dogrulama basarisiz');
                // Clear code on failure
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch {
            Alert.alert('Hata', 'Baglanti hatasi. Lutfen tekrar deneyin.');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backText}>{'<'} Geri</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>🔐</Text>
                    </View>
                    <Text style={styles.title}>Iki Adimli Dogrulama</Text>
                    <Text style={styles.subtitle}>
                        Authenticator uygulamanizdan{'\n'}6 haneli kodu girin
                    </Text>
                </View>

                {/* Code inputs */}
                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.codeInput,
                                digit ? styles.codeInputFilled : null,
                            ]}
                            value={digit}
                            onChangeText={(text) => handleCodeChange(text, index)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={index === 0 ? 6 : 1}
                            selectTextOnFocus
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                {/* Verify button */}
                <TouchableOpacity
                    style={[styles.verifyBtn, isLoading && styles.verifyBtnDisabled]}
                    onPress={() => submitCode(code.join(''))}
                    disabled={isLoading || code.includes('')}
                    activeOpacity={0.85}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.textInverse} size="small" />
                    ) : (
                        <Text style={styles.verifyBtnText}>Dogrula</Text>
                    )}
                </TouchableOpacity>

                {/* Help text */}
                <Text style={styles.helpText}>
                    Google Authenticator veya benzeri bir TOTP{'\n'}
                    uygulamasindaki kodu kullanin.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    backBtn: {
        marginBottom: SPACING.xl,
    },
    backText: {
        fontSize: FONTS.base,
        color: COLORS.primary,
        fontWeight: FONTS.semibold,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    iconText: {
        fontSize: 32,
    },
    title: {
        fontSize: FONTS.xl,
        fontWeight: FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONTS.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: SPACING.xl,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderRadius: RADIUS.md,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        textAlign: 'center',
        fontSize: FONTS.xl,
        fontWeight: FONTS.bold,
        color: COLORS.text,
    },
    codeInputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    verifyBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md + 4,
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    verifyBtnDisabled: {
        opacity: 0.5,
    },
    verifyBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
        letterSpacing: 0.5,
    },
    helpText: {
        fontSize: FONTS.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
});
