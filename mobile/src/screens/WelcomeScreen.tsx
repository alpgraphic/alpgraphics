import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONTS, RADIUS } from '../lib/constants';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

// Floating cube component
function FloatingCube({
    size,
    startX,
    startY,
    delay,
    duration,
    color,
    opacity,
}: {
    size: number;
    startX: number;
    startY: number;
    delay: number;
    duration: number;
    color: string;
    opacity: number;
}) {
    const translateY = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 1200,
            delay,
            useNativeDriver: true,
        }).start();

        // Float up and down
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -20,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 20,
                    duration,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Slow rotation
        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: duration * 3,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotateInterpolate = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                top: startY,
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: size * 0.15,
                opacity: fadeIn.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, opacity],
                }),
                transform: [
                    { translateY },
                    { rotate: rotateInterpolate },
                ],
            }}
        />
    );
}

// Main dark cube in center
function MainCube() {
    const scale = useRef(new Animated.Value(0)).current;
    const glow = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Scale in with spring
        Animated.spring(scale, {
            toValue: 1,
            tension: 50,
            friction: 8,
            delay: 300,
            useNativeDriver: true,
        }).start();

        // Pulsing glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(glow, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(glow, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const cubeSize = Math.min(width * 0.28, 120);

    return (
        <View style={styles.mainCubeContainer}>
            {/* Glow effect behind cube */}
            <Animated.View
                style={[
                    styles.cubeGlow,
                    {
                        width: cubeSize * 1.8,
                        height: cubeSize * 1.8,
                        borderRadius: cubeSize * 0.4,
                        opacity: glow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.05, 0.15],
                        }),
                    },
                ]}
            />
            {/* Main cube */}
            <Animated.View
                style={[
                    styles.mainCube,
                    {
                        width: cubeSize,
                        height: cubeSize,
                        borderRadius: cubeSize * 0.15,
                        transform: [{ scale }],
                    },
                ]}
            >
                {/* Front face accent line */}
                <Animated.View
                    style={[
                        styles.cubeFaceLine,
                        {
                            opacity: glow.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.3, 0.8],
                            }),
                        },
                    ]}
                />
            </Animated.View>
        </View>
    );
}

export default function WelcomeScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;
    const btnFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Brand text fade in
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 800,
            delay: 600,
            useNativeDriver: true,
        }).start();

        // Slide up
        Animated.timing(slideUp, {
            toValue: 0,
            duration: 800,
            delay: 600,
            useNativeDriver: true,
        }).start();

        // Button appears last
        Animated.timing(btnFade, {
            toValue: 1,
            duration: 600,
            delay: 1200,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Floating background cubes */}
            <FloatingCube
                size={40} startX={width * 0.1} startY={height * 0.12}
                delay={200} duration={3000} color={COLORS.primary} opacity={0.06}
            />
            <FloatingCube
                size={24} startX={width * 0.75} startY={height * 0.08}
                delay={600} duration={2500} color="#1a1a1a" opacity={0.04}
            />
            <FloatingCube
                size={32} startX={width * 0.85} startY={height * 0.35}
                delay={400} duration={3500} color={COLORS.primary} opacity={0.05}
            />
            <FloatingCube
                size={18} startX={width * 0.05} startY={height * 0.45}
                delay={800} duration={2800} color="#1a1a1a" opacity={0.03}
            />
            <FloatingCube
                size={28} startX={width * 0.6} startY={height * 0.65}
                delay={300} duration={3200} color={COLORS.primary} opacity={0.04}
            />
            <FloatingCube
                size={20} startX={width * 0.2} startY={height * 0.72}
                delay={700} duration={2600} color="#1a1a1a" opacity={0.05}
            />

            {/* Center content */}
            <View style={styles.centerContent}>
                {/* Main 3D-like cube */}
                <MainCube />

                {/* Brand text */}
                <Animated.View
                    style={{
                        opacity: fadeIn,
                        transform: [{ translateY: slideUp }],
                        alignItems: 'center',
                        marginTop: SPACING.xxl,
                    }}
                >
                    <View style={styles.brandRow}>
                        <View style={styles.brandDot} />
                        <Text style={styles.brandText}>alpgraphics</Text>
                    </View>
                    <Text style={styles.tagline}>Creative Studio</Text>
                </Animated.View>
            </View>

            {/* Bottom section */}
            <Animated.View
                style={[
                    styles.bottomSection,
                    {
                        paddingBottom: insets.bottom + SPACING.lg,
                        opacity: btnFade,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.enterBtn}
                    onPress={() => navigation.replace('Login')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.enterBtnText}>Giriş Yap</Text>
                    <Text style={styles.enterBtnArrow}>→</Text>
                </TouchableOpacity>

                <Text style={styles.footer}>© 2026 alpgraphics</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainCubeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cubeGlow: {
        position: 'absolute',
        backgroundColor: COLORS.primary,
    },
    mainCube: {
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    cubeFaceLine: {
        width: '60%',
        height: 2,
        backgroundColor: COLORS.primary,
        borderRadius: 1,
    },
    brandRow: {
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
        fontSize: 32,
        fontWeight: FONTS.black,
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: FONTS.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    bottomSection: {
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
    },
    enterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md + 4,
        paddingHorizontal: SPACING.xxl,
        width: '100%',
        marginBottom: SPACING.lg,
    },
    enterBtnText: {
        fontSize: FONTS.base,
        fontWeight: FONTS.bold,
        color: COLORS.textInverse,
        letterSpacing: 0.5,
    },
    enterBtnArrow: {
        fontSize: FONTS.lg,
        color: COLORS.textInverse,
        marginLeft: SPACING.sm,
    },
    footer: {
        fontSize: FONTS.xs,
        color: COLORS.textMuted,
    },
});
