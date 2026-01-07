import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useColors } from '../../theme/ColorLockContext';
import { useAppStore } from '../../store/useAppStore';
import { ArrowRight, Sparkles, Heart, ShieldCheck, Compass, Lock, Zap, MessageSquare, Anchor, Eye } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const ONBOARDING_STEPS = [
    {
        id: 1,
        title: "관계의 무게를 덜고,\n마음의 균형을\n균형을 지키다.",
        description: "복잡한 세상 속, 당신만의 소셜 우주를 시각화하고 내면의 균형을 찾아보세요.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0W4CHJde2_tDzfgLnzZ3eNStIIZV3WbHM8kOrCN5-sYrCKvmSuqoXP3Dz6LXluncnpXmLcHVebCDIJSCZDfu_Kmn0-gbj2aqZzA5z340yN7uxVchrEVFQJ0la6-4kf3s2SXUMgg6a300LZ66X7Lwmc_QrC58eP0n5DDKTx-FrbqM0WrSJsxuFL_cp6EfoJlHRe830xyXIYlvLfV8F5iEJVgUrwyXwlokqC0-2It6uNOoqLeuZc6btIWzedy2ai3tjo3D6sDLZpBQ",
        type: 'hero'
    },
    {
        id: 2,
        title: "복잡한 인맥을 한눈에 조망하는\n당신만의 우주",
        description: "복잡한 관계를 궤도 형태로 정리하여, 소중한 사람들과의 거리를 한눈에 확인하세요.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqx6N1Z2uqccHZd4Z99Vnzq_1NFU1l904C8TgeLXmBTXtjqJx9jxz3vQxZmYR1Ue0kRd77iW2jaRh9qf5VRvXK4kyHD47Ha9FoDX7e3chP4GvuDsD5kakqzEngJyOgGAyCgqMAm1AezItcCE1RqW7Bo1H3n_xYx19zMfVVNa9OfQJ3lKrKSdaNRdIXCQTHdGTh9Cvu5ohRjrPWzNOLegYvHyw4fu-9lPXBPDXR7RG4E3dFS3PIxxdP-G_DaDWDvoFGZfSiE1Kr70A",
        type: 'orbit'
    },
    {
        id: 3,
        title: "정서적 영향력을 진단하여\n캐릭터로 확인하세요",
        description: "지지 기반이 되는 소울 앵커와 성장의 거울인 비전 미러를 발견해보세요.",
        images: [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuD_Aq-PPdAz1J48xguqIqMV_OWQFWsQyyZRFtCtDuZWbD2WtX7eBL-55ZsP34G6Y-ghSbXvlh9Xc1QzCPnPPmAvt_u4MqjqF_QyNF-4G2hzbbdm0L1YTNP7a0wXK9JrgF_IzgBeT6wYnLXP22IdlKZ_qbB-tPuJwPxTZZXuglYyFXlkWunLnAqGDkOqqvMkQf8oHq8zKWB2XosgAB1nb03IJ_Ny7tzezoiLn2fzR8xtCJJ6Y6huqVN_cqSoD5kgMPAfAz-NBySR6lw",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBDf_DbaJgVDFuvSYgbV3JadoCP_VBbojwPKfjmcpzUw8ZW0tqFkpfUSfmZLdSvslfKN0ZzIgJckVUOqju7pSI46x97BnIJiNUfS6FSyOdOa6D7diP2pJ1zeEQH-TBHUraEmz43Mmb-I3C6Tt4y2oVMmlPSYQ_o0VCXths8dAEZMEdIG1suoentz3B79Rjqe-o1oOBStOZ8orpkrX6wJHeA-9HMy_XMUODVt39QYOKmwzY47iQFdT06Mf6QLKfcgZAb8NIunaBPG-k"
        ],
        type: 'diagnosis'
    },
    {
        id: 4,
        title: "즉각적인 정서적 보호",
        description: "심리적 위기의 순간,\n즉시 실행 가능한 처방전을 발행해 드립니다.",
        type: 'sos'
    },
    {
        id: 5,
        title: "서버 없는 보안,\n오직 당신의 기기에만 저장됩니다",
        description: "모든 데이터는 로컬에 안전하게 암호화되어 저장됩니다.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdppwauU_Sr6vV0ttOjX69r3aFUoXm0riqaOuETn55_M878gOWAoBQNhkDhg-sdVBlcFz52Zmx9FIBPLWsnR3zxmIA71F55LjDudDFAB6OjLXSBzCIdjPcNBNbU1JeZPT6ar-d-sRkWIKIZt0rnFGOvwHMtjGVH7-6zjmIUM4nKuY6eei3B9R6WgOaqLZwevD81hXTJjqaggsHCD6Chy9T1kPxI946eEVd3FISrSnb2jDaASYHD7S_UPV8av6-iO_tTvzZYZ9lI2E",
        type: 'privacy'
    }
];

export const OnboardingScreen = () => {
    const colors = useColors();
    const setHasCompletedOnboarding = useAppStore(state => state.setHasCompletedOnboarding);
    const setUserProfile = useAppStore(state => state.setUserProfile);

    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const orbitRotate = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(orbitRotate, {
                toValue: 1,
                duration: 20000,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                })
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1.4,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);


    const handleNext = () => {
        if (step < ONBOARDING_STEPS.length) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: -20, duration: 300, useNativeDriver: true })
            ]).start(() => {
                if (step === ONBOARDING_STEPS.length - 1) {
                    setStep(ONBOARDING_STEPS.length); // Name input step
                } else {
                    setStep(step + 1);
                }
                slideAnim.setValue(20);
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
                ]).start();
            });
        } else if (step === ONBOARDING_STEPS.length) {
            if (name.trim()) {
                setUserProfile({ name });
                setHasCompletedOnboarding(true);
            }
        }
    };

    const renderVisual = (item: any) => {
        switch (item.type) {
            case 'hero':
                return (
                    <View style={styles.orbitVisualContainer}>
                        <Animated.View style={[styles.bgRing, { width: 340, height: 340, borderColor: colors.primary, opacity: 0.1 }]}>
                            <View style={{ position: 'absolute', top: 48, left: 32, width: 16, height: 16, borderRadius: 8, backgroundColor: '#D4AF37', opacity: 0.8, borderWidth: 1, borderColor: 'white' }} />
                        </Animated.View>
                        <Animated.View style={[styles.bgRing, { width: 260, height: 260, borderColor: colors.primary, opacity: 0.2 }]}>
                            <View style={{ position: 'absolute', bottom: 40, right: 24, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, opacity: 0.8, borderWidth: 1, borderColor: 'white' }} />
                            <View style={{ position: 'absolute', top: '50%', left: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4AF37', opacity: 0.9, borderWidth: 1, borderColor: 'white' }} />
                        </Animated.View>
                        <Animated.View style={[styles.bgRing, { width: 180, height: 180, borderColor: colors.accent, opacity: 0.3 }]}>
                            <View style={{ position: 'absolute', top: 24, right: 48, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, opacity: 1.0, borderWidth: 1, borderColor: 'white' }} />
                        </Animated.View>
                        <View style={[styles.heroCore, { shadowColor: colors.accent }]}>
                            <Image source={{ uri: item.image }} style={styles.heroImage} />
                        </View>
                    </View>
                );
            case 'orbit':
                const spin = orbitRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
                const spinReverse = orbitRotate.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
                const spinSlow = orbitRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '120deg'] });
                const spinSlower = orbitRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '60deg'] });

                return (
                    <Animated.View style={[styles.orbitVisualContainer, { transform: [{ translateY: floatAnim }] }]}>
                        {/* Center Node: 강한 반짝임 */}
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                            <Animated.View style={{
                                width: 16, height: 16, borderRadius: 8,
                                backgroundColor: 'white',
                                shadowColor: 'white', shadowOpacity: 1, shadowRadius: 25, shadowOffset: { width: 0, height: 0 }, elevation: 15,
                                opacity: pulseAnim,
                                transform: [{ scale: pulseAnim }]
                            }} />
                        </View>

                        {/* Ring 1 (100px) - Fast Spin */}
                        <Animated.View style={[styles.orbitRingSimple, { width: 100, height: 100, borderColor: colors.primary, opacity: 0.2, transform: [{ rotate: spin }] }]}>
                            <View style={{ position: 'absolute', top: -6, left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: '#FCF9F2', zIndex: 10 }} />
                        </Animated.View>

                        {/* Ring 2 (160px) - Reverse Spin */}
                        <Animated.View style={[styles.orbitRingSimple, { width: 160, height: 160, borderColor: colors.primary, opacity: 0.2, transform: [{ rotate: spinReverse }] }]}>
                            <View style={{ position: 'absolute', top: '15%', right: '10%', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, opacity: 0.9, borderWidth: 1.5, borderColor: '#FCF9F2' }} />
                            <View style={{ position: 'absolute', bottom: '20%', left: '10%', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, opacity: 0.7, borderWidth: 1.5, borderColor: '#FCF9F2' }} />
                        </Animated.View>

                        {/* Ring 3 (220px) - Slow Spin */}
                        <Animated.View style={[styles.orbitRingSimple, { width: 220, height: 220, borderColor: colors.primary, opacity: 0.15, transform: [{ rotate: spinSlow }] }]}>
                            <View style={{ position: 'absolute', top: '5%', left: '25%', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, opacity: 0.9, borderWidth: 1.5, borderColor: '#FCF9F2' }} />
                            <View style={{ position: 'absolute', bottom: '15%', right: '20%', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, opacity: 0.6, borderWidth: 1.5, borderColor: '#FCF9F2' }} />
                        </Animated.View>

                        {/* Ring 4 (280px) - Reverse Slow */}
                        <Animated.View style={[styles.orbitRingSimple, { width: 280, height: 280, borderColor: colors.primary, opacity: 0.15, transform: [{ rotate: spinReverse }] }]}>
                            <View style={{ position: 'absolute', top: '50%', left: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, opacity: 0.5, borderWidth: 1.5, borderColor: '#FCF9F2' }} />
                        </Animated.View>

                        {/* Ring 5 (340px) - Slower */}
                        <Animated.View style={[styles.orbitRingSimple, { width: 340, height: 340, borderColor: colors.primary, opacity: 0.1, transform: [{ rotate: spinSlower }] }]}>
                            <View style={{ position: 'absolute', bottom: '50%', right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: 0.3 }} />
                            <View style={{ position: 'absolute', bottom: '10%', left: '30%', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, opacity: 0.3 }} />
                        </Animated.View>
                    </Animated.View>
                );


            case 'diagnosis':
                return (
                    <View style={styles.diagnosisContainer}>
                        <Animated.View style={[styles.diagnosisNode, { transform: [{ translateY: floatAnim }] }]}>
                            <Image source={{ uri: item.images[0] }} style={styles.diagnosisImg} />
                            <View style={styles.labelTag}>
                                <Anchor size={10} color={colors.primary} />
                                <Text style={styles.labelText}>SOUL ANCHOR</Text>
                            </View>
                        </Animated.View>
                        <Animated.View style={[styles.diagnosisNode, { transform: [{ translateY: Animated.multiply(floatAnim, -1) }], marginTop: 40 }]}>
                            <Image source={{ uri: item.images[1] }} style={styles.diagnosisImg} />
                            <View style={styles.labelTag}>
                                <Eye size={10} color={colors.primary} />
                                <Text style={styles.labelText}>VISION MIRROR</Text>
                            </View>
                        </Animated.View>
                    </View>
                );
            case 'sos':
                return (
                    <View style={styles.sosVisualContainer}>
                        <View style={[styles.rxCard, { backgroundColor: colors.primary }]}>
                            <View style={styles.rxIconCircle}>
                                <Zap color={colors.white} size={28} />
                            </View>
                            <Text style={styles.rxTitle}>Healing Rx</Text>
                            <View style={styles.rxDashLine} />
                            <View style={styles.rxBottom}>
                                <Text style={styles.rxStatus}>Immediate</Text>
                            </View>
                        </View>
                        <View style={[styles.sosButtonOnboarding, { backgroundColor: colors.accent }]}>
                            <Text style={styles.sosTextOnboarding}>SOS</Text>
                        </View>
                    </View>
                );
            case 'privacy':
                return (
                    <View style={styles.privacyVisual}>
                        <View style={styles.privacyImages}>
                            <Image source={{ uri: item.image }} style={styles.privacyMainImg} />
                            <View style={styles.lockBadge}>
                                <Lock size={20} color={colors.white} />
                            </View>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    const renderStepContent = () => {
        if (step < ONBOARDING_STEPS.length) {
            const currentStep = ONBOARDING_STEPS[step];
            return (
                <View style={styles.stepContent}>
                    <View style={styles.visualWrapper}>
                        {renderVisual(currentStep)}
                    </View>
                    <Text style={[styles.title, { color: colors.primary }]}>
                        {currentStep.title.split('\n').map((line, i) => (
                            <Text key={i} style={i > 0 ? { color: colors.accent, fontStyle: 'italic' } : {}}>
                                {line}{i !== currentStep.title.split('\n').length - 1 ? '\n' : ''}
                            </Text>
                        ))}
                    </Text>
                    <Text style={[styles.description, { color: colors.primary, opacity: 0.6 }]}>
                        {currentStep.description}
                    </Text>
                </View>
            );
        } else {
            return (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.stepContent}>
                    <View style={styles.avatarOuterWrapper}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_4nbf8XYKfUAdnhk0h_PYVe-cPF_A6hYA9qFKFARMFD5X_qYabF_Q6Ahn_fkVop9cc55TdPKTmst_DJOCIElrUGuKDyp-_k94tXARDdb7vrNXxdd3jErzAMy5B5wgWlGRB8y8M-9gBmW8jww40YT4sCkNxkzhsII5eswcUTMVpRzkwka7PHIu33bUdVOthx2lrxFeMrz1p9nZKI8uSDYzdrGP2WAEkp1NN7cOYU5PBWL7mZ6a6MkSMy_qYSR3Vgv2v2IfX_K4lhQ' }}
                            style={styles.aiAvatar}
                        />
                        <View style={[styles.speechBubble, { backgroundColor: colors.white }]}>
                            <Text style={[styles.speechText, { color: colors.primary }]}>무게를 덜고 온기를 더할 준비가 되었나요?{"\n"}당신의 이름을 알려주세요.</Text>
                        </View>
                    </View>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.white, color: colors.primary, borderColor: colors.primary }]}
                        placeholder="이름을 입력해주세요"
                        placeholderTextColor="rgba(74,93,78,0.3)"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </KeyboardAvoidingView>
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.pagination}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={[
                        styles.dot,
                        { backgroundColor: step === i ? colors.primary : colors.primary + '33' },
                        step === i && { width: 32 }
                    ]} />
                ))}
            </View>

            <Animated.View style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
                {renderStepContent()}
            </Animated.View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.primary }, (step === ONBOARDING_STEPS.length && !name.trim()) && { opacity: 0.5 }]}
                    onPress={handleNext}
                    disabled={step === ONBOARDING_STEPS.length && !name.trim()}
                >
                    <Text style={styles.nextText}>{step === ONBOARDING_STEPS.length ? "시작하기" : "다음"}</Text>
                    <ArrowRight size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingBottom: 20,
    },
    dot: {
        height: 6,
        width: 6,
        borderRadius: 3,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    stepContent: {
        width: '100%',
        alignItems: 'center',
    },
    visualWrapper: {
        height: 380,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    orbitVisualContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgRing: {
        position: 'absolute',
        borderWidth: 1,
        borderRadius: 999,
    },
    heroCore: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        padding: 5,
        elevation: 20,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    orbitCenterNode: {
        width: 60,
        height: 60,
        borderRadius: 30,
        zIndex: 10,
    },
    orbitCenterGlow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        opacity: 0.2,
        borderRadius: 30,
        transform: [{ scale: 1.5 }],
    },
    orbitRingSimple: {
        position: 'absolute',
        borderWidth: 1.5,
        borderRadius: 999,
    },
    diagnosisContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    diagnosisNode: {
        alignItems: 'center',
    },
    diagnosisImg: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        borderColor: '#fff',
    },
    labelTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 10,
        gap: 6,
    },
    labelText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    sosVisualContainer: {
        alignItems: 'center',
    },
    rxCard: {
        width: 200,
        height: 280,
        borderRadius: 20,
        alignItems: 'center',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    rxIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#D98B73',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    rxTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    rxDashLine: {
        width: '100%',
        borderBottomWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dashed',
        marginVertical: 40,
    },
    rxBottom: {
        width: '100%',
        alignItems: 'center',
    },
    rxStatus: {
        color: '#D98B73',
        fontSize: 14,
        fontWeight: '800',
    },
    sosButtonOnboarding: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -32,
        borderWidth: 4,
        borderColor: '#FCF9F2',
    },
    sosTextOnboarding: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    privacyVisual: {
        width: 300,
        height: 300,
        borderRadius: 40,
        overflow: 'hidden',
    },
    privacyImages: {
        width: '100%',
        height: '100%',
    },
    privacyMainImg: {
        width: '100%',
        height: '100%',
    },
    lockBadge: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4A5D4E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 25,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 36,
        marginTop: 20,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '600',
        paddingHorizontal: 20,
    },
    footer: {
        paddingHorizontal: 30,
        paddingBottom: 60,
    },
    nextBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    nextText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    avatarOuterWrapper: {
        alignItems: 'center',
        marginBottom: 30,
    },
    aiAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 20,
    },
    speechBubble: {
        padding: 20,
        borderRadius: 24,
        borderBottomLeftRadius: 4,
    },
    speechText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 60,
        borderRadius: 30,
        borderWidth: 1.5,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
    }
});
