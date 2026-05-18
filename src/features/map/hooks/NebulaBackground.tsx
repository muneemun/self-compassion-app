import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Filter, FeGaussianBlur, Rect } from 'react-native-svg';
import ReAnimated, { 
    useAnimatedProps, 
    useSharedValue, 
    withRepeat, 
    withTiming, 
    withSequence,
    Easing,
    interpolateColor,
    useAnimatedStyle
} from 'react-native-reanimated';
import { AtmosphereTheme } from './useOrbitAtmosphere';

const AnimatedCircle = ReAnimated.createAnimatedComponent(Circle);

interface NebulaBlobProps {
    index: number;
    color: string;
    width: number;
    height: number;
    speed: number;
}

const NebulaBlob = ({ index, color, width, height, speed }: NebulaBlobProps) => {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        // Create organic floating motion (random-ish)
        const duration = 8000 + index * 2000;
        const radiusX = width * 0.3;
        const radiusY = height * 0.3;

        tx.value = withRepeat(
            withSequence(
                withTiming(radiusX, { duration, easing: Easing.inOut(Easing.sin) }),
                withTiming(-radiusX, { duration, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        ty.value = withRepeat(
            withSequence(
                withTiming(-radiusY, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) }),
                withTiming(radiusY, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.8, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        cx: (width / 2) + tx.value,
        cy: (height / 2) + ty.value,
        r: (width * 0.4) * scale.value,
    }));

    return (
        <AnimatedCircle
            animatedProps={animatedProps}
            fill={color}
            opacity={0.6}
        />
    );
};

export const NebulaBackground = ({ theme }: { theme: AtmosphereTheme }) => {
    const { width, height } = useWindowDimensions();
    
    // Smoothly transition base background color
    const bgProgress = useSharedValue(0);
    useEffect(() => {
        bgProgress.value = 0;
        bgProgress.value = withTiming(1, { duration: 2000 });
    }, [theme.backgroundColor]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        backgroundColor: theme.backgroundColor,
        ...StyleSheet.absoluteFillObject,
    }));

    // Define 4 blobs with colors from gradient
    const blobColors = useMemo(() => {
        const colors = theme.gradientColors;
        return [
            colors[0], 
            colors[1] || colors[0], 
            colors[2] || colors[1] || colors[0],
            theme.waveColor !== 'transparent' ? theme.waveColor : colors[0]
        ];
    }, [theme]);

    return (
        <ReAnimated.View style={animatedContainerStyle}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <Filter id="nebulaBlur">
                        <FeGaussianBlur in="SourceGraphic" stdDeviation="60" />
                    </Filter>
                </Defs>
                <Rect width="100%" height="100%" fill={theme.backgroundColor} />
                <View style={StyleSheet.absoluteFill}>
                    <Svg width="100%" height="100%" filter="url(#nebulaBlur)">
                        {blobColors.map((color, i) => (
                            <NebulaBlob 
                                key={`${theme.state}-${i}`} 
                                index={i} 
                                color={color} 
                                width={width} 
                                height={height} 
                                speed={theme.swirlSpeed}
                            />
                        ))}
                    </Svg>
                </View>
            </Svg>
        </ReAnimated.View>
    );
};
