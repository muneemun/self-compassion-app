import React, { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react';
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
    Easing as RNEasing,
    Keyboard,
    LayoutAnimation,
    BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { AppHeader } from '../../components/AppHeader';
import {
    Search, Plus, LocateFixed, LayoutGrid, List,
    ChevronDown, ChevronUp, HeartPulse, X, ChevronRight,
    Edit3, RefreshCw, Zap, Users, Target, Briefcase, Heart, ArrowUpDown, Flame, Leaf, CircleDashed, Activity, Snowflake, Sparkles
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
    useSharedValue, 
    useAnimatedStyle, 
    useDerivedValue, 
    withSpring, 
    withTiming, 
    withRepeat, 
    withSequence, 
    withDelay, 
    Easing,
    interpolate,
    interpolateColor,
    Extrapolate,
    cancelAnimation,
    SharedValue,
    useAnimatedProps
} from 'react-native-reanimated';

// 🧩 Modular Optimized Hooks & Constants
import { useOrbitEngine } from './hooks/useOrbitEngine';
import { useOrbitAtmosphere, ATMOSPHERE_THEMES, AtmosphereState } from './hooks/useOrbitAtmosphere';
import { ZONE_FILTERS, getDynamicTabs } from './constants';

const { width, height } = Dimensions.get('window');
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
    selfTimeCardPremium: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.08)',
    },
    selfTimeCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    selfTimeIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#D98B73',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selfTimeCardTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#4A5D4E',
        marginBottom: 2,
    },
    selfTimeCardSub: {
        fontSize: 12,
        color: '#8C968D',
        fontWeight: '600',
    },
    selfTimeBadge: {
        backgroundColor: 'rgba(217, 139, 115, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    selfTimeBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#D98B73',
    },
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
        top: 160,
        left: 20,
        right: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    feedbackPillFrame: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 0.8,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    feedbackPillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    feedbackMessageText: {
        fontSize: 13,
        fontWeight: '800',
        lineHeight: 18,
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
    isFocused?: boolean;
}
const UserNode = memo(({
    node,
    orbitRadius,
    initialAngle,
    zoomLevel,
    zoomSharedValue,
    totalNodes,
    onSelectNode,
    isNew,
    isFocused = true
}: UserNodeProps) => {
    const twinkleAnim = useSharedValue(0);

    useEffect(() => {
        if (!isFocused) {
            twinkleAnim.value = 0;
            return;
        }
        twinkleAnim.value = withRepeat(
            withTiming(1, {
                duration: 1500 + Math.random() * 1000,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        );
    }, [isFocused]);
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

    // 💓 Performance Optimized Pulse Animation (Fully on UI Thread)
    const pulseAnim = useSharedValue(0);

    useEffect(() => {
        if (!isFocused || zoomLevel <= 1.5) {
            pulseAnim.value = 0;
            return;
        }

        const duration = node.temperature > 80 ? 3000 : node.temperature > 50 ? 2000 : 1500;

        pulseAnim.value = withRepeat(
            withSequence(
                withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, [node.temperature, zoomLevel, isFocused]);

    const auraAnimatedStyle = useAnimatedStyle(() => {
        const scale = 1 + pulseAnim.value * 0.2;
        const opacity = 0.3 - pulseAnim.value * 0.25;
        return {
            transform: [{ scale }],
            opacity
        };
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
                    <ReAnimated.View style={[
                        styles.avatarAura,
                        {
                            width: avatarSize + 8,
                            height: avatarSize + 8,
                            borderRadius: (avatarSize + 8) / 2,
                            backgroundColor: accentColor,
                        },
                        auraAnimatedStyle
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

const AnimatedCircle = ReAnimated.createAnimatedComponent(Circle);

const FallingLeaf = ({ idx, healingProgress }: { idx: number, healingProgress: SharedValue<number>, key?: any }) => {
    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 80 + (idx * 20),
        left: 80 + (Math.sin(idx) * 40),
        transform: [
            { translateY: healingProgress.value * 120 },
            { translateX: Math.sin(healingProgress.value * 5 + idx) * 30 },
            { rotate: `${healingProgress.value * 360 + (idx * 45)}deg` }
        ]
    }));

    return (
        <ReAnimated.View style={animatedStyle}>
            <Leaf size={16} color="#A5D6A7" fill="#A5D6A7" />
        </ReAnimated.View>
    );
};

const RotatingMeteorite = ({ idx, drainProgress }: { idx: number, drainProgress: SharedValue<number>, key?: any }) => {
    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: 85,
        left: 85,
        transform: [
            { rotate: `${drainProgress.value * 540 * (idx % 2 === 0 ? 1 : -1) + (idx * 90)}deg` },
            { translateX: interpolate(drainProgress.value, [0, 1], [0, 120 + (idx * 20)]) },
            { scale: interpolate(drainProgress.value, [0, 0.2, 1], [0, 1.2, 0.5]) }
        ],
        opacity: interpolate(drainProgress.value, [0, 0.1, 0.6, 1], [0, 1, 0.8, 0])
    }));

    return (
        <ReAnimated.View style={animatedStyle}>
            <Svg width={18 + idx * 4} height={18 + idx * 4} viewBox="0 0 100 100">
                <Path 
                    d="M 50 15 L 85 30 L 75 80 L 40 85 L 15 50 L 30 20 Z" 
                    fill="#37474F" 
                    stroke="#263238" 
                    strokeWidth="3" 
                />
            </Svg>
        </ReAnimated.View>
    );
};

const GlassShard = ({ idx, crisisProgress }: { idx: number, crisisProgress: SharedValue<number>, key?: any }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const jitterX = (Math.random() * 8 - 4) * crisisProgress.value;
        const jitterY = (Math.random() * 8 - 4) * crisisProgress.value;
        
        return {
            position: 'absolute',
            top: 85,
            left: 85,
            transform: [
                { rotate: `${(idx * 72) + (crisisProgress.value * 360)}deg` },
                { translateX: interpolate(crisisProgress.value, [0, 0.1, 1], [0, 100, 180]) + jitterX },
                { translateY: jitterY },
                { scaleX: interpolate(crisisProgress.value, [0, 0.1, 1], [0, 2, 1.5]) },
                { scaleY: interpolate(crisisProgress.value, [0, 1], [0, 0.8]) }
            ],
            opacity: interpolate(crisisProgress.value, [0, 0.05, 0.6, 1], [0, 1, 1, 0])
        };
    });

    const shardPaths = [
        "M 50 5 L 95 95 L 45 80 Z",
        "M 10 50 L 90 40 L 50 90 Z",
        "M 50 0 L 70 100 L 30 100 Z",
    ];

    return (
        <ReAnimated.View style={animatedStyle}>
            <Svg width={20 + (idx % 2) * 10} height={30 + (idx % 3) * 5} viewBox="0 0 100 100">
                <Path 
                    d={shardPaths[idx % 3]} 
                    fill={idx % 3 === 0 ? "#D32F2F" : (idx % 3 === 1 ? "#212121" : "#F5F5F5")} 
                    stroke="#000" 
                    strokeWidth="3"
                />
            </Svg>
        </ReAnimated.View>
    );
};

interface MainOrbitMapProps {
    isFocused?: boolean;
    onSelectNode: (id: string) => void;
    onPressAdd: () => void;
    onDiagnose: (id: string, mode: 'ZONE' | 'RQS') => void;
    onRecordLog: (id: string) => void;
}

export const MainOrbitMap = ({ isFocused = true, onSelectNode, onPressAdd, onDiagnose, onRecordLog }: MainOrbitMapProps) => {
    const colors = useColors();
    const { relationships, orbitMapViewState, setOrbitMapViewState } = useRelationshipStore();
    const { 
        userProfile, 
        interactionFeedback = { isActive: false, closenessDelta: 0, targetId: null }, 
        setInteractionFeedback = () => {}, 
        cognitiveFeedback = { message: null, type: null }, 
        setCognitiveFeedback = () => {} 
    } = useAppStore();
    const entranceOpacity = useSharedValue(0);

    // ── 🌌 Atmosphere Engine v2 ────────────────────────────────────
    const [atmosphereState, setAtmosphereState] = useState<AtmosphereState>('NORMAL');
    const atmosphereBgProgress = useSharedValue(0);
    const mistProgress = useSharedValue(0);
    const waveProgress = useSharedValue(0);

    // ── Layer A: 즉각 반응 플래시 ────────────────────────────────
    const flashProgress = useSharedValue(0);   // 0→자동 소멸
    const [eventText, setEventText] = useState<string>('');
    const [atmSystemMsg, setAtmSystemMsg] = useState<string | null>(null);

    // ── 📰 News Ticker & Long Press Popup State ──────────────────
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [isStatusPillExpanded, setIsStatusPillExpanded] = useState(true);
    const [overlayBgColor, setOverlayBgColor] = useState('#000000');

    const { ambient: currentTheme, immediate: immediateTheme, immediateChanged } =
        useOrbitAtmosphere(relationships, setAtmSystemMsg);

    const prevAmbientStateRef = useRef(currentTheme?.state || 'NORMAL');
    const searchInputRef = useRef<TextInput>(null);

    // ── Layer B: 누적 상태 변화 → 배경 애니메이션 ────────────────
    useEffect(() => {
        if (!currentTheme) return;
        if (prevAmbientStateRef.current === currentTheme.state) return;
        prevAmbientStateRef.current = currentTheme.state;
        setAtmosphereState(currentTheme.state);

        atmosphereBgProgress.value = 0;
        atmosphereBgProgress.value = withTiming(1, {
            duration: currentTheme.transitionDuration,
            easing: Easing.inOut(Easing.quad)
        });
        mistProgress.value = withTiming(
            currentTheme.mistEnabled ? 1 : 0,
            { duration: currentTheme.transitionDuration * 1.5 }
        );
        if (currentTheme.waveEnabled) {
            waveProgress.value = 0;
            waveProgress.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 600 })
                ), -1, false
            );
        } else {
            waveProgress.value = withTiming(0, { duration: 600 });
        }
    }, [currentTheme?.state]);

    // ── Layer A: 새 체크인 입력시 플래시 + 이벤트 텍스트 표시 ────────
    useEffect(() => {
        if (!immediateChanged || !immediateTheme) return;
        setEventText(immediateTheme.eventText);
        setIsStatusPillExpanded(true); // 새 이벤트 발생 시 상태창 자동으로 열기
        // 플래시: 빠르게 나타났다가 4초 후 자동 소멸
        flashProgress.value = 0.8;
        flashProgress.value = withDelay(600, withTiming(0, { duration: 3500, easing: Easing.out(Easing.quad) }));
    }, [immediateTheme?.state, immediateChanged]);

    // (티커 애니메이션 삭제됨)

    // 환경 Animated Styles
    const atmosphereBackgroundStyle = useAnimatedStyle(() => {
        const bgColor = interpolateColor(
            atmosphereBgProgress.value,
            [0, 1],
            [ATMOSPHERE_THEMES.NORMAL.backgroundColor, currentTheme?.backgroundColor || ATMOSPHERE_THEMES.NORMAL.backgroundColor]
        );
        return { backgroundColor: bgColor };
    });
    const mistStyle = useAnimatedStyle(() => ({ opacity: mistProgress.value }));
    const waveStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + waveProgress.value * 3.5 }],
        opacity: interpolate(waveProgress.value, [0, 0.15, 1], [0, 0.6, 0]),
    }));
    // Layer A 플래시 스타일
    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashProgress.value,
    }));

    // ── 판마스크 ─────────────────────────────────────────────
    const MASK_DEPTH = 56;

    // Feedback animations
    const feedbackOpacity = useSharedValue(0);
    const feedbackTranslateY = useSharedValue(-25);
    const rippleScale1 = useSharedValue(0);
    const rippleScale2 = useSharedValue(0);
    const rippleScale3 = useSharedValue(0);
    const turbulenceValue = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);
    
    const waveWidth = useSharedValue(3);
    const waveColor = useSharedValue('#FF9800');
    const chargeProgress = useSharedValue(0);
    const healingProgress = useSharedValue(0);
    const drainProgress = useSharedValue(0);
    const crisisProgress = useSharedValue(0);
    const universeRotation = useSharedValue(0);

    const bloomStyle = useAnimatedStyle(() => ({
        opacity: interpolate(healingProgress.value, [0, 0.2, 0.8, 1], [0, 0.4, 0.4, 0]) * feedbackOpacity.value,
        backgroundColor: 'rgba(165, 214, 167, 0.3)'
    }));

    const leafOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(healingProgress.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]) * feedbackOpacity.value,
    }));

    const drainOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(drainProgress.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]) * feedbackOpacity.value,
    }));

    const crisisOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(crisisProgress.value, [0, 0.05, 0.8, 1], [0, 1, 1, 0]) * feedbackOpacity.value,
    }));

    const lightningJitter = useSharedValue(0);
    useEffect(() => {
        if (chargeProgress.value > 0) {
            lightningJitter.value = withRepeat(withSequence(withTiming(1.5, { duration: 60 }), withTiming(-1.5, { duration: 60 })), -1, true);
        } else {
            lightningJitter.value = 0;
        }
    }, [chargeProgress.value]);

    const chargeOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(chargeProgress.value, [0, 0.1, 1], [0, 1, 1]) * feedbackOpacity.value,
        transform: [
            { scale: interpolate(chargeProgress.value, [0, 0.2, 1], [0.5, 1.1, 1]) },
            { rotate: `${-universeRotation.value + lightningJitter.value}deg` }
        ]
    }));

    const batteryCircleProps = useAnimatedProps(() => {
        const strokeDashoffset = 251.2 * (1 - chargeProgress.value);
        return {
            strokeDashoffset
        };
    });

    const activeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (activeTimerRef.current) {
                clearTimeout(activeTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const isActive = !!(interactionFeedback.isActive || cognitiveFeedback.message);
 
        if (isActive) {
            // Clear any existing active timer to prevent duplicates and ensure duration resets properly
            if (activeTimerRef.current) {
                clearTimeout(activeTimerRef.current);
            }
 
            // Lock overlay color on initiation to prevent dark flashing during subsequent fade-out
            const isWhiteBg = !!(cognitiveFeedback.type === 'SELF_CARE' || (interactionFeedback.isActive && interactionFeedback.closenessDelta > 0));
            setOverlayBgColor(isWhiteBg ? '#FFFFFF' : '#000000');
 
            feedbackOpacity.value = withTiming(1, { duration: 500 });
            feedbackTranslateY.value = withSpring(0, { damping: 18, stiffness: 70 });
            
            // Map the display type to trigger corresponding ambient effects
            let displayType: 'Charge' | 'Healing' | 'Drain' | 'Stable' | 'Crisis' = 'Stable';
            if (cognitiveFeedback.type === 'SELF_CARE') {
                displayType = 'Healing';
            } else if (cognitiveFeedback.type === 'INTERACTION') {
                const delta = interactionFeedback.closenessDelta || 0;
                if (delta > 0) {
                    displayType = 'Charge';
                } else if (delta < 0) {
                    displayType = 'Drain';
                } else {
                    displayType = 'Stable';
                }
            } else if ((cognitiveFeedback.type as string) === 'CRISIS' || cognitiveFeedback.type === 'Crisis') {
                displayType = 'Crisis';
            } else if (
                cognitiveFeedback.type === 'Charge' || 
                cognitiveFeedback.type === 'Healing' || 
                cognitiveFeedback.type === 'Drain' || 
                cognitiveFeedback.type === 'Stable'
            ) {
                displayType = cognitiveFeedback.type as any;
            }

            // Trigger ripple effect
            rippleScale1.value = 0;
            rippleScale2.value = 0;
            rippleScale3.value = 0;
            rippleOpacity.value = 0.8;
            
            rippleScale1.value = withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) });
            rippleScale2.value = withDelay(400, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
            rippleScale3.value = withDelay(800, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
            rippleOpacity.value = withTiming(0, { duration: 3000 });

            // Trigger specific ambient visual progress values
            if (displayType === 'Charge') {
                chargeProgress.value = 0;
                chargeProgress.value = withTiming(1, { duration: 3200, easing: Easing.out(Easing.quad) });
                waveColor.value = '#FF9800';
                waveWidth.value = 3;
            } else if (displayType === 'Healing') {
                healingProgress.value = 0;
                healingProgress.value = withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) });
                waveColor.value = '#2E7D32';
                waveWidth.value = 4;
            } else if (displayType === 'Drain') {
                drainProgress.value = 0;
                drainProgress.value = withTiming(1, { duration: 3200, easing: Easing.out(Easing.quad) });
                waveColor.value = '#37474F';
                waveWidth.value = 2;
            } else if (displayType === 'Crisis') {
                crisisProgress.value = 0;
                crisisProgress.value = withTiming(1, { duration: 3200, easing: Easing.out(Easing.quad) });
                waveColor.value = '#C62828';
                waveWidth.value = 5;
            }
            
            // Auto-hide after some time (Optimized Golden Window for production)
            activeTimerRef.current = setTimeout(() => {
                feedbackOpacity.value = withTiming(0, { duration: 400 });
                feedbackTranslateY.value = withTiming(-25, { duration: 400 });
                
                cancelAnimation(chargeProgress);
                cancelAnimation(healingProgress);
                cancelAnimation(drainProgress);
                cancelAnimation(crisisProgress);
                chargeProgress.value = 0;
                healingProgress.value = 0;
                drainProgress.value = 0;
                crisisProgress.value = 0;

                activeTimerRef.current = null;
 
                if (interactionFeedback.isActive) {
                    setInteractionFeedback({ ...interactionFeedback, isActive: false });
                }
                if (cognitiveFeedback.message) {
                    setCognitiveFeedback({ message: null, type: null });
                }
            }, 3200);
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

    const dimmingStyle = useAnimatedStyle(() => {
        const baseOpacity = interpolate(drainProgress.value, [0, 0.5, 1], [0.6, 0.8, 0.6]);
        return {
            opacity: baseOpacity * feedbackOpacity.value
        };
    });
 
    const feedbackOverlayStyle = useAnimatedStyle(() => ({
        opacity: feedbackOpacity.value,
        transform: [{ translateY: feedbackTranslateY.value }]
    }));

    const rippleStyle1 = useAnimatedStyle(() => ({ 
        transform: [{ scale: rippleScale1.value }], 
        opacity: rippleOpacity.value, 
        borderWidth: waveWidth.value, 
        borderColor: waveColor.value 
    }));
    const rippleStyle2 = useAnimatedStyle(() => ({ 
        transform: [{ scale: rippleScale2.value }], 
        opacity: rippleOpacity.value * 0.7, 
        borderWidth: waveWidth.value, 
        borderColor: waveColor.value 
    }));
    const rippleStyle3 = useAnimatedStyle(() => ({ 
        transform: [{ scale: rippleScale3.value }], 
        opacity: rippleOpacity.value * 0.4, 
        borderWidth: waveWidth.value, 
        borderColor: waveColor.value 
    }));
    // Tracking new nodes for entry animation
    const prevNodeIds = useRef(new Set((relationships || []).map(r => r.id)));
    useEffect(() => {
        prevNodeIds.current = new Set((relationships || []).map(r => r.id));
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

    // 🌟 Tab Focus Entrance Animation
    useEffect(() => {
        if (isFocused) {
            // Reset state for entrance effect
            entranceOpacity.value = 0;
            zoomSharedValue.value = zoomLevel * 0.8;
            
            // Animate in
            entranceOpacity.value = withTiming(1, { duration: 600 });
            zoomSharedValue.value = withSpring(zoomLevel, { damping: 15, stiffness: 90 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused]);

    const currentOrbitSize = BASE_ORBIT_SIZE; // Use fixed base size for layout calculations

    // Actions Wrapper
    const setZoomLevel = (level: number) => setOrbitMapViewState({ zoomLevel: level });
    const setSelectedFilters = (filters: string[]) => setOrbitMapViewState({ selectedFilters: filters });
    const setSortMode = (mode: 'default' | 'hot' | 'cold') => setOrbitMapViewState({ sortMode: mode as any });
    const setIsFilterExpanded = (expanded: boolean) => setOrbitMapViewState({ isFilterExpanded: expanded });
    const setViewMode = (mode: 'map' | 'list') => setOrbitMapViewState({ viewMode: mode });
    const setActiveSearchTag = (tag: string) => setOrbitMapViewState({ activeSearchTag: tag });


    // 🌀 Universe Spin State

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

    useEffect(() => {
        if (!isSearchModalVisible) return;
        
        const handleBackPress = () => {
            if (isActionVisible) {
                setIsActionVisible(false);
                setSelectedTarget(null);
                return true;
            }
            setIsSearchModalVisible(false);
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => backHandler.remove();
    }, [isSearchModalVisible, isActionVisible]);

    // ✨ Sparkle Effect Values (Removed fake sparkles)
    const sparkleAnim = useSharedValue(0);
    const zoomAnim = useSharedValue(zoomLevel);

    useEffect(() => {
        zoomAnim.value = withTiming(zoomLevel, { duration: 300 });
    }, [zoomLevel]);

    const zoneFilters = ZONE_FILTERS;
    const dynamicTabs = useMemo(() => getDynamicTabs(relationships), [relationships]);

    const zoomLevelRef = useRef(zoomLevel);
    useEffect(() => {
        zoomLevelRef.current = zoomLevel;
    }, [zoomLevel]);

    const handleToggleFilter = useCallback((tab: string) => {
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
    }, [selectedFilters]);

    // ⚡ Optimized Core Engine Integration
    const [systemMessage, setSystemMessage] = useState<string | null>(null);
    const atmosphere = useOrbitAtmosphere(relationships, setSystemMessage);
    const { distributedNodes, filteredCount } = useOrbitEngine({
        relationships,
        viewState: orbitMapViewState,
        currentOrbitSize: BASE_ORBIT_SIZE
    });

    const filteredRelationships = distributedNodes.map(pn => pn.node);

    const handleSelectPerson = useCallback((person: RelationshipNode | 'self') => {
        searchInputRef.current?.blur();
        Keyboard.dismiss();
        
        if (person === 'self') {
            setIsSearchModalVisible(false);
            useAppStore.getState().setSelfTimeModalOpen(true);
            return;
        }

        if (searchMode === 'navigation') {
            setIsSearchModalVisible(false);
            onSelectNode(person.id);
        } else if (searchMode === 'action') {
            setIsSearchModalVisible(false);
            useAppStore.getState().setRelationshipLogModalOpen(true, person.id);
        } else {
            setSelectedTarget(person);
            setIsActionVisible(true);
        }
    }, [searchMode, onSelectNode]);

    const handleAction = useCallback((type: 'LOG' | 'ZONE' | 'RQS') => {
        if (!selectedTarget) return;
        setIsSearchModalVisible(false);
        if (type === 'LOG') {
            onRecordLog(selectedTarget.id);
        } else {
            onDiagnose(selectedTarget.id, type);
        }
    }, [selectedTarget, onRecordLog, onDiagnose]);

    const cycleSortMode = useCallback(() => {
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
    }, [sortMode, universeRotation]);

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
        ],
        opacity: entranceOpacity.value
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

    const handleRecenter = useCallback(() => {
        panX.value = withSpring(0, { damping: 20, stiffness: 80 });
        panY.value = withSpring(-120, { damping: 20, stiffness: 80 });
        universeRotation.value = withSpring(0, { damping: 20, stiffness: 80 });
        setIsMoved(false);
    }, [panX, panY, universeRotation]);

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
        if (!isSearchModalVisible) {
            return <View style={{ display: 'none' }} />;
        }

        const searchTags = dynamicTabs;

        const filteredPeople = relationships.filter(r => {
            const rTypeLabel = RELATIONSHIP_TYPE_LABELS[r.type] || r.type;
            const rZoneLabel = zoneFilters.find(zf => zf.zone === r.zone)?.label;
            const matchesQuery = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rTypeLabel.toLowerCase().includes(searchQuery.toLowerCase());

            if (activeSearchTag === '전체') return matchesQuery;
            return matchesQuery && (rTypeLabel === activeSearchTag || rZoneLabel === activeSearchTag);
        });

        // handleSelectPerson and handleAction are now hoisted to main component

        return (
            <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: colors.background, display: isSearchModalVisible ? 'flex' : 'none' }]}>
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
                                    onPress={() => {
                                        searchInputRef.current?.blur();
                                        setIsSearchModalVisible(false);
                                    }}
                                >
                                    <X size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ paddingHorizontal: 20 }}>
                                <View style={styles.searchContainer}>
                                    <Search size={18} color={colors.primary} opacity={0.4} />
                                    <TextInput
                                        ref={searchInputRef}
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
                                        style={styles.selfTimeCardPremium}
                                        onPress={() => handleSelectPerson('self')}
                                    >
                                        <View style={styles.selfTimeCardLeft}>
                                            <View style={styles.selfTimeIconWrapper}>
                                                <Sparkles size={24} color="white" />
                                            </View>
                                            <View>
                                                <Text style={styles.selfTimeCardTitle}>나와의 시간 (Self-Time)</Text>
                                                <Text style={styles.selfTimeCardSub}>지친 나를 위해 정서 에너지를 충전하세요</Text>
                                            </View>
                                        </View>
                                        <View style={styles.selfTimeBadge}>
                                            <Text style={styles.selfTimeBadgeText}>치유</Text>
                                        </View>
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
                                                {(() => {
                                                    const validHistory = (person.history || []).filter(h => h && h.date);
                                                    const validInteractions = (person.interactions || []).filter(i => i && i.date);
                                                    
                                                    // '진단', '등록', '재설정' 등 시스템 로그 제외하고 실제 교류가 있는지 확인
                                                    const hasRealData = validInteractions.length > 0 || 
                                                                       validHistory.some(h => {
                                                                           const title = h.title || h.event || '';
                                                                           return !title.includes('등록') && 
                                                                                  !title.includes('진단') && 
                                                                                  !title.includes('재설정') &&
                                                                                  !title.includes('추가') &&
                                                                                  !title.includes('업데이트');
                                                                       });

                                                    return (
                                                        <Text style={[styles.tempText, { color: (person.temperature || 0) > 70 ? colors.accent : colors.primary }]}>
                                                            {hasRealData ? `${Math.round(person.temperature || 0)}%` : '---'}
                                                        </Text>
                                                    );
                                                })()}
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

                    {/* 🌌 Map Mode View — Atmosphere-Aware Canvas */}
                    <View
                        style={[styles.orbitCanvas, viewMode === 'map' ? { display: 'flex' } : { display: 'none' }]}
                        {...panResponder.panHandlers}
                    >
                        {/* ━━ [Atmosphere Layer 1] 동적 배경색 (그라데이션) ━━━━━━━━━━━━━━━ */}
                        <ReAnimated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
                            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                                <Defs>
                                    <LinearGradient id="orbitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <Stop offset="0%" stopColor={currentTheme.gradientColors[0]} />
                                        <Stop offset="50%" stopColor={currentTheme.gradientColors[1]} />
                                        <Stop offset="100%" stopColor={currentTheme.gradientColors[2]} />
                                    </LinearGradient>
                                </Defs>
                                <Rect width="100%" height="100%" fill="url(#orbitGradient)" />
                            </Svg>
                        </ReAnimated.View>

                        {/* ━━ [Atmosphere Layer 2] 연무(Mist) 레이어 — pointerEvents=none 으로 터치 무간섭 ━ */}
                        {currentTheme.mistEnabled && (
                            <ReAnimated.View
                                pointerEvents="none"
                                style={[
                                    StyleSheet.absoluteFill,
                                    { zIndex: 2 },
                                    mistStyle
                                ]}
                            >
                                {/* 움직이는 연무 구름 레이어 (3개 중첩으로 웨이브 효과) */}
                                {[0, 1, 2].map(idx => (
                                    <ReAnimated.View
                                        key={idx}
                                        style={[
                                            StyleSheet.absoluteFill,
                                            {
                                                backgroundColor: currentTheme.mistColor,
                                                opacity: 0.6 - idx * 0.15,
                                            }
                                        ]}
                                    />
                                ))}
                            </ReAnimated.View>
                        )}

                        {/* ━━ [Atmosphere Layer 3] 에너지 파동(Wave) ━━━━━━━━━━━━━━━━━━━━━ */}


                        {/* ━━ [Orbit Canvas] 기존 캐리어 그대로 유지 ━━━━━━━━━━━━━━━━━━━━ */}
                        <ReAnimated.View style={[
                            styles.animatedCanvas,
                            canvasAnimatedStyle
                        ]}>
                            {/* Ambient Weather Wave (Synced with Center Node) */}
                            {currentTheme.waveEnabled && (
                                <View pointerEvents="none" style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 1 }]}>
                                    <ReAnimated.View style={[{ width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: currentTheme.waveColor }, waveStyle]} />
                                </View>
                            )}
                            {/* Rings and Zones with shading */}
                                {useMemo(() => [1, 2, 3, 4, 5].map((level) => (
                                <OrbitRing
                                    key={level}
                                    level={level}
                                    colors={colors}
                                    zoomSharedValue={zoomSharedValue}
                                />
                            )), [colors, zoomSharedValue])}

                            {useMemo(() => distributedNodes.map(({ node, radius, angle }) => {
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
                                        isFocused={isFocused}
                                    />
                                );
                            }), [distributedNodes, zoomLevel, zoomSharedValue, relationships.length, onSelectNode, isFocused])}

                            {(() => {
                                const centerSize = 60 + zoomLevel * 12;
                                const profileImg = userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                                return (
                                    <TouchableOpacity 
                                        style={{ alignItems: 'center', justifyContent: 'center' }}
                                        activeOpacity={0.8}
                                        onPress={() => useAppStore.getState().setSelfTimeModalOpen(true)}
                                        onLongPress={() => setShowStatusPopup(true)}
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
                                    { 
                                        position: 'absolute',
                                        width: width * 5,
                                        height: height * 5,
                                        backgroundColor: overlayBgColor, 
                                        zIndex: 100 
                                    },
                                    dimmingStyle
                                ]} 
                            />

                            <ReAnimated.View pointerEvents="none" style={[{ position: 'absolute', width: width * 5, height: height * 5, zIndex: 101 }, bloomStyle]} />

                            {/* [Feedback Layer] Ripple Effect (Wave) */}
                            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 1000 }]} pointerEvents="none">
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

                                {/* Charge Overlay */}
                                <ReAnimated.View style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 900 }, chargeOverlayStyle]}>
                                    <Svg width="100" height="100" viewBox="0 0 100 100">
                                        <Circle cx="50" cy="50" r="40" stroke="rgba(255, 215, 0, 0.2)" strokeWidth="6" fill="none" />
                                        <AnimatedCircle 
                                            cx="50" cy="50" r="40" 
                                            stroke="#FFD700" strokeWidth="6" fill="none" 
                                            strokeDasharray="251.2"
                                            animatedProps={batteryCircleProps as any}
                                            strokeLinecap="round"
                                            transform="rotate(-90 50 50)"
                                        />
                                    </Svg>
                                    <View style={{ position: 'absolute' }}>
                                        <Svg width="40" height="40" viewBox="0 0 100 100">
                                            <Path 
                                                d="M 55 5 L 25 55 L 50 55 L 40 95 L 75 40 L 50 40 L 65 5 Z" 
                                                fill="#FFD700" 
                                                stroke="#FFF" 
                                                strokeWidth="2" 
                                                strokeLinejoin="round" 
                                            />
                                        </Svg>
                                    </View>
                                </ReAnimated.View>

                                {/* Healing Leaf Overlay */}
                                <ReAnimated.View pointerEvents="none" style={[{ position: 'absolute', width: 200, height: 200, zIndex: 910 }, leafOverlayStyle]}>
                                    {[0, 1, 2, 3, 4].map(idx => (
                                        <FallingLeaf key={idx} idx={idx} healingProgress={healingProgress} />
                                    ))}
                                </ReAnimated.View>

                                {/* Drain Meteorite Overlay */}
                                <ReAnimated.View pointerEvents="none" style={[{ position: 'absolute', width: 200, height: 200, zIndex: 920 }, drainOverlayStyle]}>
                                    {[0, 1, 2, 3].map(idx => (
                                        <RotatingMeteorite key={idx} idx={idx} drainProgress={drainProgress} />
                                    ))}
                                </ReAnimated.View>

                                {/* Crisis Shard Overlay */}
                                <ReAnimated.View pointerEvents="none" style={[{ position: 'absolute', width: 200, height: 200, zIndex: 930 }, crisisOverlayStyle]}>
                                    {[0, 1, 2, 3, 4, 5].map(idx => (
                                        <GlassShard key={idx} idx={idx} crisisProgress={crisisProgress} />
                                    ))}
                                </ReAnimated.View>
                            </View>
                        </ReAnimated.View>
                    </View>

                    {/* ━━ 🎭 Universal Gradient Mask System ━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         모든 대기 상태에서 상/하단 경계를 앱 기본 컬러로 부드럽게 연결.
                         pointerEvents=none 으로 터치 완전 무간섭.
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {viewMode === 'map' && (
                        <>
                            {/* 상단 마스크: 헤더 아래 → 지도 시작점 */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: MASK_DEPTH,
                                    zIndex: 5,
                                    // React Native LinearGradient 없이 Svg로 구현
                                }}
                            >
                                <Svg width="100%" height={MASK_DEPTH} preserveAspectRatio="none">
                                    <Defs>
                                        <LinearGradient id="topMask" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0" stopColor={currentTheme.gradientColors[0]} stopOpacity="1" />
                                            <Stop offset="1" stopColor={currentTheme.gradientColors[0]} stopOpacity="0" />
                                        </LinearGradient>
                                    </Defs>
                                    <Rect width="100%" height={MASK_DEPTH} fill="url(#topMask)" />
                                </Svg>
                            </View>

                            {/* 하단 마스크: 지도 끝점 → 탭바 위 */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: MASK_DEPTH,
                                    zIndex: 5,
                                }}
                            >
                                <Svg width="100%" height={MASK_DEPTH} preserveAspectRatio="none">
                                    <Defs>
                                        <LinearGradient id="bottomMask" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0" stopColor={currentTheme.gradientColors[2]} stopOpacity="0" />
                                            <Stop offset="1" stopColor={currentTheme.gradientColors[2]} stopOpacity="1" />
                                        </LinearGradient>
                                    </Defs>
                                    <Rect width="100%" height={MASK_DEPTH} fill="url(#bottomMask)" />
                                </Svg>
                            </View>
                        </>
                    )}

                    {/* System Feedback Message Overlay (Frosted Linen-Sand Pill) */}
                    {(cognitiveFeedback.message && (
                        cognitiveFeedback.type === 'SELF_CARE' || 
                        cognitiveFeedback.type === 'INTERACTION' ||
                        cognitiveFeedback.type === 'Charge' || 
                        cognitiveFeedback.type === 'Healing' || 
                        cognitiveFeedback.type === 'Drain' || 
                        cognitiveFeedback.type === 'Stable' ||
                        cognitiveFeedback.type === 'Crisis'
                    )) ? (() => {
                        let displayType: 'Charge' | 'Healing' | 'Drain' | 'Stable' | 'Crisis' = 'Stable';
                        if (cognitiveFeedback.type === 'SELF_CARE') {
                            displayType = 'Healing';
                        } else if (cognitiveFeedback.type === 'INTERACTION') {
                            const delta = interactionFeedback.closenessDelta || 0;
                            if (delta > 0) {
                                displayType = 'Charge';
                            } else if (delta < 0) {
                                displayType = 'Drain';
                            } else {
                                displayType = 'Stable';
                            }
                        } else if ((cognitiveFeedback.type as string) === 'CRISIS' || cognitiveFeedback.type === 'Crisis') {
                            displayType = 'Crisis';
                        } else if (
                            cognitiveFeedback.type === 'Charge' || 
                            cognitiveFeedback.type === 'Healing' || 
                            cognitiveFeedback.type === 'Drain' || 
                            cognitiveFeedback.type === 'Stable'
                        ) {
                            displayType = cognitiveFeedback.type as any;
                        }

                        const bgColor = 
                            (displayType === 'Charge' || displayType === 'Healing') 
                            ? 'rgba(255, 255, 255, 0.92)' 
                            : 'rgba(232, 226, 213, 0.90)';
                            
                        const borderColor = 
                            displayType === 'Charge' ? 'rgba(255, 143, 0, 0.12)' :
                            displayType === 'Healing' ? 'rgba(46, 125, 50, 0.12)' :
                            displayType === 'Drain' ? 'rgba(84, 110, 122, 0.12)' :
                            displayType === 'Stable' ? 'rgba(74, 93, 78, 0.12)' :
                            'rgba(198, 40, 40, 0.12)';

                        const textColor = 
                            displayType === 'Charge' ? '#FF8F00' :
                            displayType === 'Healing' ? '#2E7D32' :
                            displayType === 'Drain' ? '#37474F' :
                            displayType === 'Stable' ? '#4A5D4E' :
                            '#C62828';

                        return (
                            <ReAnimated.View 
                                style={[
                                    styles.feedbackMessageOverlay,
                                    feedbackOverlayStyle
                                ]}
                                pointerEvents="none"
                            >
                                <View style={[styles.feedbackPillFrame, { backgroundColor: bgColor, borderColor: borderColor }]}>
                                    <BlurView intensity={12} tint="light" style={StyleSheet.absoluteFill} />
                                    <View style={styles.feedbackPillContent}>
                                        {displayType === 'Charge' && <Zap size={14} color={textColor} />}
                                        {displayType === 'Healing' && <Leaf size={14} color={textColor} />}
                                        {displayType === 'Drain' && <CircleDashed size={14} color={textColor} />}
                                        {displayType === 'Stable' && <Activity size={14} color={textColor} />}
                                        {displayType === 'Crisis' && <Flame size={14} color={textColor} />}
                                        
                                        <Text style={[styles.feedbackMessageText, { color: textColor }]}>
                                            {cognitiveFeedback.message}
                                        </Text>
                                    </View>
                                </View>
                            </ReAnimated.View>
                        );
                    })() : (
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
                        {/* ━━ [Atmosphere Layer A] 즉각 반응 플래시 ━━━━━━━━━━━━━━━━━━━━━━ */}
                        <ReAnimated.View
                            pointerEvents="none"
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: immediateTheme.flashColor, zIndex: 10 },
                                flashStyle
                            ]}
                        />

                        {/* ━━ [Unified Status Pill] 통합 상태창 ━━━━━━━━━━━━━━━━━━━━ */}
                        <View style={{ position: 'absolute', bottom: 240, alignSelf: 'center', zIndex: 700 }} pointerEvents="box-none">
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setIsStatusPillExpanded(!isStatusPillExpanded);
                                }}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    paddingHorizontal: 20,
                                    paddingVertical: isStatusPillExpanded ? 16 : 10,
                                    borderRadius: 30,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 12,
                                    elevation: 5,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,1)',
                                    maxWidth: width * 0.85
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                                        {selectedFilters.includes('전체')
                                            ? `${relationships.length}명의 관계가 함께하고 있어요`
                                            : `${selectedFilters.join(', ')} 그룹 ${filteredRelationships.length}명과 연결 중`}
                                    </Text>
                                    <ChevronUp size={16} color={colors.gray[400]} style={{ transform: [{ rotate: isStatusPillExpanded ? '180deg' : '0deg' }] }} />
                                </View>
                                
                                {isStatusPillExpanded && (
                                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                                        {eventText ? <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 4, textAlign: 'center' }}>💭 {eventText}</Text> : null}
                                        <Text style={{ color: colors.primary, opacity: 0.8, fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 18 }}>
                                            {currentTheme.ambientText}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* ━━ [Long Press Popup] 롱프레스 상태 팝업 ━━━━━━━━━━━━━━━━━━━━ */}
                        {showStatusPopup && (
                            <TouchableOpacity 
                                style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.3)' }]} 
                                activeOpacity={1} 
                                onPress={() => setShowStatusPopup(false)}
                            >
                                <View style={{ backgroundColor: colors.white, padding: 24, borderRadius: 16, maxWidth: '80%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 12 }}>현재 관계 대기 상태</Text>
                                    {eventText ? (
                                        <Text style={{ fontSize: 14, color: '#FF9800', marginBottom: 8, textAlign: 'center', fontWeight: '600' }}>💭 {eventText}</Text>
                                    ) : null}
                                    <Text style={{ fontSize: 14, color: colors.gray[500], textAlign: 'center', lineHeight: 20 }}>🌌 {currentTheme.ambientText}</Text>
                                    <Text style={{ fontSize: 11, color: colors.gray[300], marginTop: 16 }}>화면을 터치하여 닫기</Text>
                                </View>
                            </TouchableOpacity>
                        )}

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
