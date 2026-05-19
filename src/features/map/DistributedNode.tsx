import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ReAnimated, { useAnimatedStyle, withSpring, SharedValue } from 'react-native-reanimated';
import { RelationshipNode, getDynamicCharacter, RQS_GRADE_BADGES } from '../../types/relationship';
import { Zap, Flame, CircleDashed, Leaf } from 'lucide-react-native';

interface DistributedNodeProps {
    node: RelationshipNode;
    radius: number;
    angle: number;
    zoomSharedValue: SharedValue<number>;
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
    const rqsGrade = node.rqsResult?.grade ? RQS_GRADE_BADGES[node.rqsResult.grade] : null;
    
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

    const renderCharacterBadge = () => {
        if (!character) return null;
        const iconSize = 10;
        let icon = null;
        if (character.icon === 'Zap')          icon = <Zap color="white" size={iconSize} />;
        else if (character.icon === 'Flame')   icon = <Flame color="white" size={iconSize} fill="white" />;
        else if (character.icon === 'CircleDashed') icon = <CircleDashed color="white" size={iconSize} />;
        else                                   icon = <Leaf color="white" size={iconSize} />;

        return (
            <View style={[styles.badge, { backgroundColor: character.color }]}>
                {icon}
            </View>
        );
    };

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
                ]}>
                    <Image 
                        source={{ uri: node.image || 'https://via.placeholder.com/100' }} 
                        style={styles.avatar} 
                    />
                </View>
                
                {/* Primary character badge */}
                <View style={styles.badgeContainer}>
                    {renderCharacterBadge()}
                </View>

                {/* RQS grade supplementary badge (top-left) */}
                {rqsGrade && (
                    <View style={[styles.rqsBadge, { backgroundColor: rqsGrade.color }]}>
                        <Text style={styles.rqsBadgeText}>{rqsGrade.grade}</Text>
                    </View>
                )}

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
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    rqsBadge: {
        position: 'absolute',
        top: 0,
        left: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'white',
    },
    rqsBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'white',
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
