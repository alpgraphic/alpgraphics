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

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [role, setRole] = useState<'admin' | 'client'>('client');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('', 'E-posta ve şifre gerekli');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (role === 'admin') {
                navigation.replace('AdminDashboard');
            } else {
                if (email === 'ahmet@techstart.tr' && password === 'techstart2026') {
                    navigation.replace('Dashboard');
                } else {
                    Alert.alert('', 'Hatalı giriş bilgileri');
                }
            }
        }, 500);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                    {/* Brand */}
                    <View style={styles.brandSection}>
                        <View style={styles.brand}>
                            <View style={styles.brandDot} />
                            <Text style={styles.brandText}>alpgraphics</Text>
                        </View>
                        <Text style={styles.brandSub}>Müşteri Portalı</Text>
                    </View>

                    {/* Role Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, role === 'admin' && styles.toggleActive]}
                            onPress={() => setRole('admin')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.toggleText, role === 'admin' && styles.toggleTextActive]}>
                                Admin
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, role === 'client' && styles.toggleActive]}
                            onPress={() => setRole('client')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.toggleText, role === 'client' && styles.toggleTextActive]}>
                                Client
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>E-posta</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ornek@firma.com"
                            placeholderTextColor={COLORS.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>Şifre</Text>
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

                    {/* Demo */}
                    {role === 'client' && (
                        <View style={styles.demoSection}>
                            <Text style={styles.demoLabel}>Demo hesap</Text>
                            <Text style={styles.demoValue}>ahmet@techstart.tr / techstart2026</Text>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>

            {/* Footer */}
            <Text style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
                © 2026 alpgraphics
            </Text>
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
    brandSection: {
        marginBottom: SPACING.xxl + SPACING.lg,
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: 4,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: SPACING.md - 2,
        alignItems: 'center',
        borderRadius: RADIUS.md,
    },
    toggleActive: {
        backgroundColor: COLORS.text,
    },
    toggleText: {
        fontSize: FONTS.sm,
        fontWeight: FONTS.semibold,
        color: COLORS.textMuted,
    },
    toggleTextActive: {
        color: COLORS.textInverse,
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
    demoSection: {
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.primaryLight,
        borderRadius: RADIUS.md,
    },
    demoLabel: {
        fontSize: FONTS.xs,
        fontWeight: FONTS.semibold,
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    demoValue: {
        fontSize: FONTS.sm,
        color: COLORS.textSecondary,
    },
    footer: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
