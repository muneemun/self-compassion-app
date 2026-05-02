import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, ShieldCheck, Sparkles, Wind } from 'lucide-react-native';
import ReAnimated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withTiming, 
    withRepeat, 
    withSequence,
    Easing,
    runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SystemStabilizationModalProps {
    visible: boolean;
    onClose: () => void;
    onComplete: () => void;
    message?: string | null;
}

export const SystemStabilizationModal = ({ visible, onClose, onComplete, message }: SystemStabilizationModalProps) => {
    const [phase, setPhase] = useState<'intro' | 'breathing' | 'complete'>('intro');
    const [cycleCount, setCycleCount] = useState(0);
    const [guideText, setGuideText] = useState('');

    useEffect(() => {
        if (message) {
            setGuideText(message);
            setPhase('complete'); // Directly show complete/message phase
        } else {
            setGuideText('시스템 노이즈를 정화하고\n내면의 핵을 보호합니다.');
            setPhase('intro');
        }
    }, [message, visible]);

    const sunScale = useSharedValue(1);
    const sunOpacity = useSharedValue(0.6);
    const progress = useSharedValue(0);

    const startBreathing = () => {
        setPhase('breathing');
        setGuideText('숨을 깊게 들이마십니다...');
        
        // 4-4-4 Breathing Cycle
        sunScale.value = withRepeat(
            withSequence(
                // Inhale (4s)
                withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.quad) }, (finished) => {
                    if (finished) runOnJS(setGuideText)('잠시 멈춥니다...');
                }),
                // Hold (4s)
                withTiming(1.5, { duration: 4000 }, (finished) => {
                    if (finished) runOnJS(setGuideText)('천천히 내뱉습니다...');
                }),
                // Exhale (4s)
                withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }, (finished) => {
                    if (finished) {
                        runOnJS(handleCycleComplete)();
                    }
                })
            ),
            3, // 3 cycles
            false
        );

        sunOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 4000 }),
                withTiming(1, { duration: 4000 }),
                withTiming(0.6, { duration: 4000 })
            ),
            3,
            false
        );
    };

    const handleCycleComplete = () => {
        setCycleCount(prev => {
            if (prev >= 2) {
                setPhase('complete');
                setGuideText('시스템이 안정되었습니다.\n평온한 상태로 복귀합니다.');
                return prev + 1;
            }
            setGuideText('숨을 깊게 들이마십니다...');
            return prev + 1;
        });
    };

    const sunStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sunScale.value }],
        opacity: sunOpacity.value,
    }));

    useEffect(() => {
        if (!visible) {
            setPhase('intro');
            setCycleCount(0);
            sunScale.value = 1;
            sunOpacity.value = 0.6;
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.container}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>시스템 안정화 (Stabilization)</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.sunContainer}>
                        {/* Outer Glows */}
                        <ReAnimated.View style={[styles.sunGlow, { width: 200, height: 200, opacity: 0.2 }]} />
                        <ReAnimated.View style={[styles.sunGlow, { width: 250, height: 250, opacity: 0.1 }]} />
                        
                        {/* Main Sun Core */}
                        <ReAnimated.View style={[styles.sunCore, sunStyle]}>
                            <ShieldCheck size={40} color="white" opacity={0.8} />
                        </ReAnimated.View>
                    </View>

                    <Text style={styles.guideText}>{guideText}</Text>

                    {phase === 'intro' && (
                        <TouchableOpacity style={styles.actionBtn} onPress={startBreathing}>
                            <Wind size={20} color="white" />
                            <Text style={styles.actionBtnText}>안정화 시작</Text>
                        </TouchableOpacity>
                    )}

                    {phase === 'complete' && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4A5D4E' }]} onPress={onComplete}>
                            <Sparkles size={20} color="white" />
                            <Text style={styles.actionBtnText}>우주로 돌아가기</Text>
                        </TouchableOpacity>
                    )}

                    {phase === 'breathing' && (
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>{cycleCount + 1} / 3 사이클</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerInfo}>내면의 핵(Self-Core)을 보호하고 감각을 현존시킵니다.</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        opacity: 0.8,
    },
    closeBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    sunContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 80,
    },
    sunCore: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FF9800',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 15,
    },
    sunGlow: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#FF9800',
    },
    guideText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 30,
        height: 60,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF9800',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        gap: 10,
        marginTop: 60,
    },
    actionBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    progressContainer: {
        marginTop: 40,
    },
    progressText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.6,
    },
    footer: {
        paddingBottom: 60,
        alignItems: 'center',
    },
    footerInfo: {
        color: 'white',
        fontSize: 12,
        opacity: 0.5,
    }
});
