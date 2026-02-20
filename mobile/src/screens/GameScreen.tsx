/**
 * Renk Ustası — Renk Eşleştirme Oyunu v2
 * Tasarım stüdyosuna özel gizli oyun 🎨
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'menu' | 'playing' | 'roundEnd' | 'gameEnd';
interface HSL { h: number; s: number; l: number }

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS   = 7;
const ROUND_TIME     = 15;
const MAX_PER_ROUND  = 120;   // 100 accuracy + 20 speed bonus
const MAX_TOTAL      = TOTAL_ROUNDS * MAX_PER_ROUND; // 840
const HIGH_SCORE_KEY = 'renk_ustasi_high_score_v2';

// 7 turda artan zorluk
const ROUND_CFG = [
    { sMin: 70, sMax: 95, lMin: 42, lMax: 58, label: 'Kolay'  },   // Tur 1
    { sMin: 65, sMax: 90, lMin: 38, lMax: 62, label: 'Kolay'  },   // Tur 2
    { sMin: 50, sMax: 90, lMin: 32, lMax: 68, label: 'Orta'   },   // Tur 3
    { sMin: 40, sMax: 88, lMin: 25, lMax: 75, label: 'Orta'   },   // Tur 4
    { sMin: 25, sMax: 88, lMin: 18, lMax: 82, label: 'Zor'    },   // Tur 5
    { sMin: 15, sMax: 92, lMin: 14, lMax: 86, label: 'Zor'    },   // Tur 6
    { sMin: 5,  sMax: 95, lMin: 10, lMax: 90, label: 'Efsane' },   // Tur 7
];

// Anlık tur sonu mesajları
const SCORE_MSGS = [
    { min: 110, msg: '⚡ HIZLI VE KUSURSUZ!', sub: 'Hız bonusu kazandın!',         color: '#8b5cf6' },
    { min: 93,  msg: '🎨 MÜKEMMEL!',          sub: 'Renk dahisi!',                color: '#1a7f37' },
    { min: 80,  msg: '✨ HARİKA!',             sub: 'Göz eğitimin var.',           color: '#3b82f6' },
    { min: 65,  msg: '👏 İYİ!',               sub: 'Güzel gidiyor.',              color: '#7c3aed' },
    { min: 45,  msg: '🙂 FENA DEĞİL',         sub: 'Biraz daha pratik yap.',      color: '#9a6700' },
    { min: 0,   msg: '😅 DEVAM ET',           sub: 'Zorluk artıyor, çalış!',      color: COLORS.primary },
];

// Final unvanları (0–840 / MAX_TOTAL)
const RANKS = [
    { pct: 0.90, title: 'Renk Tanrısı',    emoji: '🌈', color: '#8b5cf6' },
    { pct: 0.75, title: 'Renk Ustası',     emoji: '🎨', color: '#1a7f37' },
    { pct: 0.60, title: 'Renk Sanatçısı',  emoji: '✨', color: '#3b82f6' },
    { pct: 0.45, title: 'Renk Öğrencisi',  emoji: '📚', color: '#9a6700' },
    { pct: 0.28, title: 'Renk Acemisi',    emoji: '🎯', color: '#6b7280' },
    { pct: 0,    title: 'Renk Körü',       emoji: '😵', color: '#ef4444' },
];

// ─── Renk Matematiği ──────────────────────────────────────────────────────────

function hsl(h: number, s: number, l: number): string {
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function colorScore(target: HSL, user: HSL): number {
    let dh = Math.abs(target.h - user.h);
    if (dh > 180) dh = 360 - dh;
    const dist = (dh / 180) * 0.50 + (Math.abs(target.s - user.s) / 100) * 0.25 + (Math.abs(target.l - user.l) / 100) * 0.25;
    return Math.round(Math.max(0, 100 - dist * 155));
}

function liveMatch(target: HSL, user: HSL): number {
    let dh = Math.abs(target.h - user.h);
    if (dh > 180) dh = 360 - dh;
    const dist = (dh / 180) * 0.50 + (Math.abs(target.s - user.s) / 100) * 0.25 + (Math.abs(target.l - user.l) / 100) * 0.25;
    return Math.round(Math.max(0, 100 - dist * 100));
}

function randomTarget(roundIndex: number): HSL {
    const cfg = ROUND_CFG[Math.min(roundIndex, ROUND_CFG.length - 1)];
    return {
        h: Math.floor(Math.random() * 360),
        s: Math.floor(Math.random() * (cfg.sMax - cfg.sMin) + cfg.sMin),
        l: Math.floor(Math.random() * (cfg.lMax - cfg.lMin) + cfg.lMin),
    };
}

function getMsg(score: number) {
    return SCORE_MSGS.find(m => score >= m.min) ?? SCORE_MSGS[SCORE_MSGS.length - 1];
}

function getRank(total: number) {
    const pct = total / MAX_TOTAL;
    return RANKS.find(r => pct >= r.pct) ?? RANKS[RANKS.length - 1];
}

// ─── Gradyan Slider (v2 — pageX ile tam doğru konum) ─────────────────────────

interface SliderProps {
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
    colors: readonly string[];
    label: string;
    display: string;
}

const THUMB_HALF = 14; // yarım thumb genişliği (28/2)

function GradientSlider({ value, min, max, onChange, colors, label, display }: SliderProps) {
    const trackRef    = useRef<View>(null);
    const trackInfo   = useRef({ pageX: 0, width: 280 });
    const [tWidth, setTWidth] = useState(280);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const computeValue = useCallback((pageX: number) => {
        const x     = pageX - trackInfo.current.pageX;
        const ratio = Math.max(0, Math.min(1, x / trackInfo.current.width));
        onChangeRef.current(Math.round(min + ratio * (max - min)));
    }, [min, max]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder:  () => true,
            onPanResponderGrant: (e) => {
                // Ölçümü yenile (sayfa içi kaydırmadan korunmak için)
                trackRef.current?.measure((_x, _y, w, _h, px) => {
                    trackInfo.current.pageX  = px;
                    trackInfo.current.width  = w || trackInfo.current.width;
                });
                computeValue(e.nativeEvent.pageX);
            },
            onPanResponderMove: (e) => {
                computeValue(e.nativeEvent.pageX);
            },
        })
    ).current;

    // Thumb'ın left değeri: 0..tWidth aralığında, thumbun MERKEZİ çizginin üzerinde
    const thumbLeft = useMemo(() => {
        const pct = (value - min) / (max - min);
        return Math.max(-THUMB_HALF, Math.min(tWidth - THUMB_HALF, pct * tWidth - THUMB_HALF));
    }, [value, min, max, tWidth]);

    return (
        <View style={sld.wrap}>
            <View style={sld.row}>
                <Text style={sld.label}>{label}</Text>
                <Text style={sld.val}>{display}</Text>
            </View>
            <View
                ref={trackRef}
                style={sld.trackOuter}
                onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    setTWidth(w);
                    trackInfo.current.width = w;
                    trackRef.current?.measure((_x, _y, _w, _h, px) => {
                        trackInfo.current.pageX = px;
                    });
                }}
                {...panResponder.panHandlers}
            >
                {/* Gradient çizgisi — tam genişlik, overflow:hidden ile köşe yuvarlama */}
                <View style={sld.trackInner} pointerEvents="none">
                    <LinearGradient
                        colors={colors as string[]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>
                {/* Thumb — piksel cinsinden doğru konum */}
                <View style={[sld.thumb, { left: thumbLeft }]} pointerEvents="none" />
            </View>
        </View>
    );
}

const sld = StyleSheet.create({
    wrap: { marginBottom: 14 },
    row:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
    val:   { fontSize: 12, fontWeight: '700', color: COLORS.text },
    // Dış kap: tam genişlik dokunma alanı (thumb taşması için overflow visible varsayılan)
    trackOuter: {
        height: 28,
        justifyContent: 'center',
    },
    // İç kap: gradient çizgisi — overflow hidden ile köşe yuvarlama
    trackInner: {
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
    },
    // Thumb — left piksel olarak hesaplanır (pct * tWidth - THUMB_HALF)
    thumb: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 2.5,
        borderColor: 'rgba(0,0,0,0.14)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
        elevation: 6,
    },
});

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function GameScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();

    const [phase,       setPhase]       = useState<Phase>('menu');
    const [round,       setRound]       = useState(1);
    const [target,      setTarget]      = useState<HSL>({ h: 0,   s: 70, l: 50 });
    const [user,        setUser]        = useState<HSL>({ h: 180, s: 50, l: 50 });
    const [roundScores, setRoundScores] = useState<number[]>([]);
    const roundScoresRef = useRef<number[]>([]);
    const [lastScore,   setLastScore]   = useState(0);
    const [lastAccuracy, setLastAccuracy] = useState(0);
    const [lastBonus,   setLastBonus]   = useState(0);
    const [timeLeft,    setTimeLeft]    = useState(ROUND_TIME);
    const [highScore,   setHighScore]   = useState(0);

    const timerAnim  = useRef(new Animated.Value(1)).current;
    const scoreAnim  = useRef(new Animated.Value(0)).current;
    const swatchAnim = useRef(new Animated.Value(0)).current;
    const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeLeftRef = useRef(ROUND_TIME);

    // Yüksek skor yükle
    useEffect(() => {
        SecureStore.getItemAsync(HIGH_SCORE_KEY).then(v => {
            if (v) setHighScore(parseInt(v, 10) || 0);
        }).catch(() => {});
    }, []);

    // Bileşen çözülünce temizle
    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        timerAnim.stopAnimation();
    }, [timerAnim]);

    const startRound = useCallback((r: number) => {
        const t = randomTarget(r - 1);
        const startH = (t.h + 150 + Math.floor(Math.random() * 61)) % 360;
        setTarget(t);
        setUser({ h: startH, s: 50, l: 50 });
        setRound(r);
        setTimeLeft(ROUND_TIME);
        timeLeftRef.current = ROUND_TIME;
        setPhase('playing');

        timerAnim.setValue(1);
        Animated.timing(timerAnim, {
            toValue: 0,
            duration: ROUND_TIME * 1000,
            useNativeDriver: false,
        }).start();

        timerRef.current = setInterval(() => {
            timeLeftRef.current -= 1;
            setTimeLeft(timeLeftRef.current);
            if (timeLeftRef.current <= 0) {
                clearInterval(timerRef.current!);
                timerRef.current = null;
            }
        }, 1000);
    }, [timerAnim]);

    // Süre bitince otomatik kilitle
    useEffect(() => {
        if (phase === 'playing' && timeLeft === 0) submitAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, phase]);

    const submitAnswer = useCallback(() => {
        stopTimer();
        const accuracy = colorScore(target, user);
        // Hız bonusu: doğruluk ≥ 80 ve kalan süre ≥ 5s ise +20
        const speedBonus = (accuracy >= 80 && timeLeftRef.current >= 5) ? 20 : 0;
        const score = accuracy + speedBonus;
        const newScores = [...roundScoresRef.current, score];
        roundScoresRef.current = newScores;
        setRoundScores(newScores);
        setLastScore(score);
        setLastAccuracy(accuracy);
        setLastBonus(speedBonus);
        setPhase('roundEnd');

        scoreAnim.setValue(0);
        swatchAnim.setValue(0);
        Animated.parallel([
            Animated.spring(scoreAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
            Animated.timing(swatchAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
    }, [target, user, stopTimer, scoreAnim, swatchAnim]);

    const nextRound = useCallback(async () => {
        if (round >= TOTAL_ROUNDS) {
            const total = roundScoresRef.current.reduce((a, b) => a + b, 0);
            if (total > highScore) {
                setHighScore(total);
                await SecureStore.setItemAsync(HIGH_SCORE_KEY, String(total)).catch(() => {});
            }
            setPhase('gameEnd');
        } else {
            startRound(round + 1);
        }
    }, [round, highScore, startRound]);

    const restartGame = useCallback(() => {
        roundScoresRef.current = [];
        setRoundScores([]);
        startRound(1);
    }, [startRound]);

    // ─── Hesaplanan değerler ──────────────────────────────────────────────────

    const match        = phase === 'playing' ? liveMatch(target, user) : 0;
    const currentTotal = roundScores.reduce((a, b) => a + b, 0);
    const finalTotal   = roundScoresRef.current.reduce((a, b) => a + b, 0);

    const hueGrad = ['#ff0000','#ffaa00','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ff0000'] as const;
    const satGrad = [hsl(user.h, 0, user.l), hsl(user.h, 100, user.l)];
    const litGrad = ['#111111', hsl(user.h, user.s, 50), '#ffffff'];

    const timerColor = timerAnim.interpolate({ inputRange: [0, 0.33, 1], outputRange: ['#cf222e', '#9a6700', '#1a7f37'] });
    const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    const matchColor = match >= 85 ? COLORS.success : match >= 60 ? '#9a6700' : COLORS.primary;
    const diffLabel  = ROUND_CFG[Math.min(round - 1, ROUND_CFG.length - 1)].label;

    // =========================================================================
    // MENÜ
    // =========================================================================

    if (phase === 'menu') return (
        <View style={[g.screen, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            <TouchableOpacity style={g.backRow} onPress={() => navigation.goBack()}>
                <Text style={g.backTxt}>← Geri</Text>
            </TouchableOpacity>

            {/* Renk noktaları dekor */}
            <View style={g.dotsRow}>
                {[0, 51, 103, 154, 205, 257, 308].map((h, i) => (
                    <View key={i} style={[g.dotCircle, { backgroundColor: hsl(h, 72, 55) }]} />
                ))}
            </View>

            <View style={g.menuCenter}>
                <Text style={g.titleLine1}>RENK</Text>
                <Text style={[g.titleLine2, { color: COLORS.primary }]}>USTASI</Text>
                <Text style={g.titleSub}>Gözlerin ne kadar keskin?</Text>

                <View style={g.infoCard}>
                    <Text style={g.infoRow}>🎨  Hedef rengi sliderlarla eşleştir</Text>
                    <Text style={g.infoRow}>⏱  Her turda {ROUND_TIME} saniye, toplam {TOTAL_ROUNDS} tur</Text>
                    <Text style={g.infoRow}>⚡  Hızlı ve doğru oynayınca bonus puan</Text>
                    <Text style={g.infoRow}>🏆  {MAX_TOTAL} üzerinden puan kazan, unvan kazan</Text>
                </View>

                {highScore > 0 && (
                    <View style={g.hsBox}>
                        <Text style={g.hsLabel}>EN İYİ SKOR</Text>
                        <Text style={g.hsVal}>{highScore}<Text style={g.hsMax}> / {MAX_TOTAL}</Text></Text>
                        <Text style={g.hsRank}>{getRank(highScore).emoji} {getRank(highScore).title}</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                onPress={restartGame}
                activeOpacity={0.85}
                style={{ paddingBottom: insets.bottom + SPACING.lg }}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={g.playBtn}
                >
                    <Text style={g.playTxt}>OYNA</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // =========================================================================
    // OYNUYOR
    // =========================================================================

    if (phase === 'playing') return (
        <View style={[g.screen, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Üst bar */}
            <View style={g.playHeader}>
                <TouchableOpacity onPress={() => { stopTimer(); setPhase('menu'); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={g.exitTxt}>← Çık</Text>
                </TouchableOpacity>
                <View style={g.headerCenter}>
                    <Text style={g.roundTxt}>TUR {round}/{TOTAL_ROUNDS}</Text>
                    <Text style={g.diffTxt}>{diffLabel}</Text>
                </View>
                <Text style={[g.timeTxt, timeLeft <= 5 && g.timeUrgent]}>{timeLeft}s</Text>
            </View>

            {/* Süre çubuğu */}
            <View style={g.timerTrack}>
                <Animated.View style={[g.timerFill, { width: timerWidth, backgroundColor: timerColor }]} />
            </View>

            {/* Renk göstergeleri — iki kolum */}
            <View style={g.colorDisplay}>
                <View style={[g.colorColumn, { backgroundColor: hsl(target.h, target.s, target.l) }]}>
                    <Text style={g.colorColumnLbl}>HEDEF</Text>
                </View>

                <View style={g.centerDivider}>
                    <Text style={[g.matchNum, { color: matchColor }]}>{match}</Text>
                    <Text style={g.matchPct}>%</Text>
                    <Text style={g.matchLbl}>eşl.</Text>
                </View>

                <View style={[g.colorColumn, { backgroundColor: hsl(user.h, user.s, user.l) }]}>
                    <Text style={g.colorColumnLbl}>SENİN</Text>
                </View>
            </View>

            {/* Sliderlar */}
            <View style={g.slidersWrap}>
                <GradientSlider
                    value={user.h} min={0} max={360}
                    onChange={h => setUser(u => ({ ...u, h }))}
                    colors={hueGrad} label="TON" display={`${user.h}°`}
                />
                <GradientSlider
                    value={user.s} min={0} max={100}
                    onChange={s => setUser(u => ({ ...u, s }))}
                    colors={satGrad} label="DOYGUNLUK" display={`${user.s}%`}
                />
                <GradientSlider
                    value={user.l} min={0} max={100}
                    onChange={l => setUser(u => ({ ...u, l }))}
                    colors={litGrad} label="PARLAKLIK" display={`${user.l}%`}
                />
            </View>

            {/* Skor çubuğu */}
            <View style={g.scoreBarRow}>
                <Text style={g.scoreBarTxt}>Puan: {currentTotal}</Text>
                <Text style={g.scoreBarMax}>/ {MAX_TOTAL}</Text>
            </View>

            {/* Kilitle butonu */}
            <TouchableOpacity
                onPress={submitAnswer}
                activeOpacity={0.85}
                style={{ paddingBottom: insets.bottom + SPACING.sm }}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={g.lockBtn}
                >
                    <Text style={g.lockTxt}>🔒  KİLİTLE</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // =========================================================================
    // TUR SONU
    // =========================================================================

    if (phase === 'roundEnd') {
        const msg       = getMsg(lastScore);
        const scaleStyle = {
            transform: [{ scale: scoreAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 1.1, 1] }) }],
            opacity: scoreAnim,
        };

        return (
            <View style={[g.screen, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" />

                <View style={g.resultWrap}>
                    {/* Skor */}
                    <Animated.View style={[g.scoreReveal, scaleStyle]}>
                        <Text style={[g.scoreRevealNum, { color: msg.color }]}>+{lastScore}</Text>
                        {lastBonus > 0 && (
                            <Text style={g.bonusBadge}>⚡ +{lastBonus} hız bonusu</Text>
                        )}
                        <Text style={[g.scoreRevealMsg, { color: msg.color }]}>{msg.msg}</Text>
                        <Text style={g.scoreRevealSub}>{msg.sub}</Text>
                        {lastBonus === 0 && lastAccuracy >= 80 && (
                            <Text style={g.bonusHint}>Daha hızlı kilitlersek +20 bonus!</Text>
                        )}
                    </Animated.View>

                    {/* Karşılaştırma swatchları */}
                    <Animated.View style={[g.compareRow, { opacity: swatchAnim }]}>
                        <View style={g.cmpGroup}>
                            <View style={[g.cmpSwatch, { backgroundColor: hsl(target.h, target.s, target.l) }]} />
                            <Text style={g.cmpLbl}>Hedef</Text>
                            <Text style={g.cmpVal}>{target.h}° {target.s}% {target.l}%</Text>
                        </View>
                        <View style={g.cmpDivider}>
                            <Text style={g.cmpVs}>{lastAccuracy}%</Text>
                            <Text style={g.cmpVsLbl}>doğr.</Text>
                        </View>
                        <View style={g.cmpGroup}>
                            <View style={[g.cmpSwatch, { backgroundColor: hsl(user.h, user.s, user.l) }]} />
                            <Text style={g.cmpLbl}>Senin</Text>
                            <Text style={g.cmpVal}>{user.h}° {user.s}% {user.l}%</Text>
                        </View>
                    </Animated.View>

                    {/* İlerleme */}
                    <View style={g.progressRow}>
                        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                            const s = roundScores[i];
                            return (
                                <View key={i} style={[
                                    g.progressDot,
                                    s !== undefined && { backgroundColor: getMsg(s).color, width: 38 },
                                ]}>
                                    {s !== undefined && <Text style={g.progressDotTxt}>{s}</Text>}
                                </View>
                            );
                        })}
                    </View>
                    <Text style={g.runningTotal}>Toplam: {currentTotal} / {MAX_TOTAL}</Text>
                </View>

                <TouchableOpacity
                    onPress={nextRound}
                    activeOpacity={0.85}
                    style={{ paddingBottom: insets.bottom + SPACING.lg }}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={g.nextBtn}
                    >
                        <Text style={g.nextTxt}>
                            {round >= TOTAL_ROUNDS ? 'SONUÇLARA GİT →' : `TUR ${round + 1}  →  ${ROUND_CFG[round].label}`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    // =========================================================================
    // OYUN SONU
    // =========================================================================

    const rank      = getRank(finalTotal);
    const pct       = Math.round(finalTotal / MAX_TOTAL * 100);
    const isRecord  = finalTotal > 0 && finalTotal >= highScore;

    return (
        <View style={[g.screen, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            <View style={g.endWrap}>
                {isRecord && (
                    <View style={g.recordBadge}>
                        <Text style={g.recordTxt}>🏆 YENİ REKOR!</Text>
                    </View>
                )}

                <Text style={g.endTitle}>OYUN BİTTİ</Text>

                {/* Unvan */}
                <View style={g.rankBox}>
                    <Text style={g.rankEmoji}>{rank.emoji}</Text>
                    <Text style={[g.rankTitle, { color: rank.color }]}>{rank.title}</Text>
                </View>

                <View style={g.finalScoreRow}>
                    <Text style={[g.finalNum, { color: rank.color }]}>{finalTotal}</Text>
                    <Text style={g.finalMax}> / {MAX_TOTAL}</Text>
                </View>
                <Text style={g.finalPct}>%{pct} doğruluk</Text>

                {/* Tur bazlı skor */}
                <View style={g.scoreList}>
                    {roundScoresRef.current.map((s, i) => {
                        const m = getMsg(s);
                        return (
                            <View key={i} style={g.scoreListRow}>
                                <Text style={g.scoreListIdx}>Tur {i + 1}</Text>
                                <View style={g.scoreListTrack}>
                                    <View style={[g.scoreListFill, { width: `${Math.round(s / MAX_PER_ROUND * 100)}%`, backgroundColor: m.color }]} />
                                </View>
                                <Text style={[g.scoreListVal, { color: m.color }]}>{s}</Text>
                            </View>
                        );
                    })}
                </View>

                {!isRecord && highScore > 0 && (
                    <Text style={g.prevRecord}>Rekorum: {highScore} / {MAX_TOTAL}  ({getRank(highScore).title})</Text>
                )}
            </View>

            <View style={[g.endBtns, { paddingBottom: insets.bottom + SPACING.md }]}>
                <TouchableOpacity onPress={restartGame} activeOpacity={0.85} style={{ flex: 1 }}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={g.replayBtn}
                    >
                        <Text style={g.replayTxt}>TEKRAR OYNA</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPhase('menu')} activeOpacity={0.7} style={g.menuBtn}>
                    <Text style={g.menuBtnTxt}>Menü</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const g = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.lg,
    },

    // ── Menü
    backRow:    { marginTop: SPACING.sm, marginBottom: SPACING.sm },
    backTxt:    { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: FONTS.medium },
    dotsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.md },
    dotCircle:  { width: 16, height: 16, borderRadius: 8 },
    menuCenter: { flex: 1, justifyContent: 'center' },
    titleLine1: { fontSize: 48, fontWeight: '900', color: COLORS.text, letterSpacing: -1, lineHeight: 50 },
    titleLine2: { fontSize: 48, fontWeight: '900', letterSpacing: -1, lineHeight: 54, marginBottom: SPACING.xs },
    titleSub:   { fontSize: FONTS.base, color: COLORS.textMuted, marginBottom: SPACING.lg },
    infoCard: {
        backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
        padding: SPACING.md, marginBottom: SPACING.lg,
        borderWidth: 1, borderColor: COLORS.border,
    },
    infoRow:    { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 24 },
    hsBox:      { alignItems: 'center', marginBottom: SPACING.md },
    hsLabel:    { fontSize: FONTS.xs, fontWeight: FONTS.semibold, color: COLORS.textMuted, letterSpacing: 1 },
    hsVal:      { fontSize: 40, fontWeight: '900', color: COLORS.text, marginTop: 2 },
    hsMax:      { fontSize: FONTS.lg, fontWeight: FONTS.regular, color: COLORS.textMuted },
    hsRank:     { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
    playBtn:    { borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 4, alignItems: 'center' },
    playTxt:    { fontSize: FONTS.md, fontWeight: '800', color: '#fff', letterSpacing: 2 },

    // ── Oynuyor
    playHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
    exitTxt:    { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: FONTS.medium },
    headerCenter: { alignItems: 'center' },
    roundTxt:   { fontSize: FONTS.sm, fontWeight: '800', color: COLORS.text },
    diffTxt:    { fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.5 },
    timeTxt:    { fontSize: FONTS.md, fontWeight: '900', color: COLORS.text, minWidth: 32, textAlign: 'right' },
    timeUrgent: { color: '#cf222e' },
    timerTrack: { height: 5, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: SPACING.sm, overflow: 'hidden' },
    timerFill:  { height: '100%', borderRadius: 3 },

    // Renk göstergeleri
    colorDisplay: { flex: 1, flexDirection: 'row', gap: 3, marginBottom: SPACING.sm },
    colorColumn: {
        flex: 1,
        borderRadius: RADIUS.lg,
        justifyContent: 'flex-end',
        paddingBottom: SPACING.sm,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    colorColumnLbl: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    centerDivider: { width: 48, alignItems: 'center', justifyContent: 'center' },
    matchNum:   { fontSize: 28, fontWeight: '900', lineHeight: 32 },
    matchPct:   { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, marginTop: -4 },
    matchLbl:   { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },

    slidersWrap: { marginBottom: SPACING.xs },
    scoreBarRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: SPACING.sm, gap: 4 },
    scoreBarTxt: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text },
    scoreBarMax: { fontSize: FONTS.xs, color: COLORS.textMuted },
    lockBtn:    { borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center' },
    lockTxt:    { fontSize: FONTS.base, fontWeight: '800', color: '#fff', letterSpacing: 1 },

    // ── Tur sonu
    resultWrap:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scoreReveal:    { alignItems: 'center', marginBottom: SPACING.xl },
    scoreRevealNum: { fontSize: 80, fontWeight: '900', lineHeight: 88 },
    bonusBadge:     { fontSize: FONTS.sm, fontWeight: '800', color: '#8b5cf6', backgroundColor: '#f3e8ff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
    scoreRevealMsg: { fontSize: FONTS.lg, fontWeight: '800', marginTop: 8 },
    scoreRevealSub: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 4 },
    bonusHint:      { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 8, textAlign: 'center' },
    compareRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, width: '100%' },
    cmpGroup:       { flex: 1, alignItems: 'center', gap: 5 },
    cmpSwatch:      { width: '90%', height: 64, borderRadius: RADIUS.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
    cmpLbl:         { fontSize: FONTS.xs, fontWeight: FONTS.bold, color: COLORS.textSecondary },
    cmpVal:         { fontSize: 9, color: COLORS.textMuted },
    cmpDivider:     { width: 40, alignItems: 'center' },
    cmpVs:          { fontSize: FONTS.md, fontWeight: '900', color: COLORS.text },
    cmpVsLbl:       { fontSize: 9, color: COLORS.textMuted },
    progressRow:    { flexDirection: 'row', gap: 6, marginBottom: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
    progressDot:    { height: 28, width: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    progressDotTxt: { fontSize: 8, fontWeight: '700', color: '#fff' },
    runningTotal:   { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: FONTS.semibold },
    nextBtn:        { borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 4, alignItems: 'center' },
    nextTxt:        { fontSize: FONTS.base, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

    // ── Oyun sonu
    endWrap:        { flex: 1, justifyContent: 'center' },
    recordBadge:    { backgroundColor: '#fef9c3', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 6, alignSelf: 'center', marginBottom: SPACING.sm },
    recordTxt:      { fontSize: FONTS.sm, fontWeight: '800', color: '#854d0e' },
    endTitle:       { fontSize: FONTS.sm, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 2, textAlign: 'center', marginBottom: SPACING.sm },
    rankBox:        { alignItems: 'center', marginBottom: SPACING.sm },
    rankEmoji:      { fontSize: 48, lineHeight: 56 },
    rankTitle:      { fontSize: FONTS.xxl, fontWeight: '900', letterSpacing: -0.5 },
    finalScoreRow:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 2 },
    finalNum:       { fontSize: 64, fontWeight: '900', lineHeight: 70 },
    finalMax:       { fontSize: FONTS.lg, color: COLORS.textMuted, fontWeight: FONTS.medium, marginBottom: 8 },
    finalPct:       { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    scoreList:      { gap: 6, marginBottom: SPACING.md },
    scoreListRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scoreListIdx:   { fontSize: FONTS.xs, color: COLORS.textMuted, width: 40 },
    scoreListTrack: { flex: 1, height: 7, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
    scoreListFill:  { height: '100%', borderRadius: 4 },
    scoreListVal:   { fontSize: FONTS.sm, fontWeight: FONTS.bold, width: 30, textAlign: 'right' },
    prevRecord:     { fontSize: FONTS.xs, color: COLORS.textMuted, textAlign: 'center' },
    endBtns:        { flexDirection: 'row', gap: SPACING.sm },
    replayBtn:      { borderRadius: RADIUS.lg, paddingVertical: SPACING.md + 4, alignItems: 'center' },
    replayTxt:      { fontSize: FONTS.base, fontWeight: '800', color: '#fff' },
    menuBtn:        { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    menuBtnTxt:     { fontSize: FONTS.sm, fontWeight: FONTS.semibold, color: COLORS.textSecondary },
});
