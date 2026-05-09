import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import {
    View,
    Text,
    Dimensions,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated as RNAnimated,
    PanResponder,
    ScrollView,
    TextInput,
    Easing as RNEasing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { AppHeader } from '../../components/AppHeader';
import {
    Search, Plus, LocateFixed, LayoutGrid, List,
    ChevronDown, ChevronUp, HeartPulse, X, ChevronRight,
    Edit3, RefreshCw, Zap, Users, Target, Briefcase, Heart, ArrowUpDown, Flame, Leaf, CircleDashed, Activity, Snowflake
} from 'lucide-react-native';
import { RelationshipList } from '../relationships/RelationshipList';
import { RELATIONSHIP_TYPE_LABELS, RelationshipNode, getDynamicCharacter, RQS_GRADE_BADGES } from '../../types/relationship';
import { BlurView } from 'expo-blur';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useAppStore } from '../../store/useAppStore';
import { RelationshipLogModal } from '../relationships/RelationshipLogModal';
import { SystemStabilizationModal } from './SystemStabilizationModal';
import Svg, { G, Circle, Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import ReAnimated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming,
    withRepeat,
    Easing,
    SharedValue,
    withSequence,
    withDelay
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BASE_ORBIT_SIZE = width * 1.1;

// 🧩 4-Quadrant Character Badge
const BadgeIcon = ({ node }: { node: RelationshipNode }) => {
    const character = getDynamicCharacter(node.interactions || []);
    const iconSize = 14;
    if (!character) return null;
    if (character.icon === 'Zap')          return <Zap color={character.color} size={iconSize} />;
    if (character.icon === 'Flame')        return <Flame color={character.color} size={iconSize} fill={character.color} />;
    if (character.icon === 'CircleDashed') return <CircleDashed color={character.color} size={iconSize} />;
    return <Leaf color={character.color} size={iconSize} />;
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    filterBar: {
        paddingVertical: 12,
        backgroundColor: 'transparent',
        zIndex: 500,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    filterBarExpanded: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(74,93,78,0.1)',
        paddingHorizontal: 20,
    },
    filterBarScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 10,
    },
    filterToggleBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        marginRight: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'transparent',
        // Shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    orbitCanvas: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        overflow: 'hidden',
    },
    animatedCanvas: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    orbitRing: {
        position: 'absolute',
        borderWidth: 1.5,
    },
    centerNode: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        padding: 4,
        backgroundColor: '#fff',
        zIndex: 5,
    },
    centerAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    userNodeContainer: {
        position: 'absolute',
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 6,
        overflow: 'visible',
    },
    listViewContainer: {
        flex: 1,
        width: '100%',
    },
    mapOverlayControls: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        pointerEvents: 'box-none',
    },
    avatarWrapper: {
        borderRadius: 100,
        borderWidth: 2,
        backgroundColor: '#fff',
        padding: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    nodeIndicator: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#fff',
    },
    statusOverlay: {
        position: 'absolute',
        bottom: 240, // 체크인 버튼(160 + 64) 위로 이동하여 겹침 방지
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 15,
    },
    statusInfo: {
        fontSize: 13,
        fontWeight: '600',
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 15,
        overflow: 'hidden',
        textAlign: 'center',
    },
    checkInButton: {
        position: 'absolute',
        bottom: 160,
        alignSelf: 'center',
        paddingHorizontal: 24,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 10,
        zIndex: 100,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    checkInText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    modalFullContainer: {
        flex: 1,
    },
    modalHeader: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    modalCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
    },
    modalHeaderSide: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    searchFilterWrapper: {
        marginBottom: 20,
    },
    searchFilterScroll: {
        gap: 10,
    },
    searchFilterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
    },
    searchFilterText: {
        fontSize: 14,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7F5',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 54,
        marginBottom: 24,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    selectionList: {
        flex: 1,
    },
    listSectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9E9E9E',
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 1,
    },
    miniAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9F9F9',
        overflow: 'hidden',
    },
    miniAvatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4A5D4E',
    },
    personName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#2F332F',
    },
    personMeta: {
        fontSize: 12,
        color: '#8C968D',
        marginTop: 2,
        fontWeight: '600',
    },
    tagBadge: {
        backgroundColor: 'rgba(217, 139, 115, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#D98B73',
    },
    emptySearch: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 12,
    },
    emptySearchText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8C968D',
        opacity: 0.5,
    },
    searchResultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 24,
        shadowColor: '#4a5d4e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
    },
    typeBadgeMini: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#F9FBF9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
    },
    tempContainer: {
        alignItems: 'center',
        paddingLeft: 8,
        gap: 4,
    },
    tempBarBackground: {
        width: 5,
        height: 32,
        borderRadius: 2.5,
        backgroundColor: 'rgba(74,93,78,0.1)',
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    tempBarFill: {
        width: '100%',
        borderRadius: 3,
    },
    tempText: {
        fontSize: 10,
        fontWeight: '800',
    },
    actionFullScreenView: {
        flex: 1,
    },
    actionCardLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    actionIconBgLarge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabelLarge: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2F332F',
    },
    actionDescLarge: {
        fontSize: 11,
        color: '#8C968D',
        fontWeight: '600',
        marginTop: 0,
    },
    selectedPersonHeader: {
        alignItems: 'center',
        marginTop: 10,
    },
    largeAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9F9F9',
        marginBottom: 12,
        overflow: 'hidden',
    },
    largeAvatarImg: {
        width: '100%',
        height: '100%',
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2F332F',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#8C968D',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '600',
    },
    actionGrid: {
        width: '100%',
        gap: 12,
    },
    rightControls: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -100 }],
        alignItems: 'center',
        gap: 16,
        zIndex: 25,
    },
    zoomControls: {
        borderRadius: 20,
        padding: 6,
        gap: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    zoomBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomBtnText: {
        fontSize: 12,
        fontWeight: '800',
    },
    recenterBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    dotNode: {
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#fff',
    },
    nodeLabelContainer: {
        position: 'absolute',
        bottom: -24,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: 'rgba(74, 93, 78, 0.15)',
        minWidth: 60,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    nodeNameText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2F332F',
    },
    avatarAura: {
        position: 'absolute',
        zIndex: 1,
    },
    dotPulse: {
        position: 'absolute',
    },
    sparkle: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    feedbackMessageOverlay: {
        position: 'absolute',
        bottom: 120,
        left: 20,
        right: 20,
        padding: 24,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        overflow: 'hidden',
    },
    feedbackMessageText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4A5D4E',
        textAlign: 'center',
        lineHeight: 24,
    },
});

// 💍 OrbitRing Component for high-performance scaling
const OrbitRing = React.memo(({ level, colors, zoomSharedValue }: { level: number, colors: any, zoomSharedValue: SharedValue<number> }) => {
    const zoneColors: Record<number, string> = {
        1: '#FFB74D',
        2: '#D98B73',
        3: '#4A5D4E',
        4: '#90A4AE',
        5: '#D1D5DB'
    };
    const orbitColor = zoneColors[level] || colors.primary;

    const animatedStyle = useAnimatedStyle(() => {
        // 1단계를 0.55배로 고정하고, 5단계가 현재 4단계 크기(1.9배)가 되도록 공식 수정
        const scaleFactor = 0.55 + (zoomSharedValue.value - 1) * 0.3375;
        const baseSize = (BASE_ORBIT_SIZE * (level + 0.5)) / 3.5;
        const size = baseSize * scaleFactor;

        return {
            width: size,
            height: size,
            borderRadius: size / 2,
        };
    });

    return (
        <ReAnimated.View
            style={[
                styles.orbitRing,
                animatedStyle,
                {
                    borderColor: orbitColor,
                    borderWidth: 2.5,
                    opacity: 0.25 - (level * 0.03),
                    backgroundColor: level === 1 ? 'rgba(255,183,77,0.03)' : (level % 2 === 0 ? 'rgba(74,93,78,0.03)' : 'transparent')
                }
            ]}
        />
    );
});

interface UserNodeProps {
    node: RelationshipNode;
    orbitRadius: number;
    initialAngle: number;
    zoomLevel: number;
    zoomSharedValue: SharedValue<number>;
    totalNodes: number;
    onSelectNode?: (id: string) => void;
    isNew?: boolean;
}
const UserNode = memo(({
    node,
    orbitRadius,
    initialAngle,
    zoomLevel,
    zoomSharedValue,
    totalNodes,
    onSelectNode,
    isNew
}: UserNodeProps) => {
    const twinkleAnim = useSharedValue(0);

    useEffect(() => {
        twinkleAnim.value = withRepeat(
            withTiming(1, {
                duration: 1500 + Math.random() * 1000,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        );
    }, []);
    // Re-introduce SharedValues to ensure visibility updates
    // If it's new, start from outside the orbit for the fly-in effect
    const radius = useSharedValue(isNew ? BASE_ORBIT_SIZE * 2 : orbitRadius);
    const angle = useSharedValue(initialAngle);

    useEffect(() => {
        // Update values directly with spring animation (No delta accumulation logic to avoid drift)
        radius.value = withSpring(orbitRadius, { damping: 20, stiffness: 90 });
        angle.value = withSpring(initialAngle, { damping: 20, stiffness: 60 });
    }, [orbitRadius, initialAngle]);

    const animatedStyle = useAnimatedStyle(() => {
        const rad = (angle.value * Math.PI) / 180;
        const scaleFactor = 0.55 + (zoomSharedValue.value - 1) * 0.3375;
        const currentRadius = radius.value * scaleFactor;

        return {
            transform: [
                { translateX: Math.cos(rad) * currentRadius },
                { translateY: Math.sin(rad) * currentRadius },
                { scale: Math.min(1.3, scaleFactor) } // 맵 크기에 맞춰 아이콘 팽창률도 조정
            ]
        };
    });

    const twinkleStyle = useAnimatedStyle(() => {
        const scale = 0.8 + twinkleAnim.value * 0.4;
        const opacity = 0.7 + twinkleAnim.value * 0.3;
        return {
            transform: [{ scale }],
            opacity
        };
    });

    // Pulse Animation
    const pulseAnim = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        if (zoomLevel <= 1.5) {
            pulseAnim.setValue(0);
            return;
        }

        const duration = node.temperature > 80 ? 3000 : node.temperature > 50 ? 2000 : 1500;

        const animation = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulseAnim, {
                    toValue: 1,
                    duration: duration,
                    easing: RNEasing.inOut(RNEasing.sin),
                    useNativeDriver: true,
                }),
                RNAnimated.timing(pulseAnim, {
                    toValue: 0,
                    duration: duration,
                    easing: RNEasing.inOut(RNEasing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [node.temperature, zoomLevel, pulseAnim]);

    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.05],
    });

    const renderContent = () => {
        const densityFactor = totalNodes > 100 ? 0.65 : totalNodes > 50 ? 0.8 : 1.0;

        if (zoomLevel < 1.5) {
            // Level 1: Visible Dots
            const dotSize = 12 * (0.8 + densityFactor * 0.2); // 16px -> 12px로 축소
            const zoneColors: Record<number, string> = {
                1: '#FFB74D',
                2: '#D98B73',
                3: '#4A5D4E',
                4: '#90A4AE',
                5: '#D1D5DB'
            };
            const dotColor = zoneColors[node.zone] || '#4A5D4E';

            return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <ReAnimated.View style={[
                        styles.dotNode,
                        twinkleStyle,
                        {
                            backgroundColor: dotColor,
                            width: dotSize,
                            height: dotSize,
                            borderRadius: dotSize / 2,
                            borderWidth: 2,
                            borderColor: '#fff',
                            shadowColor: dotColor,
                            shadowOpacity: 0.5,
                            shadowRadius: 4,
                            elevation: 3,
                        }
                    ]} />
                </View>
            );
        }

        // 줌 단계별 정교한 아바타 크기 계층화: 28(G) -> 36(C) -> 42(S) -> 48(O)
        const avatarSize = (
            zoomLevel < 2.5 ? 28 :
                zoomLevel < 3.5 ? 36 :
                    zoomLevel < 4.5 ? 42 :
                        48
        ) * (0.7 + densityFactor * 0.3);
        const showName = zoomLevel > 2.5;

        const zoneColors: Record<number, string> = {
            1: '#FFB74D',
            2: '#D98B73',
            3: '#4A5D4E',
            4: '#90A4AE',
            5: '#D1D5DB'
        };
        const accentColor = zoneColors[node.zone] || '#4A5D4E';

        return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', justifyContent: 'center', width: avatarSize + 8, height: avatarSize + 8 }}>
                    <RNAnimated.View style={[
                        styles.avatarAura,
                        {
                            width: avatarSize + 8,
                            height: avatarSize + 8,
                            borderRadius: (avatarSize + 8) / 2,
                            backgroundColor: accentColor,
                            transform: [{ scale: pulseScale }],
                            opacity: pulseOpacity,
                        }
                    ]} />

                    <View style={{ zIndex: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={[
                            styles.avatarWrapper,
                            {
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: avatarSize / 2,
                                borderColor: accentColor,
                                padding: 1.5,
                            }
                        ]}>
                            {node.image ? (
                                <Image source={{ uri: node.image }} style={[styles.avatar, { borderRadius: (avatarSize - 3) / 2 }]} />
                            ) : (
                                <View style={[styles.avatar, { borderRadius: (avatarSize - 3) / 2, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Text style={{ fontSize: avatarSize / 3.5 }}>{(node.name || '?').charAt(0)}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {showName && (
                    <View style={styles.nodeLabelContainer}>
                        <Text style={styles.nodeNameText} numberOfLines={1}>
                            {node.name}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <ReAnimated.View
            style={[
                styles.userNodeContainer,
                animatedStyle,
            ]}
        >
            <TouchableOpacity
                onPress={() => onSelectNode?.(node.id)}
                activeOpacity={0.8}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                style={{ alignItems: 'center', justifyContent: 'center' }}
            >
                {renderContent()}
            </TouchableOpacity>
        </ReAnimated.View>
    );
});

interface MainOrbitMapProps {
    onSelectNode: (id: string) => void;
    onPressAdd: () => void;
    onDiagnose: (id: string, mode: 'ZONE' | 'RQS') => void;
    onRecordLog: (id: string) => void;
}

export const MainOrbitMap = ({ onSelectNode, onPressAdd, onDiagnose, onRecordLog }: MainOrbitMapProps) => {
    const colors = useColors();
    const { relationships, orbitMapViewState, setOrbitMapViewState } = useRelationshipStore();
    const { userProfile, interactionFeedback, setInteractionFeedback, cognitiveFeedback, setCognitiveFeedback } = useAppStore();
    
    // Feedback animations
    const feedbackOpacity = useSharedValue(0);
    const rippleScale1 = useSharedValue(0);
    const rippleScale2 = useSharedValue(0);
    const rippleScale3 = useSharedValue(0);
    const turbulenceValue = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);
    
    // Listen for store feedback triggers
    useEffect(() => {
        if (interactionFeedback.isActive || cognitiveFeedback.message) {
            feedbackOpacity.value = withTiming(1, { duration: 500 });
            
            // If it's self-care or interaction
            if (cognitiveFeedback.type === 'SELF_CARE' || cognitiveFeedback.type === 'INTERACTION') {
                rippleScale1.value = 0;
                rippleScale2.value = 0;
                rippleScale3.value = 0;
                rippleOpacity.value = 0.8;
                
                rippleScale1.value = withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) });
                rippleScale2.value = withDelay(400, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
                rippleScale3.value = withDelay(800, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
                rippleOpacity.value = withTiming(0, { duration: 3000 });
            }
            
            // Auto-hide after some time
            const timer = setTimeout(() => {
                feedbackOpacity.value = withTiming(0, { duration: 500 });
                if (interactionFeedback.isActive) {
                    setInteractionFeedback({ ...interactionFeedback, isActive: false });
                }
                if (cognitiveFeedback.message) {
                    setCognitiveFeedback({ message: null, type: null });
                }
            }, 4000);
            
            return () => clearTimeout(timer);
        }
    }, [interactionFeedback.isActive, cognitiveFeedback.message]);

    useEffect(() => {
        if (interactionFeedback.isActive && interactionFeedback.closenessDelta < 0) {
            // Turbulence (Jitter) for negative interaction
            turbulenceValue.value = withRepeat(
                withSequence(
                    withTiming(1.5, { duration: 40 }),
                    withTiming(-1.5, { duration: 40 })
                ),
                -1,
                true
            );
        } else {
            turbulenceValue.value = withTiming(0);
        }
    }, [interactionFeedback.isActive, interactionFeedback.closenessDelta]);

    const dimmingStyle = useAnimatedStyle(() => ({
        opacity: feedbackOpacity.value * 0.6,
    }));

    const rippleStyle1 = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale1.value }],
        opacity: rippleOpacity.value,
    }));
    const rippleStyle2 = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale2.value }],
        opacity: rippleOpacity.value * 0.7,
    }));
    const rippleStyle3 = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale3.value }],
        opacity: rippleOpacity.value * 0.4,
    }));
    // Tracking new nodes for entry animation
    const prevNodeIds = useRef(new Set(relationships.map(r => r.id)));
    useEffect(() => {
        prevNodeIds.current = new Set(relationships.map(r => r.id));
    }, [relationships]);

    // View State from Store
    const {
        zoomLevel,
        selectedFilters,
        sortMode,
        isFilterExpanded,
        activeSearchTag: storeActiveSearchTag
    } = orbitMapViewState;

    const viewMode = orbitMapViewState.viewMode || 'map';

    // ⚡ Native Zoom Engine
    const zoomSharedValue = useSharedValue(zoomLevel);

    // Sync shared value when state changes (e.g. from buttons)
    useEffect(() => {
        if (Math.abs(zoomSharedValue.value - zoomLevel) > 0.1) {
            zoomSharedValue.value = withSpring(zoomLevel, { damping: 20, stiffness: 100 });
        }
    }, [zoomLevel]);

    const currentOrbitSize = BASE_ORBIT_SIZE; // Use fixed base size for layout calculations

    // Actions Wrapper
    const setZoomLevel = (level: number) => setOrbitMapViewState({ zoomLevel: level });
    const setSelectedFilters = (filters: string[]) => setOrbitMapViewState({ selectedFilters: filters });
    const setSortMode = (mode: 'default' | 'hot' | 'cold') => setOrbitMapViewState({ sortMode: mode as any });
    const setIsFilterExpanded = (expanded: boolean) => setOrbitMapViewState({ isFilterExpanded: expanded });
    const setViewMode = (mode: 'map' | 'list') => setOrbitMapViewState({ viewMode: mode });
    const setActiveSearchTag = (tag: string) => setOrbitMapViewState({ activeSearchTag: tag });


    // 🌀 Universe Spin State
    const universeRotation = useSharedValue(0);

    // 💓 Self Heartbeat Animation (Solar Amber)
    const selfPulse = useSharedValue(1);

    useEffect(() => {
        selfPulse.value = withRepeat(
            withSequence(
                withTiming(1.08, { duration: 400, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) }),
                withTiming(1.05, { duration: 400, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            false
        );
    }, []);

    const selfHaloStyle = useAnimatedStyle(() => ({
        transform: [{ scale: selfPulse.value }],
        opacity: selfPulse.value === 1 ? 0.4 : 0.8 // Pulse opacity for glow effect
    }));

    const [isMoved, setIsMoved] = useState(false);

    // Search & Check-in Modal State
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [searchMode, setSearchMode] = useState<'navigation' | 'action'>('action');
    const [searchQuery, setSearchQuery] = useState('');
    // Use local activeSearchTag derived from store if needed, or sync directly. 
    // Here we map local logic to store.
    const activeSearchTag = storeActiveSearchTag;

    const [selectedTarget, setSelectedTarget] = useState<RelationshipNode | null>(null);
    const [isActionVisible, setIsActionVisible] = useState(false);

    // ✨ Sparkle Effect Values (Removed fake sparkles)
    const sparkleAnim = useSharedValue(0);
    const zoomAnim = useSharedValue(zoomLevel);

    useEffect(() => {
        zoomAnim.value = withTiming(zoomLevel, { duration: 300 });
    }, [zoomLevel]);

    const zoneFilters = [
        { id: 'z1', label: '핵심 그룹', zone: 1, color: '#FFB74D' },
        { id: 'z2', label: '정서적 공유 그룹', zone: 2, color: '#D98B73' },
        { id: 'z3', label: '기능적 협력 관계', zone: 3, color: '#4A5D4E' },
        { id: 'z4', label: '단순 인지 관계', zone: 4, color: '#90A4AE' },
        { id: 'z5', label: '배경 소음(외부 환경)', zone: 5, color: '#D1D5DB' },
    ];

    const uniqueTypes = Array.from(new Set((relationships || []).map(r => r && ((r.type && RELATIONSHIP_TYPE_LABELS[r.type]) || r.type)).filter(Boolean))) as string[];
    const dynamicTabs = ['전체', ...zoneFilters.map(z => z.label), ...uniqueTypes];

    const zoomLevelRef = useRef(zoomLevel);
    useEffect(() => {
        zoomLevelRef.current = zoomLevel;
    }, [zoomLevel]);

    const handleToggleFilter = (tab: string) => {
        if (!tab) return;
        if (tab === '전체') {
            setSelectedFilters(['전체']);
            return;
        }

        let newFilters = selectedFilters.filter(f => f !== '전체');
        if (newFilters.includes(tab)) {
            newFilters = newFilters.filter(f => f !== tab);
            if (newFilters.length === 0) newFilters = ['전체'];
        } else {
            newFilters.push(tab);
        }
        setSelectedFilters(newFilters);
    };

    const filteredRelationships = (selectedFilters.includes('전체')
        ? relationships
        : relationships.filter(r => {
            if (!r) return false;
            const rType = (r.type && RELATIONSHIP_TYPE_LABELS[r.type]) || r.type;
            const zoneMatch = zoneFilters.find(zf => zf.zone === r.zone);
            const rZoneLabel = zoneMatch ? zoneMatch.label : (r.zone ? `Zone ${r.zone}` : '');
            return (rType && selectedFilters.includes(rType)) || (rZoneLabel && selectedFilters.includes(rZoneLabel));
        })) || [];

    // 🌀 Smart Orbit Engine: Collision Avoidance through Multi-layer Geometric Distribution
    const distributedNodes = useMemo(() => {
        const zoneGroups: { [key: number]: RelationshipNode[] } = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        if (filteredRelationships) {
            filteredRelationships.forEach(node => {
                if (node && node.zone && zoneGroups[node.zone]) {
                    zoneGroups[node.zone].push(node);
                }
            });
        }

        const positionedNodes: Array<{ node: RelationshipNode; radius: number; angle: number }> = [];
        let startAngleOffset = 0; // Cumulative offset for cross-zone spiral flow

        Object.keys(zoneGroups).sort().forEach(zoneStr => {
            const zone = parseInt(zoneStr);
            const nodes = zoneGroups[zone];
            if (nodes.length === 0) return;

            // 1. Sort nodes within the zone based on sortMode
            // For Z-index: items later in array render ON TOP.
            let sortedNodes = [...nodes];
            if (sortMode === 'default') {
                sortedNodes.sort((a, b) => b.id.localeCompare(a.id)); // ID order reversed for consistent layering
            } else if (sortMode === 'hot') {
                // Hot Mode: High temp near Self (Inner) -> High temp at start of array
                sortedNodes.sort((a, b) => b.temperature - a.temperature);
            } else if (sortMode === 'cold') {
                // Cold Mode: Low temp near Self (Inner) -> Low temp at start of array
                sortedNodes.sort((a, b) => a.temperature - b.temperature);
            }

            const baseCircleRadius = (currentOrbitSize * (zone + 0.5)) / 7; // Spread orbits further out
            const zoneWidth = currentOrbitSize / 8; // Wider zone for more breathing room

            sortedNodes.forEach((node, idx) => {
                const progress = idx / sortedNodes.length;

                // If sorting is on, use a spiral line arrangement inside the zone
                // If default, use a more balanced distribution
                let angle, radius;

                if (sortMode !== 'default') {
                    // Swirl Line within Zone
                    angle = (startAngleOffset + progress * 360) % 360;
                    // Spiral radius: slightly sloped from inner to outer edge of the zone
                    const innerToOuterOffset = (progress - 0.5) * (zoneWidth * 0.6);
                    radius = baseCircleRadius + innerToOuterOffset;
                } else {
                    // Balanced Distribution with Golden Angle Jittering to prevent overlap
                    const maxPerLayer = zone <= 2 ? 5 : (zone === 3 ? 10 : 15);
                    const numLayers = Math.ceil(sortedNodes.length / maxPerLayer);
                    const layerIdx = idx % numLayers;
                    const idxInLayer = Math.floor(idx / numLayers);
                    const totalInThisLayer = Math.ceil(sortedNodes.length / numLayers);

                    // Add subtle random jitter based on node ID to keep overlaps consistent
                    const jitterSeed = parseInt(node.id.slice(-2), 16) || 0;
                    const jitterRadius = (jitterSeed % 10 - 5) * 4;
                    const jitterAngle = (jitterSeed % 20 - 10);

                    const layerOffset = numLayers > 1
                        ? (layerIdx - (numLayers - 1) / 2) * (zoneWidth / (numLayers + 0.2))
                        : 0;
                    radius = baseCircleRadius + layerOffset + jitterRadius;

                    const baseAngle = (idxInLayer * (360 / totalInThisLayer));
                    const staggerOffset = layerIdx * (360 / (numLayers * 2.5));
                    angle = (baseAngle + staggerOffset + startAngleOffset + jitterAngle) % 360;
                }

                positionedNodes.push({ node, radius, angle });
            });

            // Adjust next zone start angle to continue the spiral feeling
            startAngleOffset = (startAngleOffset + 45) % 360;
        });

        return positionedNodes;
    }, [filteredRelationships, currentOrbitSize, sortMode]);

    const cycleSortMode = () => {
        const modes: Array<'default' | 'hot' | 'cold'> = ['default', 'hot', 'cold'];
        const nextIndex = (modes.indexOf(sortMode) + 1) % modes.length;
        const nextMode = modes[nextIndex];

        setSortMode(nextMode);

        // Trigger Swirl Animation: 360 degree rotation
        universeRotation.value = withTiming(universeRotation.value + 360, {
            duration: 1200,
            easing: Easing.bezier(0.4, 0, 0.2, 1)
        }, (finished) => {
            if (finished) {
                universeRotation.value = 0; // 회전 완료 후 0으로 리셋하여 정위치 보정
            }
        });
    };

    // 🧬 Hoisted Animated Styles for Center Node (Self) to prevent white screen
    const selfHaloSizeStyle = useAnimatedStyle(() => {
        const centerSize = 60 + zoomSharedValue.value * 12;
        return {
            width: centerSize + 20,
            height: centerSize + 20,
            borderRadius: (centerSize + 20) / 2,
        };
    });

    const centerNodeSizeStyle = useAnimatedStyle(() => {
        const centerSize = 60 + zoomSharedValue.value * 12;
        return {
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2
        };
    });

    const centerAvatarSizeStyle = useAnimatedStyle(() => {
        const centerSize = 60 + zoomSharedValue.value * 12;
        return {
            borderRadius: (centerSize - 8) / 2
        };
    });

    const renderFilterBar = () => (
        <View style={[styles.filterBar, isFilterExpanded && styles.filterBarExpanded]}>
            {isFilterExpanded ? (
                <View style={styles.filterGrid}>
                    {dynamicTabs.map((tab) => {
                        const isSelected = selectedFilters.includes(tab);
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.filterChip,
                                    isSelected ? { backgroundColor: colors.primary } : { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(74,93,78,0.1)', borderWidth: 1 }
                                ]}
                                onPress={() => handleToggleFilter(tab)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: isSelected ? colors.white : colors.primary, opacity: isSelected ? 1 : 0.7 }
                                ]}>{tab}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarScroll}>
                    {dynamicTabs.map((tab) => {
                        const isSelected = selectedFilters.includes(tab);
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.filterChip,
                                    isSelected ? { backgroundColor: colors.primary } : { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(74,93,78,0.1)', borderWidth: 1 }
                                ]}
                                onPress={() => handleToggleFilter(tab)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: isSelected ? colors.white : colors.primary, opacity: isSelected ? 1 : 0.7 }
                                ]}>{tab}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    style={[
                        styles.filterToggleBtn,
                        { backgroundColor: colors.white },
                        sortMode === 'hot' && { borderColor: '#D98B73' },
                        sortMode === 'cold' && { borderColor: '#4E90E2' }
                    ]}
                    onPress={cycleSortMode}
                >
                    {sortMode === 'default' && <ArrowUpDown size={18} color={colors.primary} />}
                    {sortMode === 'hot' && <Flame size={18} color="#D98B73" fill="#D98B73" />}
                    {sortMode === 'cold' && <Snowflake size={18} color="#4E90E2" />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterToggleBtn, { backgroundColor: isFilterExpanded ? colors.primary : colors.white }]}
                    onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                >
                    {isFilterExpanded ? (
                        <ChevronUp size={18} color={colors.white} />
                    ) : (
                        <ChevronDown size={18} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const panX = useSharedValue(0);
    const panY = useSharedValue(-120);
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(-120);

    const canvasAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: panX.value + turbulenceValue.value },
            { translateY: panY.value + turbulenceValue.value },
            { rotate: `${universeRotation.value}deg` }
        ]
    }));

    const lastDist = useRef<number | null>(null);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return (
                    gestureState.numberActiveTouches > 1 ||
                    Math.abs(gestureState.dx) > 5 ||
                    Math.abs(gestureState.dy) > 5
                );
            },
            onPanResponderGrant: () => {
                offsetX.value = panX.value;
                offsetY.value = panY.value;
                lastDist.current = null;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.numberActiveTouches === 2) {
                    const touches = evt.nativeEvent.touches;
                    const dist = Math.sqrt(
                        Math.pow(touches[0].pageX - touches[1].pageX, 2) +
                        Math.pow(touches[0].pageY - touches[1].pageY, 2)
                    );

                    if (lastDist.current !== null) {
                        const zoomChange = (dist - lastDist.current) / 100; // 민감도 대폭 상향 (150 -> 100)
                        const next = Math.min(5, Math.max(1, zoomSharedValue.value + zoomChange));
                        zoomSharedValue.value = next;

                        // 1.5, 2.5, 3.5, 4.5 임계값에서 5단계 모드 전환
                        const currentLvl = zoomLevelRef.current;
                        const thresholds = [1.5, 2.5, 3.5, 4.5];
                        const crossedThreshold = thresholds.some(t =>
                            (currentLvl < t && next >= t) || (currentLvl >= t && next < t)
                        );

                        if (crossedThreshold) {
                            setZoomLevel(Math.round(next));
                        }
                    }
                    lastDist.current = dist;
                } else if (gestureState.numberActiveTouches === 1) {
                    panX.value = offsetX.value + gestureState.dx;
                    panY.value = offsetY.value + gestureState.dy;
                }
            },
            onPanResponderRelease: () => {
                const distance = Math.sqrt(Math.pow(panX.value, 2) + Math.pow(panY.value - (-120), 2));
                const isRotated = Math.abs(universeRotation.value % 360) > 1; // 1도 이상 틀어진 경우
                setIsMoved(distance > 20 || isRotated);

                // 릴리즈 시 가장 가까운 정수 레벨로 스냅
                const finalZoom = Math.round(zoomSharedValue.value);
                zoomSharedValue.value = withSpring(finalZoom);
                setZoomLevel(finalZoom);
                lastDist.current = null;
            }
        })
    ).current;

    const handleRecenter = () => {
        panX.value = withSpring(0, { damping: 20, stiffness: 80 });
        panY.value = withSpring(-120, { damping: 20, stiffness: 80 });
        universeRotation.value = withSpring(0, { damping: 20, stiffness: 80 });
        setIsMoved(false);
    };

    const renderHeader = () => (
        <AppHeader
            title="관계 궤도"
            leftAction={
                <TouchableOpacity
                    style={{
                        backgroundColor: colors.primary,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onPress={onPressAdd}
                >
                    <Plus size={18} color={colors.white} />
                </TouchableOpacity>
            }
            rightAction={
                <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                    >
                        {viewMode === 'map' ? (
                            <List size={22} color={colors.primary} />
                        ) : (
                            <LayoutGrid size={22} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setSearchQuery('');
                            setActiveSearchTag('전체');
                            setSearchMode('navigation');
                            setIsActionVisible(false);
                            setIsSearchModalVisible(true);
                        }}
                    >
                        <Search size={22} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            }
        />
    );

    const renderSearchModal = () => {
        if (!isSearchModalVisible) return null;

        const searchTags = dynamicTabs;

        const filteredPeople = relationships.filter(r => {
            const rTypeLabel = RELATIONSHIP_TYPE_LABELS[r.type] || r.type;
            const rZoneLabel = zoneFilters.find(zf => zf.zone === r.zone)?.label;
            const matchesQuery = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rTypeLabel.toLowerCase().includes(searchQuery.toLowerCase());

            if (activeSearchTag === '전체') return matchesQuery;
            return matchesQuery && (rTypeLabel === activeSearchTag || rZoneLabel === activeSearchTag);
        });

        const handleSelectPerson = (person: RelationshipNode | 'self') => {
            if (person === 'self') {
                setIsSearchModalVisible(false);
                // Ensure search modal is closed before opening self-time modal
                setTimeout(() => {
                    useAppStore.getState().setSelfTimeModalOpen(true);
                }, 100);
                return;
            }

            if (searchMode === 'navigation') {
                setIsSearchModalVisible(false);
                onSelectNode(person.id);
            } else if (searchMode === 'action') {
                setIsSearchModalVisible(false);
                // Directly open the check-in modal for the selected person
                setTimeout(() => {
                    useAppStore.getState().setRelationshipLogModalOpen(true, person.id);
                }, 100);
            } else {
                setSelectedTarget(person);
                setIsActionVisible(true);
            }
        };

        const handleAction = (type: 'LOG' | 'ZONE' | 'RQS') => {
            if (!selectedTarget) return;
            setIsSearchModalVisible(false);
            if (type === 'LOG') {
                onRecordLog(selectedTarget.id);
            } else {
                onDiagnose(selectedTarget.id, type);
            }
        };

        return (
            <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: colors.background }]}>
                <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                    {!isActionVisible ? (
                        <View style={[styles.modalFullContainer, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <View style={{ width: 44 }} />
                                <Text style={[styles.modalTitle, { color: colors.primary }]}>
                                    {searchMode === 'navigation' ? '인맥 검색' : '정서적 체크인'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setIsSearchModalVisible(false)}
                                >
                                    <X size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ paddingHorizontal: 20 }}>
                                <View style={styles.searchContainer}>
                                    <Search size={18} color={colors.primary} opacity={0.4} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="이름이나 태그 검색..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        placeholderTextColor="#999"
                                        autoFocus
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <X size={18} color={colors.primary} opacity={0.4} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.searchFilterWrapper}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.searchFilterScroll}>
                                        {searchTags.map(tag => (
                                            <TouchableOpacity
                                                key={tag}
                                                style={[
                                                    styles.searchFilterChip,
                                                    activeSearchTag === tag ? { backgroundColor: colors.accent } : { backgroundColor: '#F0EADE' }
                                                ]}
                                                onPress={() => setActiveSearchTag(tag)}
                                            >
                                                <Text style={[
                                                    styles.searchFilterText,
                                                    { color: activeSearchTag === tag ? 'white' : colors.primary }
                                                ]}>{tag}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <Text style={styles.listSectionLabel}>검색 결과 • {filteredPeople.length + (searchMode === 'action' ? 1 : 0)}명</Text>
                                </View>

                                {searchMode === 'action' && searchQuery === '' && activeSearchTag === '전체' && (
                                    <TouchableOpacity
                                        style={[styles.selectionItem, { backgroundColor: colors.white + '80', borderStyle: 'dashed', borderWidth: 1, borderColor: colors.accent }]}
                                        onPress={() => handleSelectPerson('self')}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
                                                <Heart size={20} color={colors.accent} />
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primary }}>나와의 시간 (Self-Time)</Text>
                                                <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>오늘 나를 위한 돌봄 기록하기</Text>
                                            </View>
                                        </View>
                                        <ChevronRight size={18} color={colors.accent} />
                                    </TouchableOpacity>
                                )}

                                {filteredPeople.map((person) => {
                                    // Zone & Dynamics Logic
                                    const zoneColor = {
                                        1: '#FFB74D',
                                        2: '#D98B73',
                                        3: '#4A5D4E',
                                        4: '#90A4AE',
                                        5: '#D1D5DB'
                                    }[person.zone] || colors.primary;

                                    const dynamics = (() => {
                                        if (person.temperature >= 80) return { color: '#D98B73' };
                                        if (person.temperature <= 40) return { color: '#90A4AE' };
                                        return { color: '#4A5D4E' };
                                    })();

                                    return (
                                        <TouchableOpacity
                                            key={person.id}
                                            style={styles.searchResultCard}
                                            onPress={() => handleSelectPerson(person)}
                                        >
                                            <View style={styles.avatarContainer}>
                                                <View style={[styles.miniAvatar, { borderColor: zoneColor, borderWidth: 3, width: 64, height: 64, borderRadius: 32, padding: 2 }]}>
                                                    {person.image ? (
                                                        <Image source={{ uri: person.image }} style={[styles.miniAvatarImg, { borderRadius: 28 }]} />
                                                    ) : (
                                                        <View style={{ flex: 1, width: '100%', height: '100%', borderRadius: 28, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                                                            <Text style={[styles.avatarInitial, { fontSize: 24 }]}>{(person.name || '?').charAt(0)}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {/* Badge Icon Positioned Bottom-Right */}
                                                {(() => {
                                                    const personCharacter = getDynamicCharacter(person.history || []);
                                                    const personRqsGrade = person.rqsResult?.grade ? RQS_GRADE_BADGES[person.rqsResult.grade] : null;
                                                    return (
                                                        <>
                                                            {personCharacter && (
                                                                <View style={{
                                                                    position: 'absolute',
                                                                    bottom: -2,
                                                                    right: -2,
                                                                    width: 26,
                                                                    height: 26,
                                                                    borderRadius: 13,
                                                                    backgroundColor: personCharacter.bgColor,
                                                                    borderWidth: 2,
                                                                    borderColor: personCharacter.color,
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    <BadgeIcon node={person} />
                                                                </View>
                                                            )}
                                                            {personRqsGrade && (
                                                                <View style={{
                                                                    position: 'absolute',
                                                                    top: -4,
                                                                    left: -4,
                                                                    width: 18,
                                                                    height: 18,
                                                                    borderRadius: 9,
                                                                    backgroundColor: personRqsGrade.color,
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    borderWidth: 2,
                                                                    borderColor: '#fff',
                                                                }}>
                                                                    <Text style={{ fontSize: 8, fontWeight: '900', color: '#fff' }}>{personRqsGrade.grade}</Text>
                                                                </View>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </View>

                                            <View style={styles.infoContainer}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                    <Text style={[styles.personName, { fontSize: 18, color: colors.primary }]}>{person.name}</Text>
                                                </View>
                                                <Text style={[styles.personMeta, { fontSize: 13, color: colors.primary, opacity: 0.6 }]}>
                                                    {person.role} • Zone {person.zone}
                                                </Text>
                                            </View>

                                            <View style={styles.tempContainer}>
                                                <View style={styles.tempBarBackground}>
                                                    <View
                                                        style={[
                                                            styles.tempBarFill,
                                                            {
                                                                height: `${Math.max(0, Math.min(100, person.temperature || 0))}%`,
                                                                backgroundColor: (person.temperature || 0) > 70 ? colors.accent : colors.primary,
                                                                opacity: Math.max(0.1, (person.temperature || 0) / 100)
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={[styles.tempText, { color: (person.temperature || 0) > 70 ? colors.accent : colors.primary }]}>
                                                    {person.temperature || 0}°
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                                {filteredPeople.length === 0 && (
                                    <View style={styles.emptySearch}>
                                        <Search size={40} color={colors.primary} opacity={0.1} />
                                        <Text style={styles.emptySearchText}>검색 결과가 없습니다</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    ) : (
                        <View style={styles.actionFullScreenView}>
                            <View style={[styles.modalFullContainer, { backgroundColor: colors.background }]}>
                                <View style={styles.modalHeader}>
                                    <View style={{ width: 44 }} />
                                    <Text style={[styles.modalTitle, { color: colors.primary }]}>
                                        {searchMode === 'navigation' ? '인맥 검색' : searchMode === 'action' ? '체크인 대상 선택' : '액션 선택'}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setIsSearchModalVisible(false)}
                                        style={styles.modalCloseBtn}
                                    >
                                        <X size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ paddingHorizontal: 20 }}>
                                    <View style={styles.selectedPersonHeader}>
                                        <View style={[styles.largeAvatar, { borderColor: colors.primary }]}>
                                            {selectedTarget?.image ? (
                                                <Image source={{ uri: selectedTarget.image }} style={styles.largeAvatarImg} />
                                            ) : (
                                                <Text style={{ fontSize: 32 }}>{(selectedTarget?.name || '?').charAt(0)}</Text>
                                            )}
                                        </View>
                                        <Text style={[styles.actionTitle, { fontSize: 24 }]}>{selectedTarget?.name}님</Text>
                                        <Text style={styles.actionSubtitle}>수행할 액션을 선택해주세요</Text>
                                    </View>
                                </View>

                                <View style={[styles.actionGrid, { marginTop: 40, paddingHorizontal: 20 }]}>
                                    <TouchableOpacity style={styles.actionCardLarge} onPress={() => handleAction('LOG')}>
                                        <View style={[styles.actionIconBgLarge, { backgroundColor: '#F0F4F0' }]}>
                                            <Edit3 size={28} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.actionLabelLarge}>정서 기록</Text>
                                            <Text style={styles.actionDescLarge}>오늘의 대화나 기분을 기록합니다</Text>
                                        </View>
                                        <ChevronRight size={20} color={colors.primary} opacity={0.3} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionCardLarge} onPress={() => handleAction('ZONE')}>
                                        <View style={[styles.actionIconBgLarge, { backgroundColor: '#FFF5F0' }]}>
                                            <RefreshCw size={28} color={colors.accent} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.actionLabelLarge}>오빗존 재설정</Text>
                                            <Text style={styles.actionDescLarge}>심리적 거리를 다시 측정합니다</Text>
                                        </View>
                                        <ChevronRight size={20} color={colors.primary} opacity={0.3} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionCardLarge} onPress={() => handleAction('RQS')}>
                                        <View style={[styles.actionIconBgLarge, { backgroundColor: '#F0F7FF' }]}>
                                            <Zap size={28} color="#4A90E2" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.actionLabelLarge}>캐릭터 심화 진단</Text>
                                            <Text style={styles.actionDescLarge}>관계의 질적 분석을 수행합니다</Text>
                                        </View>
                                        <ChevronRight size={20} color={colors.primary} opacity={0.3} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            </View>
        );
    };

    return (
        <>
            <HubLayout
                header={renderHeader()}
                scrollable={false}
            >
                <View style={styles.content}>
                    {renderFilterBar()}

                    {/* List Mode View */}
                    <View style={[styles.listViewContainer, viewMode === 'list' ? { display: 'flex' } : { display: 'none', height: 0 }]}>
                        <RelationshipList
                            hideHeader
                            onSelect={onSelectNode}
                            onPressAdd={onPressAdd}
                            selectedTab={selectedFilters?.[0] || '전체'}
                            onSelectTab={handleToggleFilter}
                            selectedFilters={selectedFilters || ['전체']}
                            dynamicTabs={dynamicTabs}
                            sortMode={sortMode}
                        />
                    </View>

                    {/* Map Mode View */}
                    <View style={[styles.orbitCanvas, viewMode === 'map' ? { display: 'flex' } : { display: 'none' }]} {...panResponder.panHandlers}>
                        <ReAnimated.View style={[
                            styles.animatedCanvas,
                            canvasAnimatedStyle
                        ]}>
                            {/* Rings and Zones with shading */}
                            {[1, 2, 3, 4, 5].map((level) => (
                                <OrbitRing
                                    key={level}
                                    level={level}
                                    colors={colors}
                                    zoomSharedValue={zoomSharedValue}
                                />
                            ))}

                            {distributedNodes.map(({ node, radius, angle }) => {
                                const isNew = useRelationshipStore.getState().lastAddedId === node.id;
                                return (
                                    <UserNode
                                        key={node.id}
                                        node={node}
                                        orbitRadius={radius}
                                        initialAngle={angle}
                                        zoomLevel={zoomLevel}
                                        zoomSharedValue={zoomSharedValue}
                                        totalNodes={relationships.length}
                                        onSelectNode={onSelectNode}
                                        isNew={isNew}
                                    />
                                );
                            })}

                            {(() => {
                                const centerSize = 60 + zoomLevel * 12;
                                const profileImg = userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                                return (
                                    <TouchableOpacity 
                                        style={{ alignItems: 'center', justifyContent: 'center' }}
                                        activeOpacity={0.8}
                                        onPress={() => useAppStore.getState().setSelfTimeModalOpen(true)}
                                    >
                                        {/* Solar Amber Heartbeat Glow (Soft & Filled) */}
                                        <ReAnimated.View style={[
                                            {
                                                position: 'absolute',
                                                backgroundColor: 'rgba(255, 152, 0, 0.4)', // Soft Amber Glow
                                                shadowColor: '#FF9800',
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: 0.6,
                                                shadowRadius: 20,
                                                elevation: 10,
                                                zIndex: 200 // Higher than dimming layer
                                            },
                                            selfHaloSizeStyle,
                                            selfHaloStyle
                                        ]} />

                                        <ReAnimated.View style={[
                                            styles.centerNode,
                                            {
                                                borderColor: '#FF9800', // Solar Amber (Self)
                                                zIndex: 201 // Higher than dimming layer
                                            },
                                            centerNodeSizeStyle
                                        ]}>
                                            <ReAnimated.Image
                                                source={{ uri: profileImg }}
                                                style={[
                                                    styles.centerAvatar,
                                                    centerAvatarSizeStyle
                                                ]}
                                            />
                                        </ReAnimated.View>
                                    </TouchableOpacity>
                                );
                            })()}

                            {/* [Feedback Layer] Focus Dimming for Meta-Cognitive effect */}
                            <ReAnimated.View 
                                pointerEvents="none"
                                style={[
                                    StyleSheet.absoluteFill,
                                    { backgroundColor: '#000', zIndex: 100 },
                                    dimmingStyle
                                ]} 
                            />

                            {/* [Feedback Layer] Ripple Effect (Wave) */}
                            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
                                {[rippleStyle1, rippleStyle2, rippleStyle3].map((style, idx) => (
                                    <ReAnimated.View 
                                        key={idx}
                                        style={[
                                            {
                                                position: 'absolute',
                                                width: 240,
                                                height: 240,
                                                borderRadius: 120,
                                                borderWidth: 2,
                                                borderColor: cognitiveFeedback.type === 'INTERACTION' ? '#4FC3F7' : '#FF9800',
                                                zIndex: 101 + idx
                                            },
                                            style
                                        ]} 
                                    />
                                ))}
                            </View>

                            {/* [Feedback Layer] Gravity Lines for Interaction */}
                            {interactionFeedback.isActive && interactionFeedback.targetId && (() => {
                                const targetNode = distributedNodes.find(n => n.node.id === interactionFeedback.targetId);
                                if (!targetNode) return null;
                                
                                const rad = (targetNode.angle * Math.PI) / 180;
                                const scaleFactor = 0.55 + (zoomSharedValue.value - 1) * 0.3375;
                                const x2 = Math.cos(rad) * targetNode.radius * scaleFactor;
                                const y2 = Math.sin(rad) * targetNode.radius * scaleFactor;
                                
                                const isNegative = interactionFeedback.closenessDelta < 0;
                                
                                return (
                                    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 150 }]} pointerEvents="none">
                                        <Svg width="100%" height="100%" viewBox={`${-width} ${-width} ${width*2} ${width*2}`}>
                                            <Path
                                                d={`M 0 0 L ${x2} ${y2}`}
                                                stroke={isNegative ? '#D98B73' : '#FF9800'}
                                                strokeWidth={isNegative ? 3 : 2}
                                                strokeDasharray={isNegative ? "4 6" : undefined}
                                                opacity={0.9}
                                            />
                                        </Svg>
                                    </View>
                                );
                            })()}
                        </ReAnimated.View>
                    </View>

                    {/* System Feedback Message Overlay (Used for both SELF_CARE and INTERACTION) */}
                    {(cognitiveFeedback.type === 'SELF_CARE' || cognitiveFeedback.type === 'INTERACTION') ? (
                        <ReAnimated.View 
                            style={[
                                styles.feedbackMessageOverlay,
                                { opacity: feedbackOpacity.value }
                            ]}
                            pointerEvents="none"
                        >
                            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                            <View style={[styles.feedbackMessageContent, { borderColor: cognitiveFeedback.type === 'INTERACTION' ? '#4FC3F780' : '#FF980080' }]}>
                                <Text style={[styles.feedbackMessageText, { color: cognitiveFeedback.type === 'INTERACTION' ? '#0288D1' : '#E65100' }]}>
                                    {cognitiveFeedback.message || (interactionFeedback.isActive ? `관측 데이터 동기화 완료. 에너지 ${interactionFeedback.closenessDelta > 0 ? '+' : ''}${interactionFeedback.closenessDelta || 0}% 변동.` : '')}
                                </Text>
                            </View>
                        </ReAnimated.View>
                    ) : (
                        <SystemStabilizationModal 
                            visible={!!cognitiveFeedback.message}
                            message={cognitiveFeedback.message}
                            onClose={() => {
                                setCognitiveFeedback({ message: null, type: null });
                            }}
                            onComplete={() => {
                                setCognitiveFeedback({ message: null, type: null });
                            }}
                        />
                    )}

                    {/* Floating Map Controls (Only visible in Map Mode) */}
                    <View style={[styles.mapOverlayControls, viewMode === 'map' ? { display: 'flex' } : { display: 'none' }]} pointerEvents="box-none">
                        <View style={styles.statusOverlay} pointerEvents="none">
                            <Text style={[styles.statusInfo, { color: colors.primary, marginBottom: 8, fontSize: 10, opacity: 0.6 }]}>
                                {zoomLevel === 1 ? 'UNIVERSE MODE' :
                                    zoomLevel === 2 ? 'GALAXY MODE' :
                                        zoomLevel === 3 ? 'CONSTELLATION MODE' :
                                            zoomLevel === 4 ? 'STAR CLUSTER MODE' : 'ORBIT FOCUS MODE'}
                                {sortMode !== 'default' && ` • ${sortMode.toUpperCase()} FIRST`}
                            </Text>
                            <Text style={[styles.statusInfo, { color: colors.primary }]}>
                                {selectedFilters.includes('전체')
                                    ? `${relationships.length}명의 모든 관계가 공명 중입니다`
                                    : `${selectedFilters.join(', ')} 그룹 ${filteredRelationships.length}명이 공명 중입니다`}
                            </Text>
                        </View>

                        <View style={styles.rightControls}>
                            <BlurView
                                intensity={40}
                                tint="light"
                                style={[styles.zoomControls, { backgroundColor: 'rgba(255,255,255,0.3)' }]}
                            >
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.zoomBtn,
                                            Math.round(zoomLevel) === level && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setZoomLevel(level)}
                                    >
                                        <Text style={[
                                            styles.zoomBtnText,
                                            { color: Math.round(zoomLevel) === level ? colors.white : colors.primary }
                                        ]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </BlurView>

                            {isMoved && (
                                <TouchableOpacity
                                    style={[styles.recenterBtn, { backgroundColor: colors.white + 'CC' }]}
                                    onPress={handleRecenter}
                                >
                                    <LocateFixed size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.checkInButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                setSearchQuery('');
                                setActiveSearchTag('전체');
                                setSearchMode('action');
                                setSelectedTarget(null);
                                setIsActionVisible(false);
                                setIsSearchModalVisible(true);
                            }}
                            activeOpacity={0.9}
                        >
                            <HeartPulse size={28} color={colors.white} />
                            <Text style={styles.checkInText}>체크인</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </HubLayout>

            {renderSearchModal()}
        </>
    );
};
