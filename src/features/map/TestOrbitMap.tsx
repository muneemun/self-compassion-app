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
    Edit3, RefreshCw, Zap, ZapOff, Users, Target, Briefcase, Heart, ArrowUpDown, Flame, Leaf, CircleDashed, Activity, Snowflake, Sparkles
} from 'lucide-react-native';
import { RelationshipList } from '../relationships/RelationshipList';
import { RELATIONSHIP_TYPE_LABELS, RelationshipNode, getDynamicCharacter, RQS_GRADE_BADGES, DYNAMIC_CHARACTERS } from '../../types/relationship';
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
    SharedValue
} from 'react-native-reanimated';

// 🧩 Modular Optimized Hooks & Constants
import { useOrbitEngine } from './hooks/useOrbitEngine';
import { useOrbitAtmosphere, ATMOSPHERE_THEMES, AtmosphereState } from './hooks/useOrbitAtmosphere';
import { ZONE_FILTERS, getDynamicTabs } from './constants';

const { width, height } = Dimensions.get('window');
const BASE_ORBIT_SIZE = width * 1.1;

// ─── 🔮 Sub-Components (100% Mirror) ────────────────────────────────

const BadgeIcon = ({ node }: { node: RelationshipNode }) => {
    // Force a character for test visibility if none exists
    const character = getDynamicCharacter(node.interactions || []) || DYNAMIC_CHARACTERS.Healing;
    const iconSize = 13;
    
    // v5 Particle Metaphor Icons (Enhanced rendering)
    if (character.icon === 'Zap')      return <Zap color={character.color} size={iconSize} fill={character.color} />;
    if (character.icon === 'Leaf')     return <Leaf color={character.color} size={iconSize} fill={character.color} />;
    if (character.icon === 'Orbit')    return <Activity color={character.color} size={iconSize} strokeWidth={3} />;
    if (character.icon === 'Activity') return <ZapOff color={character.color} size={iconSize} strokeWidth={3} />;
    return <CircleDashed color={character.color} size={iconSize} />;
};

const OrbitRing = React.memo(({ level, colors, zoomSharedValue }: { level: number, colors: any, zoomSharedValue: SharedValue<number> }) => {
    const zoneColors: Record<number, string> = { 1: '#FFB74D', 2: '#D98B73', 3: '#4A5D4E', 4: '#90A4AE', 5: '#D1D5DB' };
    const orbitColor = zoneColors[level] || colors.primary;
    const animatedStyle = useAnimatedStyle(() => {
        const scaleFactor = 0.55 + (zoomSharedValue.value - 1) * 0.3375;
        const baseSize = (BASE_ORBIT_SIZE * (level + 0.5)) / 3.5;
        const size = baseSize * scaleFactor;
        return { width: size, height: size, borderRadius: size / 2 };
    });
    return (
        <ReAnimated.View
            style={[styles.orbitRing, animatedStyle, {
                borderColor: orbitColor, borderWidth: 2.5, opacity: 0.25 - (level * 0.03),
                backgroundColor: level === 1 ? 'rgba(255,183,77,0.03)' : (level % 2 === 0 ? 'rgba(74,93,78,0.03)' : 'transparent')
            }]}
        />
    );
});

const UserNode = memo(({ node, orbitRadius, initialAngle, zoomLevel, zoomSharedValue, totalNodes, onSelectNode, isNew, isFocused = true }: any) => {
    const twinkleAnim = useSharedValue(0);
    useEffect(() => {
        if (!isFocused) { twinkleAnim.value = 0; return; }
        twinkleAnim.value = withRepeat(withTiming(1, { duration: 1500 + Math.random() * 1000, easing: Easing.inOut(Easing.sin) }), -1, true);
    }, [isFocused]);
    const radius = useSharedValue(isNew ? BASE_ORBIT_SIZE * 2 : orbitRadius);
    const angle = useSharedValue(initialAngle);
    useEffect(() => {
        radius.value = withSpring(orbitRadius, { damping: 20, stiffness: 90 });
        angle.value = withSpring(initialAngle, { damping: 20, stiffness: 60 });
    }, [orbitRadius, initialAngle]);
    const animatedStyle = useAnimatedStyle(() => {
        const rad = (angle.value * Math.PI) / 180;
        const scaleFactor = 0.55 + (zoomSharedValue.value - 1) * 0.3375;
        const currentRadius = radius.value * scaleFactor;
        return { transform: [{ translateX: Math.cos(rad) * currentRadius }, { translateY: Math.sin(rad) * currentRadius }, { scale: Math.min(1.3, scaleFactor) }] };
    });
    const twinkleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.8 + twinkleAnim.value * 0.4 }], opacity: 0.7 + twinkleAnim.value * 0.3 }));
    const pulseAnim = useSharedValue(0);
    useEffect(() => {
        if (!isFocused || zoomLevel <= 1.5) { pulseAnim.value = 0; return; }
        const duration = node.temperature > 80 ? 3000 : node.temperature > 50 ? 2000 : 1500;
        pulseAnim.value = withRepeat(withSequence(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })), -1, true);
    }, [node.temperature, zoomLevel, isFocused]);
    const auraAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulseAnim.value * 0.2 }], opacity: 0.3 - pulseAnim.value * 0.25 }));
    const renderContent = () => {
        const densityFactor = totalNodes > 100 ? 0.65 : totalNodes > 50 ? 0.8 : 1.0;
        if (zoomLevel < 1.5) {
            const dotSize = 12 * (0.8 + densityFactor * 0.2);
            const dotColor = { 1: '#FFB74D', 2: '#D98B73', 3: '#4A5D4E', 4: '#90A4AE', 5: '#D1D5DB' }[node.zone] || '#4A5D4E';
            return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <ReAnimated.View style={[styles.dotNode, twinkleStyle, { backgroundColor: dotColor, width: dotSize, height: dotSize, borderRadius: dotSize / 2, borderWidth: 2, borderColor: '#fff' }]} />
                </View>
            );
        }
        const avatarSize = (zoomLevel < 2.5 ? 28 : zoomLevel < 3.5 ? 36 : zoomLevel < 4.5 ? 42 : 48) * (0.7 + densityFactor * 0.3);
        const character = getDynamicCharacter(node.interactions || []);
        
        // Defensive color mapping
        const zoneColors: Record<number, string> = { 1: '#FFB74D', 2: '#D98B73', 3: '#4A5D4E', 4: '#90A4AE', 5: '#D1D5DB' };
        const accentColor = character?.color || zoneColors[node.zone] || '#4A5D4E';
        
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', justifyContent: 'center', width: avatarSize + 8, height: avatarSize + 8 }}>
                    <ReAnimated.View style={[styles.avatarAura, { width: avatarSize + 8, height: avatarSize + 8, borderRadius: (avatarSize + 8) / 2, backgroundColor: accentColor }, auraAnimatedStyle]} />
                    <View style={[styles.avatarWrapper, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderColor: accentColor, padding: 1.5 }]}>
                        <Image source={{ uri: node.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }} style={[styles.avatar, { borderRadius: (avatarSize - 3) / 2 }]} />
                    </View>
                    {/* v5 Persona Badge */}
                    <View style={{ 
                        position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, 
                        backgroundColor: (character || DYNAMIC_CHARACTERS.Healing).bgColor, 
                        borderWidth: 1.5, 
                        borderColor: (character || DYNAMIC_CHARACTERS.Healing).color, 
                        alignItems: 'center', justifyContent: 'center', zIndex: 10 
                    }}>
                        <BadgeIcon node={node} />
                    </View>
                </View>
                {zoomLevel > 2.5 && (
                    <View style={styles.nodeLabelContainer}>
                        <Text style={styles.nodeNameText} numberOfLines={1}>{node.name}</Text>
                    </View>
                )}
            </View>
        );
    };
    return (
        <ReAnimated.View style={[styles.userNodeContainer, animatedStyle]}>
            <TouchableOpacity onPress={() => onSelectNode?.(node.id)} activeOpacity={0.8} style={{ alignItems: 'center', justifyContent: 'center' }}>
                {renderContent()}
            </TouchableOpacity>
        </ReAnimated.View>
    );
});

// ─── 🪐 Main Test Component (ENVIRONMENT MIRROR) ───────────────────────

export const TestOrbitMap = () => {
    const colors = useColors();
    const { relationships, orbitMapViewState, setOrbitMapViewState } = useRelationshipStore();
    const { userProfile, interactionFeedback, setInteractionFeedback, cognitiveFeedback, setCognitiveFeedback } = useAppStore();
    const entranceOpacity = useSharedValue(1);

    // 🧪 Lab State (Added Only This)
    const [manualAtmosphereState, setManualAtmosphereState] = useState<AtmosphereState | null>(null);

    // ── 🌌 Atmosphere Engine (100% Clone) ──────────────────────────────────
    const [atmosphereState, setAtmosphereState] = useState<AtmosphereState>('NORMAL');
    const atmosphereBgProgress = useSharedValue(1);
    const mistProgress = useSharedValue(0);
    const waveProgress = useSharedValue(0);
    const flashProgress = useSharedValue(0);
    const [eventText, setEventText] = useState<string>('');
    const [atmSystemMsg, setAtmSystemMsg] = useState<string | null>(null);
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [isStatusPillExpanded, setIsStatusPillExpanded] = useState(true);

    const { ambient: autoTheme, immediate: immediateTheme, immediateChanged } = useOrbitAtmosphere(relationships, setAtmSystemMsg);
    const currentTheme = manualAtmosphereState ? ATMOSPHERE_THEMES[manualAtmosphereState] : autoTheme;

    const prevAmbientStateRef = useRef(currentTheme.state);
    useEffect(() => {
        if (prevAmbientStateRef.current === currentTheme.state) return;
        prevAmbientStateRef.current = currentTheme.state;
        setAtmosphereState(currentTheme.state);
        atmosphereBgProgress.value = 0;
        atmosphereBgProgress.value = withTiming(1, { duration: currentTheme.transitionDuration, easing: Easing.inOut(Easing.quad) });
        mistProgress.value = withTiming(currentTheme.mistEnabled ? 1 : 0, { duration: currentTheme.transitionDuration * 1.5 });
        if (currentTheme.waveEnabled) {
            waveProgress.value = withRepeat(withSequence(withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 600 })), -1, false);
        } else {
            waveProgress.value = withTiming(0, { duration: 600 });
        }
    }, [currentTheme.state]);

    useEffect(() => {
        if (!immediateChanged || manualAtmosphereState) return;
        setEventText(immediateTheme.eventText);
        setIsStatusPillExpanded(true);
        flashProgress.value = 0.8;
        flashProgress.value = withDelay(600, withTiming(0, { duration: 3500, easing: Easing.out(Easing.quad) }));
    }, [immediateTheme.state, immediateChanged, manualAtmosphereState]);

    const atmosphereBackgroundStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(atmosphereBgProgress.value, [0, 1], [ATMOSPHERE_THEMES.CALM.backgroundColor, currentTheme.backgroundColor])
    }));
    const mistStyle = useAnimatedStyle(() => ({ opacity: mistProgress.value }));
    const waveStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + waveProgress.value * 3.5 }], opacity: interpolate(waveProgress.value, [0, 0.15, 1], [0, 0.6, 0]) }));
    const flashStyle = useAnimatedStyle(() => ({ opacity: flashProgress.value }));

    // ── v5 Swirl Engine (Rotation Logic)
    const universeRotation = useSharedValue(0);
    useEffect(() => {
        // Continuous rotation driven by swirlSpeed
        const duration = 60000 / (currentTheme.swirlSpeed || 0.5);
        universeRotation.value = withRepeat(
            withTiming(universeRotation.value + 360, { duration, easing: Easing.linear }),
            -1,
            false
        );
    }, [currentTheme.state, currentTheme.swirlSpeed]);

    // ── Feedback Animations (Mirror)
    const feedbackOpacity = useSharedValue(0);
    const rippleScale1 = useSharedValue(0), rippleScale2 = useSharedValue(0), rippleScale3 = useSharedValue(0);
    const turbulenceValue = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);
    
    // v5 Specific Wave Properties
    const waveWidth = useSharedValue(3);
    const waveColor = useSharedValue('#FF9800');
    
    useEffect(() => {
        if (interactionFeedback.isActive || cognitiveFeedback.message) {
            feedbackOpacity.value = withTiming(1, { duration: 500 });

            // Apply v5 Particle Specs
            if (interactionFeedback.isActive && interactionFeedback.targetId) {
                const targetNode = relationships.find(r => r.id === interactionFeedback.targetId);
                const persona = targetNode ? getDynamicCharacter(targetNode.interactions || []) : null;
                if (persona) {
                    waveWidth.value = persona.waveWidth;
                    waveColor.value = persona.waveColor;
                    if (persona.type === 'Crisis') {
                        turbulenceValue.value = withRepeat(withSequence(withTiming(2, { duration: 50 }), withTiming(-2, { duration: 50 })), 10, true);
                    }
                }
            }

            if (cognitiveFeedback.type === 'SELF_CARE' || cognitiveFeedback.type === 'INTERACTION') {
                rippleScale1.value = 0; rippleScale2.value = 0; rippleScale3.value = 0; rippleOpacity.value = 0.8;
                rippleScale1.value = withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) });
                rippleScale2.value = withDelay(400, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
                rippleScale3.value = withDelay(800, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
                rippleOpacity.value = withTiming(0, { duration: 3000 });
            }
            const timer = setTimeout(() => {
                feedbackOpacity.value = withTiming(0, { duration: 500 });
                if (interactionFeedback.isActive) setInteractionFeedback({ ...interactionFeedback, isActive: false });
                if (cognitiveFeedback.message) setCognitiveFeedback({ message: null, type: null });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [interactionFeedback.isActive, cognitiveFeedback.message]);

    const dimmingStyle = useAnimatedStyle(() => ({ opacity: feedbackOpacity.value * 0.6 }));
    const rippleStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: rippleScale1.value }], opacity: rippleOpacity.value, borderWidth: waveWidth.value, borderColor: waveColor.value }));
    const rippleStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: rippleScale2.value }], opacity: rippleOpacity.value * 0.7, borderWidth: waveWidth.value, borderColor: waveColor.value }));
    const rippleStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: rippleScale3.value }], opacity: rippleOpacity.value * 0.4, borderWidth: waveWidth.value, borderColor: waveColor.value }));

    // ── Engine State (Mirror)
    const { zoomLevel, selectedFilters, sortMode, isFilterExpanded } = orbitMapViewState;
    const viewMode = orbitMapViewState.viewMode || 'map';
    const zoomSharedValue = useSharedValue(zoomLevel);
    useEffect(() => { zoomSharedValue.value = withSpring(zoomLevel, { damping: 20, stiffness: 100 }); }, [zoomLevel]);

    const selfPulse = useSharedValue(1);
    useEffect(() => {
        selfPulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 400, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) }), withTiming(1.05, { duration: 400, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) })), -1, false);
    }, []);

    const selfHaloStyle = useAnimatedStyle(() => ({ transform: [{ scale: selfPulse.value }], opacity: 0.4 }));
    const selfHaloSizeStyle = useAnimatedStyle(() => ({ width: 80, height: 80, borderRadius: 40 }));

    const [isMoved, setIsMoved] = useState(false);
    const panX = useSharedValue(0), panY = useSharedValue(-120), offsetX = useSharedValue(0), offsetY = useSharedValue(-120);
    const canvasAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: panX.value + turbulenceValue.value }, { translateY: panY.value + turbulenceValue.value }, { rotate: `${universeRotation.value}deg` }], opacity: entranceOpacity.value }));

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) => gs.numberActiveTouches > 1 || Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
        onPanResponderGrant: () => { offsetX.value = panX.value; offsetY.value = panY.value; },
        onPanResponderMove: (evt, gs) => {
            if (gs.numberActiveTouches === 1) { panX.value = offsetX.value + gs.dx; panY.value = offsetY.value + gs.dy; }
        },
        onPanResponderRelease: () => { setIsMoved(Math.abs(panX.value) > 20 || Math.abs(panY.value + 120) > 20); }
    })).current;

    const { distributedNodes } = useOrbitEngine({ relationships, viewState: orbitMapViewState, currentOrbitSize: BASE_ORBIT_SIZE });
    const filteredRelationships = distributedNodes.map(pn => pn.node);

    // ── Handlers (Mirror)
    const onSelectNode = (id: string) => console.log('Selected:', id);
    const onPressAdd = () => console.log('Add');
    const handleRecenter = useCallback(() => { panX.value = withSpring(0); panY.value = withSpring(-120); universeRotation.value = withSpring(0); setIsMoved(false); }, []);

    const renderHeader = () => (
        <AppHeader 
            title="관계 궤도" 
            leftAction={<TouchableOpacity style={{ backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color={colors.white} /></TouchableOpacity>}
            rightAction={<View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}><TouchableOpacity><List size={22} color={colors.primary} /></TouchableOpacity><TouchableOpacity><Search size={22} color={colors.primary} /></TouchableOpacity></View>}
        />
    );

    const MASK_DEPTH = 56;

    // ─── 🎨 Main Layout (100% ENVIRONMENT MIRROR) ────────────────────────

    return (
        <View style={styles.container}>
            {/* 🧪 [Lab Override] Floating Controller (Dual Row) */}
            <View style={styles.labFloatingBar}>
                <View style={styles.labRow}>
                    <Text style={styles.labSectionTitle}>기상:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.labScrollInner}>
                        {(Object.keys(ATMOSPHERE_THEMES) as AtmosphereState[]).map((state, idx) => (
                            <TouchableOpacity 
                                key={state}
                                style={[styles.labButton, currentTheme.state === state && { backgroundColor: colors.primary }]}
                                onPress={() => setManualAtmosphereState(state)}
                            >
                                <Text style={[styles.labButtonText, currentTheme.state === state && { color: '#FFF' }]}>L{idx + 1}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.labButton, !manualAtmosphereState && { backgroundColor: colors.accent }]} onPress={() => setManualAtmosphereState(null)}>
                            <Text style={[styles.labButtonText, !manualAtmosphereState && { color: '#FFF' }]}>AUTO</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
                
                <View style={[styles.labRow, { marginTop: 8 }]}>
                    <Text style={styles.labSectionTitle}>피드백:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.labScrollInner}>
                        {(Object.keys(DYNAMIC_CHARACTERS) as (keyof typeof DYNAMIC_CHARACTERS)[]).map((pKey) => (
                            <TouchableOpacity 
                                key={pKey}
                                style={[styles.labButton, { width: 60 }]}
                                onPress={() => {
                                    const persona = DYNAMIC_CHARACTERS[pKey];
                                    // Direct forced simulation for Lab
                                    waveWidth.value = persona.waveWidth;
                                    waveColor.value = persona.waveColor;
                                    
                                    // Trigger Ripple Animation Explicitly
                                    rippleScale1.value = 0; rippleScale2.value = 0; rippleScale3.value = 0; rippleOpacity.value = 0.8;
                                    rippleScale1.value = withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) });
                                    rippleScale2.value = withDelay(400, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
                                    rippleScale3.value = withDelay(800, withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }));
                                    rippleOpacity.value = withTiming(0, { duration: 3000 });

                                    if (persona.type === 'Crisis') {
                                        turbulenceValue.value = withRepeat(withSequence(withTiming(3, { duration: 50 }), withTiming(-3, { duration: 50 })), 15, true);
                                    }

                                    setInteractionFeedback({
                                        isActive: true,
                                        targetId: relationships[0]?.id || 'test',
                                        closenessDelta: pKey === 'Drain' || pKey === 'Crisis' ? -5 : 5
                                    });
                                    setCognitiveFeedback({
                                        message: persona.desc,
                                        type: 'INTERACTION'
                                    });
                                    setIsStatusPillExpanded(true);
                                }}
                            >
                                <Text style={styles.labButtonText}>{DYNAMIC_CHARACTERS[pKey].label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <HubLayout header={renderHeader()} scrollable={false}>
                <View style={styles.content}>
                    {/* Filter Bar (Mirror) */}
                    <View style={styles.filterBar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarScroll}>
                            {getDynamicTabs(relationships).map(tab => (
                                <TouchableOpacity key={tab} style={[styles.filterChip, { backgroundColor: selectedFilters.includes(tab) ? colors.primary : colors.white, borderWidth: 1, borderColor: 'rgba(74,93,78,0.1)' }]} onPress={() => setOrbitMapViewState({ selectedFilters: [tab] })}>
                                    <Text style={[styles.filterChipText, { color: selectedFilters.includes(tab) ? colors.white : colors.primary }]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={styles.filterToggleBtn}><ArrowUpDown size={18} color={colors.primary} /></TouchableOpacity>
                            <TouchableOpacity style={styles.filterToggleBtn}><ChevronDown size={18} color={colors.primary} /></TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.orbitCanvas} {...panResponder.panHandlers}>
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
                        
                        {currentTheme.mistEnabled && (
                            <ReAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 2 }, mistStyle]}>
                                {[0, 1, 2].map(idx => <View key={idx} style={[StyleSheet.absoluteFill, { backgroundColor: currentTheme.mistColor, opacity: 0.4 - idx * 0.1 }]} />)}
                            </ReAnimated.View>
                        )}

                        {currentTheme.waveEnabled && (
                            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 3 }]}>
                                <ReAnimated.View style={[{ width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: currentTheme.waveColor }, waveStyle]} />
                            </View>
                        )}

                        <ReAnimated.View style={[styles.animatedCanvas, canvasAnimatedStyle]}>
                            {useMemo(() => [1, 2, 3, 4, 5].map(l => <OrbitRing key={l} level={l} colors={colors} zoomSharedValue={zoomSharedValue} />), [colors, zoomSharedValue])}
                            {distributedNodes.map(({ node, radius, angle }: any) => (
                                <UserNode key={node.id} node={node} orbitRadius={radius} initialAngle={angle} zoomLevel={zoomLevel} zoomSharedValue={zoomSharedValue} totalNodes={relationships.length} onSelectNode={onSelectNode} isFocused />
                            ))}

                            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
                                <ReAnimated.View style={[{ position: 'absolute', backgroundColor: 'rgba(255, 152, 0, 0.4)', shadowColor: '#FF9800', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10, zIndex: 200 }, selfHaloSizeStyle, selfHaloStyle]} />
                                <View style={[styles.centerNode, { borderColor: '#FF9800', zIndex: 201 }]}>
                                    <Image source={{ uri: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }} style={styles.centerAvatar} />
                                </View>
                            </TouchableOpacity>

                            <ReAnimated.View pointerEvents="none" style={[{ position: 'absolute', width: width * 5, height: height * 5, backgroundColor: '#000', zIndex: 100 }, dimmingStyle]} />
                            
                            {/* v5 Interaction Ripples (Layer A) */}
                            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 900 }]}>
                                <ReAnimated.View style={[styles.ripple, rippleStyle1]} />
                                <ReAnimated.View style={[styles.ripple, rippleStyle2]} />
                                <ReAnimated.View style={[styles.ripple, rippleStyle3]} />
                            </View>
                        </ReAnimated.View>
                    </View>

                    {/* Mirror Map Controls */}
                    <View style={styles.mapOverlayControls} pointerEvents="box-none">
                        <ReAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: immediateTheme.flashColor, zIndex: 10 }, flashStyle]} />
                        
                        {/* Status Pill (Mirror) */}
                        <View style={{ position: 'absolute', bottom: 240, alignSelf: 'center', zIndex: 700 }} pointerEvents="box-none">
                            <TouchableOpacity 
                                activeOpacity={0.9} 
                                style={styles.statusPill}
                                onPress={() => setIsStatusPillExpanded(!isStatusPillExpanded)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>{relationships.length}명의 관계가 함께하고 있어요</Text>
                                    {isStatusPillExpanded ? <ChevronDown size={16} color="#999" /> : <ChevronUp size={16} color="#999" />}
                                </View>
                                {isStatusPillExpanded && (
                                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>💭 {eventText || '맑음'}</Text>
                                        <Text style={{ color: colors.primary, opacity: 0.8, fontSize: 12, textAlign: 'center' }}>{currentTheme.ambientText}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Zoom Controls (Mirror) */}
                        <View style={styles.rightControls}>
                            <BlurView intensity={40} tint="light" style={styles.zoomControls}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <TouchableOpacity key={level} style={[styles.zoomBtn, Math.round(zoomLevel) === level && { backgroundColor: colors.primary }]} onPress={() => setZoomLevel(level)}>
                                        <Text style={[styles.zoomBtnText, { color: Math.round(zoomLevel) === level ? colors.white : colors.primary }]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </BlurView>
                            {isMoved && <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter}><LocateFixed size={20} color={colors.primary} /></TouchableOpacity>}
                        </View>

                        <TouchableOpacity style={[styles.checkInButton, { backgroundColor: colors.primary }]} activeOpacity={0.9}>
                            <HeartPulse size={28} color={colors.white} />
                            <Text style={styles.checkInText}>체크인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </HubLayout>

            {/* Masks (Mirror) */}
            <View pointerEvents="none" style={styles.topMask}>
                <Svg width="100%" height={MASK_DEPTH} preserveAspectRatio="none">
                    <Defs><LinearGradient id="topMask" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FCF9F2" /><Stop offset="1" stopColor="#FCF9F2" stopOpacity="0" /></LinearGradient></Defs>
                    <Rect width="100%" height={MASK_DEPTH} fill="url(#topMask)" />
                </Svg>
            </View>
            <View pointerEvents="none" style={styles.bottomMask}>
                <Svg width="100%" height={MASK_DEPTH} preserveAspectRatio="none">
                    <Defs><LinearGradient id="bottomMask" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FCF9F2" stopOpacity="0" /><Stop offset="1" stopColor="#FCF9F2" /></LinearGradient></Defs>
                    <Rect width="100%" height={MASK_DEPTH} fill="url(#bottomMask)" />
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FCF9F2' },
    content: { flex: 1 },
    filterBar: { paddingVertical: 12, backgroundColor: 'transparent', zIndex: 500, flexDirection: 'row', alignItems: 'flex-start' },
    filterBarScroll: { paddingHorizontal: 20, gap: 8 },
    filterChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    filterChipText: { fontSize: 14, fontWeight: '700' },
    filterToggleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginRight: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    orbitCanvas: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'hidden' },
    animatedCanvas: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
    orbitRing: { position: 'absolute' },
    centerNode: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, padding: 4, backgroundColor: '#fff', zIndex: 5 },
    centerAvatar: { width: '100%', height: '100%', borderRadius: 40 },
    userNodeContainer: { position: 'absolute', width: 80, height: 80, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
    dotNode: { borderRadius: 100, borderWidth: 2, borderColor: '#fff' },
    nodeLabelContainer: { position: 'absolute', bottom: -24, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(74, 93, 78, 0.15)', minWidth: 60, alignItems: 'center' },
    nodeNameText: { fontSize: 10, fontWeight: '900', color: '#2F332F' },
    avatarAura: { position: 'absolute', zIndex: 1 },
    avatarWrapper: { borderRadius: 100, borderWidth: 2, backgroundColor: '#fff', padding: 2 },
    avatar: { width: '100%', height: '100%' },
    mapOverlayControls: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, pointerEvents: 'box-none' },
    rightControls: { position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -100 }], alignItems: 'center', gap: 16, zIndex: 25 },
    zoomControls: { borderRadius: 20, padding: 6, gap: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
    zoomBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    zoomBtnText: { fontSize: 12, fontWeight: '800' },
    recenterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 6 },
    checkInButton: { position: 'absolute', bottom: 160, alignSelf: 'center', paddingHorizontal: 24, height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 10, shadowColor: '#4A5D4E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    checkInText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    statusPill: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,1)', maxWidth: width * 0.85 },
    topMask: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
    bottomMask: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 },
    // 🧪 Lab Floating Bar
    labFloatingBar: { position: 'absolute', top: 180, left: 0, right: 0, zIndex: 9999, height: 84, backgroundColor: 'rgba(255,255,255,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingVertical: 8 },
    labRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    labScrollInner: { alignItems: 'center', gap: 8, paddingRight: 40 },
    labSectionTitle: { fontSize: 10, fontWeight: '900', color: '#666', width: 45, textTransform: 'uppercase' },
    labButton: { width: 40, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    labButtonText: { fontSize: 11, fontWeight: '900', color: '#333' },
    ripple: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
});
