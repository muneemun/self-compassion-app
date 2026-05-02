import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ReAnimated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { RelationshipNode, getDynamicCharacter } from '../../types/relationship';
import { Skull, Shield, Star, Zap, Heart, Info } from 'lucide-react-native';

interface DistributedNodeProps {
    node: RelationshipNode;
    radius: number;
    angle: number;
    zoomSharedValue: ReAnimated.SharedValue<number>;
    onSelectNode: (id: string) => void;
}

export const DistributedNode: React.FC<DistributedNodeProps> = ({ 
    node, 
    radius, 
    angle, 
    zoomSharedValue, 
    onSelectNode 
}) => {
    const character = getDynamicCharacter(node.history || []);
    
    const animatedStyle = useAnimatedStyle(() => {
        const scaleFactor = 0.55 + (zoomSharedValue.value - 1) * 0.3375;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius * scaleFactor;
        const y = Math.sin(rad) * radius * scaleFactor;
        
        return {
            transform: [
                { translateX: x },
                { translateY: y },
                { scale: withSpring(0.6 + (zoomSharedValue.value * 0.1), { damping: 15 }) }
            ]
        };
    });

    const isVampire = character?.type === 'Vampire';
    const isAntidote = character?.type === 'Antidote';

    return (
        <ReAnimated.View style={[styles.container, animatedStyle]}>
            <TouchableOpacity 
                onPress={() => onSelectNode(node.id)}
                activeOpacity={0.8}
                style={styles.touchArea}
            >
                <View style={[
                    styles.avatarFrame, 
                    { borderColor: character?.color || '#4A5D4E' },
                    isVampire && styles.vampireFrame,
                    isAntidote && styles.antidoteFrame
                ]}>
                    <Image 
                        source={{ uri: node.image || 'https://via.placeholder.com/100' }} 
                        style={styles.avatar} 
                    />
                    {isVampire && <View style={styles.vampireOverlay} />}
                </View>
                
                <View style={styles.badgeContainer}>
                    {isVampire ? (
                        <View style={[styles.badge, { backgroundColor: '#2C2C2C' }]}><Skull color="white" size={10} /></View>
                    ) : isAntidote ? (
                        <View style={[styles.badge, { backgroundColor: '#D98B73' }]}><Shield color="white" size={10} /></View>
                    ) : null}
                </View>

                <View style={styles.labelContainer}>
                    <Text style={styles.label} numberOfLines={1}>{node.name}</Text>
                </View>
            </TouchableOpacity>
        </ReAnimated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    touchArea: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarFrame: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        backgroundColor: 'white',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3
    },
    vampireFrame: {
        borderWidth: 3,
        shadowColor: '#2C2C2C',
        shadowOpacity: 0.4,
    },
    antidoteFrame: {
        borderWidth: 3,
        shadowColor: '#D98B73',
        shadowOpacity: 0.4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    vampireOverlay: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(44, 44, 44, 0.3)',
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 12,
        right: -4,
    },
    badge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'white'
    },
    labelContainer: {
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.1)'
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4A5D4E'
    }
});
