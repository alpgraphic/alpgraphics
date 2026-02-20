/**
 * Chroma Dash — Hyper Casual Renk & Refleks Oyunu
 * Geometry Dash × Color Switch harmanlama
 *
 * Mekanik:
 *  - Küp gravity altında sürekli düşer, tap ile zıplar
 *  - Engeller sağdan sola kayar — 3 renkli yatay band içerir
 *  - Küp SADECE kendi rengiyle eşleşen bandın içinden geçebilir
 *  - Renk küreleri rengi değiştirir → anlık adaptasyon gerekir
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { SPACING } from '../lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Band { color: string; y: number; h: number }
interface Obs  { id: number; x: number; bands: Band[]; safeColor: string; passed: boolean }
interface Orb  { id: number; x: number; y: number; color: string }

interface GS {
    phase:    'idle' | 'playing' | 'dead';
    cubeY:    number;
    cubeVY:   number;
    colorIdx: number;
    obstacles: Obs[];
    orbs:      Orb[];
    score:    number;
    speed:    number;
    ticks:    number;
    nextId:   number;
    playH:    number;
}

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ChromaDash'>;
};

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');

const NEONS: readonly string[]   = ['#00e5ff', '#ff2d78', '#ffe000', '#39ff6a'];
const NAMES: readonly string[]   = ['SİYAN', 'PEMBE', 'SARI', 'YEŞİL'];
const BG    = '#080810';
const CUBE_W    = 24;
const CUBE_X    = 72;
const GRAVITY   = 0.42;
const JUMP_V    = -9.2;
const BASE_SPD  = 3.8;
const OBS_W     = 20;
const OBS_GAP   = 280;   // engeller arası piksel
const BANDS     = 3;     // her engeldeki band sayısı
const ORB_R     = 13;    // orb yarıçapı
const HI_KEY    = 'chroma_dash_hi_v2';

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function rnd(n: number) { return Math.floor(Math.random() * n); }

/** 3 farklı renkli band oluştur; safeColorIdx'li band mutlaka dahil */
function makeBands(safeColorIdx: number, playH: number, safeBandPos?: number): Band[] {
    const h = playH / BANDS;
    const idxs: number[] = [safeColorIdx];
    while (idxs.length < BANDS) {
        const n = rnd(NEONS.length);
        if (!idxs.includes(n)) idxs.push(n);
    }
    if (safeBandPos !== undefined) {
        // güvenli bandı belirli bir pozisyona zorla
        idxs.splice(idxs.indexOf(safeColorIdx), 1);
        idxs.splice(safeBandPos, 0, safeColorIdx);
    } else {
        for (let i = idxs.length - 1; i > 0; i--) {
            const j = rnd(i + 1);
            [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
        }
    }
    return idxs.map((ci, i) => ({ color: NEONS[ci], y: i * h, h }));
}

function spawnObs(gs: GS, x: number, forceMid = false): Obs {
    const bands = makeBands(gs.colorIdx, gs.playH, forceMid ? 1 : undefined);
    return { id: gs.nextId++, x, bands, safeColor: NEONS[gs.colorIdx], passed: false };
}

function spawnOrb(gs: GS, x: number): Orb {
    let ci = rnd(NEONS.length);
    while (ci === gs.colorIdx) ci = rnd(NEONS.length);
    const bandH = gs.playH / BANDS;
    // orbu alt 3/4 arasında yerleştir (en üste ve tabana yakın yerlere koyma)
    const y = bandH * 0.4 + Math.random() * (gs.playH - bandH * 0.8);
    return { id: gs.nextId++, x, y, color: NEONS[ci] };
}

/** Orb toplandığında sonraki engelin safeColor'unu güncelle */
function patchNextObs(gs: GS, newColorIdx: number) {
    const newColor = NEONS[newColorIdx];
    const next = gs.obstacles.find(o => !o.passed && o.x > CUBE_X + CUBE_W);
    if (!next) return;
    next.safeColor = newColor;
    const has = next.bands.some(b => b.color === newColor);
    if (!has) {
        // rastgele bir bandı güvenli renge çevir
        next.bands[rnd(BANDS)].color = newColor;
    }
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function ChromaDashScreen({ navigation }: Props) {
    const insets  = useSafeAreaInsets();
    const headerH = insets.top + 52;
    const footerH = insets.bottom + 48;
    const playH   = Math.max(200, SH - headerH - footerH);

    const [tick,    setTick]    = useState(0);
    const [hiScore, setHiScore] = useState(0);
    const rafRef = useRef<number | null>(null);

    const gsRef = useRef<GS>({
        phase: 'idle', cubeY: 0, cubeVY: 0, colorIdx: 0,
        obstacles: [], orbs: [], score: 0,
        speed: BASE_SPD, ticks: 0, nextId: 0, playH,
    });
    gsRef.current.playH = playH; // cihaz döndürmelerinde güncelle

    useEffect(() => {
        SecureStore.getItemAsync(HI_KEY)
            .then(v => { if (v) setHiScore(parseInt(v, 10) || 0); })
            .catch(() => {});
    }, []);

    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    const render = useCallback(() => setTick(t => t + 1), []);

    // ── Ölüm ──────────────────────────────────────────────────────────────────

    const die = useCallback(async (gs: GS) => {
        gs.phase = 'dead';
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        if (gs.score > hiScore) {
            const newHi = gs.score;
            setHiScore(newHi);
            SecureStore.setItemAsync(HI_KEY, String(newHi)).catch(() => {});
        }
        render();
    }, [hiScore, render]);

    // ── Oyun döngüsü ──────────────────────────────────────────────────────────

    const gameLoop = useCallback(() => {
        const gs = gsRef.current;
        if (gs.phase !== 'playing') return;

        gs.ticks++;

        // Fizik
        gs.cubeVY += GRAVITY;
        gs.cubeY  += gs.cubeVY;

        // Zemin / tavan ölümü
        if (gs.cubeY < -4 || gs.cubeY + CUBE_W > gs.playH + 4) { die(gs); return; }
        gs.cubeY = Math.max(-4, Math.min(gs.playH + 4 - CUBE_W, gs.cubeY));

        // Engel + orb hareketi
        for (const o of gs.obstacles) o.x -= gs.speed;
        for (const o of gs.orbs)      o.x -= gs.speed;

        // Ekran dışına çıkanları temizle
        gs.obstacles = gs.obstacles.filter(o => o.x > -OBS_W - 20);
        gs.orbs      = gs.orbs.filter(o => o.x > -ORB_R * 2);

        // Yeni engel üret
        const rightmost = gs.obstacles.length > 0
            ? Math.max(...gs.obstacles.map(o => o.x))
            : SW + 100;
        if (rightmost < SW + OBS_GAP * 0.6) {
            const newX = Math.max(SW + 80, rightmost + OBS_GAP);
            gs.obstacles.push(spawnObs(gs, newX));

            // Her 2 engelten birinde renk orbu üret
            if (gs.obstacles.length % 2 === 0 && gs.obstacles.length > 1) {
                const prevObs = gs.obstacles[gs.obstacles.length - 2];
                const orbX = prevObs.x + OBS_GAP * 0.55;
                if (orbX < newX - 50) gs.orbs.push(spawnOrb(gs, orbX));
            }
        }

        // ── Çarpışma tespiti ──────────────────────────────────────────────────

        const cubeLeft   = CUBE_X;
        const cubeRight  = CUBE_X + CUBE_W;
        const cubeCenter = gs.cubeY + CUBE_W / 2;
        const cubeColor  = NEONS[gs.colorIdx];

        for (const obs of gs.obstacles) {
            if (obs.passed) continue;

            // Skor: engel tamamen geçtiyse
            if (obs.x + OBS_W < cubeLeft) {
                obs.passed = true;
                gs.score++;
                gs.speed = BASE_SPD + Math.min(3.5, Math.floor(gs.score / 6) * 0.22);
                continue;
            }

            // X ekseninde çakışıyor mu?
            if (obs.x > cubeRight || obs.x + OBS_W < cubeLeft) continue;

            // Küpün merkezinin hangi bantta olduğunu bul
            const band = obs.bands.find(b => cubeCenter >= b.y && cubeCenter < b.y + b.h);
            if (!band) { die(gs); return; }

            // Renk eşleşmiyor → ölüm
            if (band.color !== cubeColor) { die(gs); return; }
        }

        // ── Orb toplama ───────────────────────────────────────────────────────

        for (let i = gs.orbs.length - 1; i >= 0; i--) {
            const orb = gs.orbs[i];
            const dx = Math.abs((orb.x) - (CUBE_X + CUBE_W / 2));
            const dy = Math.abs(orb.y - (gs.cubeY + CUBE_W / 2));
            if (dx < CUBE_W / 2 + ORB_R && dy < CUBE_W / 2 + ORB_R) {
                const newIdx = NEONS.indexOf(orb.color);
                gs.colorIdx = newIdx;
                gs.orbs.splice(i, 1);
                patchNextObs(gs, newIdx);
            }
        }

        render();
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [die, render]);

    // ── Oyun başlat ───────────────────────────────────────────────────────────

    const startGame = useCallback(() => {
        const gs = gsRef.current;
        gs.phase     = 'playing';
        gs.cubeY     = gs.playH / 2 - CUBE_W / 2;
        gs.cubeVY    = 0;
        gs.colorIdx  = 0;
        gs.obstacles = [];
        gs.orbs      = [];
        gs.score     = 0;
        gs.speed     = BASE_SPD;
        gs.ticks     = 0;
        gs.nextId    = 0;

        // İlk 3 engeli orta bandı güvenli tutarak üret (fair start)
        for (let i = 0; i < 3; i++) {
            gs.obstacles.push(spawnObs(gs, SW + 180 + i * OBS_GAP, i === 0));
        }

        render();
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [gameLoop, render]);

    // ── Dokunma ───────────────────────────────────────────────────────────────

    const handleTap = useCallback(() => {
        const gs = gsRef.current;
        if (gs.phase === 'idle' || gs.phase === 'dead') {
            startGame();
        } else if (gs.phase === 'playing') {
            gs.cubeVY = JUMP_V;
        }
    }, [startGame]);

    // ── Render ────────────────────────────────────────────────────────────────

    const gs        = gsRef.current;
    const cubeColor = NEONS[gs.colorIdx];
    const colorName = NAMES[gs.colorIdx];

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* Header — skor + geri butonu */}
            <View style={[s.header, { paddingTop: insets.top + 8, height: headerH }]}>
                <TouchableOpacity
                    onPress={() => {
                        if (rafRef.current) cancelAnimationFrame(rafRef.current);
                        navigation.goBack();
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={s.backBtn}
                >
                    <Text style={s.backTxt}>← Çık</Text>
                </TouchableOpacity>

                {gs.phase === 'playing' && (
                    <Text style={[s.liveScore, { color: cubeColor }]}>{gs.score}</Text>
                )}

                <Text style={s.hiTxt}>🏆 {Math.max(hiScore, gs.score)}</Text>
            </View>

            {/* Oyun alanı */}
            <TouchableWithoutFeedback onPress={handleTap}>
                <View style={[s.play, { height: playH }]}>

                    {/* Izgara — görsel dekor */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {[1, 2].map(i => (
                            <View
                                key={i}
                                style={[s.gridLine, { top: playH / BANDS * i }]}
                            />
                        ))}
                        {/* Dikey ızgara */}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <View
                                key={`v${i}`}
                                style={[s.gridLineV, { left: (SW / 8) * i }]}
                            />
                        ))}
                    </View>

                    {/* Engeller */}
                    {gs.obstacles.map(obs => (
                        <View
                            key={obs.id}
                            style={[s.obsCol, { left: obs.x, width: OBS_W }]}
                            pointerEvents="none"
                        >
                            {obs.bands.map((band, bi) => {
                                const isSafe = band.color === cubeColor;
                                return (
                                    <View
                                        key={bi}
                                        style={[
                                            s.band,
                                            {
                                                top: band.y,
                                                height: band.h,
                                                backgroundColor: band.color,
                                                opacity: isSafe ? 1 : 0.18,
                                            },
                                        ]}
                                    >
                                        {/* Güvenli band'a ince kenar vurgu */}
                                        {isSafe && (
                                            <View style={[s.safeBorder, { borderColor: band.color }]} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))}

                    {/* Renk orları */}
                    {gs.orbs.map(orb => (
                        <View
                            key={orb.id}
                            style={[
                                s.orb,
                                {
                                    left: orb.x - ORB_R,
                                    top:  orb.y - ORB_R,
                                    width:  ORB_R * 2,
                                    height: ORB_R * 2,
                                    borderRadius: ORB_R,
                                    backgroundColor: orb.color,
                                    shadowColor: orb.color,
                                },
                            ]}
                            pointerEvents="none"
                        />
                    ))}

                    {/* Küp */}
                    {gs.phase !== 'idle' && (
                        <View
                            style={[
                                s.cube,
                                {
                                    left:            CUBE_X,
                                    top:             gs.cubeY,
                                    backgroundColor: cubeColor,
                                    shadowColor:     cubeColor,
                                },
                            ]}
                            pointerEvents="none"
                        />
                    )}

                    {/* Boşta ekranı */}
                    {gs.phase === 'idle' && (
                        <View style={s.overlay} pointerEvents="none">
                            <View style={s.titleBlock}>
                                <Text style={s.titleA}>CHROMA</Text>
                                <Text style={s.titleB}>DASH</Text>
                            </View>
                            <Text style={s.tagline}>Rengini eşleştir — çarp geç</Text>
                            <View style={s.colorsRow}>
                                {NEONS.map((c, i) => (
                                    <View key={i} style={[s.colorDot, { backgroundColor: c, shadowColor: c }]} />
                                ))}
                            </View>
                            <View style={s.rulesCard}>
                                <Text style={s.ruleRow}>🎯  Küpünle aynı renkteki banddan geç</Text>
                                <Text style={s.ruleRow}>⚡  Renk küreleri rengini değiştirir</Text>
                                <Text style={s.ruleRow}>🕹  Tap → Zıpla, Zemin / Tavan = Ölüm</Text>
                            </View>
                            <Text style={s.tapHint}>— dokun ve başla —</Text>
                        </View>
                    )}

                    {/* Ölüm ekranı */}
                    {gs.phase === 'dead' && (
                        <View style={s.overlay} pointerEvents="none">
                            <Text style={s.deadNum}>{gs.score}</Text>
                            {gs.score > 0 && gs.score >= hiScore && (
                                <View style={s.recordPill}>
                                    <Text style={s.recordTxt}>🏆 YENİ REKOR</Text>
                                </View>
                            )}
                            <Text style={s.deadMsg}>
                                {gs.score >= 40 ? '🌈 EFSANE!'    :
                                 gs.score >= 25 ? '⚡ ŞAŞIRTICI!' :
                                 gs.score >= 15 ? '🎨 HARİKA!'    :
                                 gs.score >= 8  ? '✨ İYİ!'        :
                                 gs.score >= 3  ? '👏 GÜZEL BAŞLANGIÇ' : '😤 BİRAZ DAHA!'}
                            </Text>
                            <Text style={s.tapHint}>— dokun ve tekrar —</Text>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            {/* Footer — renk göstergesi */}
            <View style={[s.footer, { height: footerH, paddingBottom: insets.bottom }]}>
                {gs.phase === 'playing' ? (
                    <>
                        <View style={[s.cubeIndicator, { backgroundColor: cubeColor, shadowColor: cubeColor }]} />
                        <Text style={[s.colorLabel, { color: cubeColor }]}>{colorName}</Text>
                        <Text style={s.scoreLabel}>{gs.score}</Text>
                    </>
                ) : (
                    <View style={s.footerIdle}>
                        {NEONS.map((c, i) => (
                            <View key={i} style={[s.footerDot, { backgroundColor: c }]} />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        justifyContent: 'space-between',
    },
    backBtn: {},
    backTxt: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
    liveScore: {
        fontSize: 22,
        fontWeight: '900',
        position: 'absolute',
        left: 0, right: 0,
        textAlign: 'center',
        letterSpacing: 1,
    },
    hiTxt: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },

    // Oyun alanı
    play: {
        backgroundColor: BG,
        overflow: 'hidden',
        position: 'relative',
    },

    // Izgara
    gridLine: {
        position: 'absolute',
        left: 0, right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    gridLineV: {
        position: 'absolute',
        top: 0, bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.025)',
    },

    // Engel
    obsCol: { position: 'absolute', top: 0, bottom: 0 },
    band:   { position: 'absolute', left: 0, right: 0 },
    safeBorder: {
        position: 'absolute',
        inset: 0,
        borderWidth: 1.5,
        borderRadius: 1,
        opacity: 0.6,
    },

    // Orb
    orb: {
        position: 'absolute',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 8,
    },

    // Küp
    cube: {
        position: 'absolute',
        width: CUBE_W,
        height: CUBE_W,
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 10,
    },

    // Overlay (idle/dead)
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(8,8,16,0.82)',
        gap: 0,
    },
    titleBlock: { alignItems: 'flex-start', marginBottom: 4 },
    titleA: {
        fontSize: 52,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
        lineHeight: 54,
    },
    titleB: {
        fontSize: 52,
        fontWeight: '900',
        color: '#00e5ff',
        letterSpacing: -1,
        lineHeight: 58,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 20,
        letterSpacing: 0.3,
    },
    colorsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    colorDot: {
        width: 14, height: 14, borderRadius: 7,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 4,
    },
    rulesCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 14,
        gap: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 20,
        width: SW - 80,
    },
    ruleRow: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 22 },
    tapHint: { fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },

    // Ölüm
    deadNum: {
        fontSize: 80,
        fontWeight: '900',
        color: '#ffffff',
        lineHeight: 88,
        marginBottom: 4,
    },
    recordPill: {
        backgroundColor: 'rgba(255,220,0,0.15)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 4,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,220,0,0.3)',
    },
    recordTxt: { fontSize: 11, fontWeight: '800', color: '#ffe000' },
    deadMsg: {
        fontSize: 18,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 20,
    },

    // Footer
    footer: {
        backgroundColor: '#0d0d18',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    cubeIndicator: {
        width: 18,
        height: 18,
        borderRadius: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 6,
    },
    colorLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    scoreLabel: {
        fontSize: 13,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.2)',
        marginLeft: 'auto' as any,
    },
    footerIdle: { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center' },
    footerDot:  { width: 8, height: 8, borderRadius: 4, opacity: 0.5 },
});
