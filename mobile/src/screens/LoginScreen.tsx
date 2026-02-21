import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import { login } from '../lib/auth';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        const trimmedUsername = username.trim().toLowerCase();

        if (!trimmedUsername) {
            Alert.alert('', 'Kullanıcı adı gerekli');
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(trimmedUsername, password || undefined);

            if (result.requires2FA && result.adminId) {
                navigation.navigate('TwoFactor', { adminId: result.adminId });
            } else if (result.success) {
                // Auto-route based on role returned from backend
                if (result.role === 'admin') {
                    navigation.replace('AdminDashboard');
                } else {
                    navigation.replace('Dashboard');
                }
            } else {
                Alert.alert('Giriş Başarısız', result.error || 'Kullanıcı adı hatalı');
            }
        } catch (error) {
            Alert.alert('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.canGoBack() ? navigation.goBack() : null}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.backBtnText}>← Geri</Text>
                    </TouchableOpacity>

                    {/* Brand */}
                    <View style={styles.brandSection}>
                        <View style={styles.brand}>
                            <View style={styles.brandDot} />
                            <Text style={styles.brandText}>alpgraphics</Text>
                        </View>
                        <Text style={styles.brandSub}>Hesabınıza giriş yapın</Text>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="kullaniciadiniz"
                            placeholderTextColor={COLORS.textMuted}
                            value={username}
                            onChangeText={setUsername}
                            keyboardType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>
                            Şifre
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={COLORS.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.textInverse} size="small" />
                        ) : (
                            <Text style={styles.loginBtnText}>Giriş Yap →</Text>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password Hint */}
                    <TouchableOpacity style={styles.forgotSection} activeOpacity={0.6}>
                        <Text style={styles.forgotText}>Şifrenizi mi unuttunuz?</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={[styles.footerRow, { paddingBottom: insets.bottom + SPACING.md }]}>
                <Text style={styles.footer}>© 2026 alpgraphics</Text>
                {/* Gizli oyun girişleri 🎨 */}
                <View style={styles.gameHints}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Game')}
                        activeOpacity={0.4}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    >
                        <View style={styles.gameHint}>
                            {['#e07060', '#60a0e0', '#70c870'].map((c, i) => (
                                <View key={i} style={[styles.gameHintDot, { backgroundColor: c }]} />
                            ))}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ChromaDash')}
                        activeOpacity={0.4}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    >
                        <View style={styles.gameHint}>
                            {['#00e5ff', '#ff2d78', '#ffe000', '#39ff6a'].map((c, i) => (
                                <View key={i} style={[styles.gameHintDot, { backgroundColor: c }]} />
                            ))}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    backBtn: {
        marginBottom: SPACING.lg,
        alignSelf: 'flex-start',
    },
    backBtnText: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
        fontWeight: FONTS.medium,
    },
    brandSection: {
        marginBottom: SPACING.xxl,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.sm,
    },
    brandText: {
        fontSize: 28,
        fontWeight: FONTS.black,
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    brandSub: {
        fontSize: FONTS.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        marginLeft: SPACING.md + 2,
    },
    inputSection: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
        color: COLORS.textMuted,
        marginBottom: SPACING.sm,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md + 2,
        fontSize: FONTS.base,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    loginBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md + 4,
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    loginBtnDisabled: {
        opacity: 0.6,
    },
    loginBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
        letterSpacing: 0.5,
    },
    forgotSection: {
        alignItems: 'center',
    },
    forgotText: {
        fontSize: FONTS.sm,
        color: COLORS.textMuted,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    footer: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
    gameHints: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    gameHint: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    gameHintDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        opacity: 0.6,
    },
});
