import React from 'react';
import ReAnimated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Circle } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const BASE_ORBIT_SIZE = width * 0.85;

interface OrbitRingProps {
    level: number;
    colors: any;
    zoomSharedValue: SharedValue<number>;
}

export const OrbitRing: React.FC<OrbitRingProps> = ({ level, colors, zoomSharedValue }) => {
    const animatedProps = useAnimatedStyle(() => {
        const scaleFactor = 0.55 + (zoomSharedValue.value - 1) * 0.3375;
        const radius = (BASE_ORBIT_SIZE * (level + 0.5)) / 3.5;
        return {
            r: radius * scaleFactor
        } as any;
    });

    // 🧬 Stable Svg Component (Static R for now to avoid props error in some RN versions)
    const radius = (BASE_ORBIT_SIZE * (level + 0.5)) / 3.5;

    return (
        <Circle
            cx="0"
            cy="0"
            r={radius}
            stroke={colors.primary}
            strokeWidth={1}
            fill="none"
            opacity={0.08}
            strokeDasharray="4 4"
        />
    );
};
