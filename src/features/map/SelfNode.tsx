import * as React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import ReAnimated, { useAnimatedStyle, withRepeat, withTiming, Easing, useSharedValue } from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';

interface SelfNodeProps {
    size?: number;
    profileImg?: string;
    energyCondition?: number; // 0-100
}

export const SelfNode: React.FC<SelfNodeProps> = ({ 
    size = 60, 
    profileImg = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    energyCondition = 70
}) => {
    const twinkleAnim = useSharedValue(0);
    const isCrisis = energyCondition <= 25;
    const isDepleted = energyCondition <= 50;

    React.useEffect(() => {
        // Higher energy = faster, more vibrant pulse
        const duration = isCrisis ? 4000 : isDepleted ? 3000 : 2000;
        twinkleAnim.value = withRepeat(
            withTiming(1, {
                duration: duration,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        );
    }, [energyCondition, isCrisis, isDepleted]);

    const selfHaloStyle = useAnimatedStyle(() => {
        const scale = 1 + twinkleAnim.value * (isCrisis ? 0.05 : 0.2);
        const opacity = isCrisis ? 0.1 : (energyCondition / 100) * 0.5 - (twinkleAnim.value * 0.1);
        return {
            transform: [{ scale: scale }],
            opacity: opacity
        };
    });

    const coreStyle = useAnimatedStyle(() => {
        // Low energy = desaturated/shaky
        const translateX = isCrisis ? Math.sin(twinkleAnim.value * Math.PI * 10) * 1 : 0;
        const translateY = isCrisis ? Math.cos(twinkleAnim.value * Math.PI * 10) * 1 : 0;
        
        return {
            opacity: isCrisis ? 0.6 : 1,
            transform: [
                { translateX: translateX },
                { translateY: translateY }
            ] as any
        };
    });

    return (
        <TouchableOpacity 
            style={styles.container}
            activeOpacity={0.8}
            onPress={() => useAppStore.getState().setSelfTimeModalOpen(true)}
        >
            {/* Solar Amber Heartbeat Glow */}
            <ReAnimated.View style={[
                styles.halo,
                {
                    width: size + 20,
                    height: size + 20,
                    borderRadius: (size + 20) / 2,
                    backgroundColor: isCrisis ? '#90A4AE' : isDepleted ? '#FFB74D' : '#FF9800',
                },
                selfHaloStyle
            ]} />

            <ReAnimated.View style={[
                styles.core,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: isCrisis ? '#78909C' : '#FF9800',
                },
                coreStyle
            ]}>
                <ReAnimated.Image
                    source={{ uri: profileImg }}
                    style={[
                        styles.avatar,
                        {
                            width: size - 8,
                            height: size - 8,
                            borderRadius: (size - 8) / 2
                        }
                    ]}
                />
            </ReAnimated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    halo: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 152, 0, 0.4)',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 4
    },
    core: {
        borderWidth: 2,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    avatar: {
        backgroundColor: '#F0F0F0',
    }
});
