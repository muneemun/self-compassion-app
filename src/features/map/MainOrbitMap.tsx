import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, Image, TouchableOpacity, Animated, PanResponder, ScrollView, Easing } from 'react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { AppHeader } from '../../components/AppHeader';
import { Search, Plus, Thermometer, LocateFixed, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react-native';
import { RelationshipList } from '../relationships/RelationshipList';
import { RELATIONSHIP_TYPE_LABELS } from '../../types/relationship';
import { BlurView } from 'expo-blur';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { RelationshipNode } from '../../types/relationship';

const { width } = Dimensions.get('window');
const BASE_ORBIT_SIZE = width * 1.1;

const UserNode = ({
    node,
    orbitRadius,
    initialAngle,
    zoomLevel,
    onSelectNode
}: {
    node: RelationshipNode;
    orbitRadius: number;
    initialAngle: number;
    zoomLevel: number;
    onSelectNode?: (id: string) => void;
}) => {
    const angleRad = (initialAngle * Math.PI) / 180;
    const x = Math.cos(angleRad) * orbitRadius;
    const y = Math.sin(angleRad) * orbitRadius;

    // Pulse Animation
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Higher temperature = Slower, deeper pulse (Warm resonance)
        // Lower temperature = Faster, shallower pulse (Cold vibration)
        const duration = node.temperature > 80 ? 3000 : node.temperature > 50 ? 2000 : 1500;

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [node.temperature]);

    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.05], // 더 은은하게 조정하여 메인 라인을 방해하지 않음
    });

    const renderContent = () => {
        // Zoom Level 1: Minimal Dot with Glow
        if (zoomLevel === 1) {
            const dotColor = node.temperature > 80 ? '#D98B73' : '#4A5D4E';
            return (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View style={[
                        styles.dotPulse,
                        {
                            backgroundColor: dotColor,
                            transform: [{ scale: pulseScale }],
                            opacity: pulseOpacity
                        }
                    ]} />
                    <View style={[styles.dotNode, { backgroundColor: dotColor }]} />
                </View>
            );
        }

        // Zoom Level 2-5: Adaptive Avatar
        const avatarSize = zoomLevel === 2 ? 32 : zoomLevel === 3 ? 44 : zoomLevel === 4 ? 56 : 68;
        const showName = zoomLevel >= 4;
        const showRole = zoomLevel === 5;
        const accentColor = node.temperature > 80 ? '#D98B73' : '#4A5D4E';

        return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {/* Aura + Avatar Group: Ensures perfect centering regardless of text below */}
                <View style={{ alignItems: 'center', justifyContent: 'center', width: avatarSize + 10, height: avatarSize + 10 }}>
                    {/* Resonance Aura Pulse */}
                    <Animated.View style={[
                        styles.avatarAura,
                        {
                            width: avatarSize + 10,
                            height: avatarSize + 10,
                            borderRadius: (avatarSize + 10) / 2,
                            backgroundColor: accentColor,
                            transform: [{ scale: pulseScale }],
                            opacity: pulseOpacity,
                        }
                    ]} />

                    {/* Content Group (Avatar + Indicator) */}
                    <View style={{ zIndex: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={[
                            styles.avatarWrapper,
                            {
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: avatarSize / 2,
                                borderColor: accentColor,
                                zIndex: 10,
                            }
                        ]}>
                            {node.image ? (
                                <Image source={{ uri: node.image }} style={[styles.avatar, { borderRadius: (avatarSize - 4) / 2 }]} />
                            ) : (
                                <View style={[styles.avatar, { borderRadius: (avatarSize - 4) / 2, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Text style={{ fontSize: avatarSize / 4 }}>{node.name.charAt(0)}</Text>
                                </View>
                            )}
                        </View>

                        {/* Indicator - Always on top */}
                        <View style={[
                            styles.nodeIndicator,
                            {
                                backgroundColor: accentColor,
                                top: 0,
                                right: 0,
                                width: zoomLevel === 2 ? 10 : 14,
                                height: zoomLevel === 2 ? 10 : 14,
                                borderRadius: zoomLevel === 2 ? 5 : 7,
                                zIndex: 20,
                            }
                        ]} />
                    </View>
                </View>

                {/* Info Text Group - Positioned below the avatar group */}
                {(showName || showRole) && (
                    <View style={[styles.nodeTextContent, { zIndex: 15 }]}>
                        {showName && (
                            <Text style={[styles.nodeName, { color: '#4A5D4E' }]} numberOfLines={1}>
                                {node.name}
                            </Text>
                        )}
                        {showRole && (
                            <Text style={[styles.nodeRole, { color: '#4A5D4E' }]} numberOfLines={1}>
                                {node.role}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={[
                styles.userNodeContainer,
                { transform: [{ translateX: x }, { translateY: y }], width: zoomLevel >= 4 ? 100 : 70, height: zoomLevel >= 4 ? 120 : 70 }
            ]}
            onPress={() => onSelectNode?.(node.id)}
            activeOpacity={0.8}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

interface MainOrbitMapProps {
    onSelectNode?: (id: string) => void;
    onPressSos?: () => void;
    onPressAdd?: () => void;
}

export const MainOrbitMap = ({ onSelectNode, onPressAdd, onPressSos }: MainOrbitMapProps) => {
    const colors = useColors();
    const { relationships } = useRelationshipStore();
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [selectedFilters, setSelectedFilters] = useState<string[]>(['전체']);
    const [zoomLevel, setZoomLevel] = useState(2);
    const [isMoved, setIsMoved] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const zoneFilters = [
        { id: 'z1', label: '안전 기지', zone: 1 },
        { id: 'z2', label: '심리적 우군', zone: 2 },
        { id: 'z3', label: '전략적 동행', zone: 3 },
        { id: 'z4', label: '사회적 지인', zone: 4 },
        { id: 'z5', label: '배경 소음', zone: 5 },
    ];

    const uniqueTypes = Array.from(new Set(relationships.map(r => RELATIONSHIP_TYPE_LABELS[r.type] || r.type)));
    const dynamicTabs = ['전체', ...zoneFilters.map(z => z.label), ...uniqueTypes];

    const handleToggleFilter = (tab: string) => {
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

    const filteredRelationships = selectedFilters.includes('전체')
        ? relationships
        : relationships.filter(r => {
            const rType = RELATIONSHIP_TYPE_LABELS[r.type] || r.type;
            const rZoneLabel = zoneFilters.find(zf => zf.zone === r.zone)?.label;
            return selectedFilters.includes(rType) || (rZoneLabel && selectedFilters.includes(rZoneLabel));
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
    );

    const currentOrbitSize = BASE_ORBIT_SIZE * (1 + (zoomLevel - 2) * 0.25);

    // Pan (Drag) State
    const pan = useRef(new Animated.ValueXY()).current;

    // PanResponder for dragging
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Allow small taps to pass through to children (UserNodes)
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value
                });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                // Check if moved significantly to show recenter button
                const distance = Math.sqrt(Math.pow((pan.x as any)._value, 2) + Math.pow((pan.y as any)._value, 2));
                setIsMoved(distance > 20);
            }
        })
    ).current;

    const handleRecenter = () => {
        Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 7,
            tension: 40
        }).start(() => setIsMoved(false));
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
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                    >
                        {viewMode === 'map' ? (
                            <List size={22} color={colors.primary} />
                        ) : (
                            <LayoutGrid size={22} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Search size={22} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            }
        />
    );

    return (
        <HubLayout
            header={renderHeader()}
            scrollable={false}
        >
            <View style={styles.content}>
                {renderFilterBar()}

                {viewMode === 'list' ? (
                    <RelationshipList
                        hideHeader
                        onSelectNode={onSelectNode}
                        onPressAdd={onPressAdd}
                        selectedTab={selectedFilters[0]} // Legacy fallback
                        onSelectTab={handleToggleFilter}
                        selectedFilters={selectedFilters}
                        dynamicTabs={dynamicTabs}
                    />
                ) : (
                    <>
                        {/* Orbit Engine with Pan Binding */}
                        <View style={styles.orbitCanvas} {...panResponder.panHandlers}>
                            <Animated.View style={[
                                styles.animatedCanvas,
                                { transform: pan.getTranslateTransform() }
                            ]}>
                                {/* Concentric Orbits */}
                                {[1, 2, 3, 4, 5].map((level) => {
                                    const size = (currentOrbitSize * level) / 5;
                                    return (
                                        <View
                                            key={level}
                                            style={[
                                                styles.orbitRing,
                                                {
                                                    width: size,
                                                    height: size,
                                                    borderRadius: size / 2,
                                                    borderColor: colors.primary,
                                                    opacity: 0.1 - (level * 0.015)
                                                }
                                            ]}
                                        />
                                    );
                                })}

                                {/* Relationship Nodes */}
                                {filteredRelationships.map((node, index) => (
                                    <UserNode
                                        key={node.id}
                                        node={node}
                                        orbitRadius={(currentOrbitSize * node.zone) / 10}
                                        initialAngle={(index * 137.5) % 360}
                                        zoomLevel={zoomLevel} onSelectNode={onSelectNode}
                                    />
                                ))}

                                {/* Central User Node */}
                                {(() => {
                                    const centerSize = 60 + zoomLevel * 12; // 줌 레벨에 따른 크기 변화 최적화
                                    return (
                                        <View style={[
                                            styles.centerNode,
                                            {
                                                borderColor: colors.primary,
                                                width: centerSize,
                                                height: centerSize,
                                                borderRadius: centerSize / 2
                                            }
                                        ]}>
                                            <Image
                                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZhog-ssE9RUmUCCo0GoGABZCZVLT5UlTfKbAtHfVBjTugBN624wu5yQg6QyjkAHqZ8kHbkPzMjh8CF2ickkcAgQ-vZWVXR7CHOLRBUQHnjUZOiukl1lRdPUX109jc6q_NbWrvX5slT9QcxjCZjygN5X7yNY5K9ucENvWIWeO9COilETzoXQxBBJMWSeY--MRM51hgmyu4ryOyoesEI_ajcfYwlDbL8PHn2OAjynCA32QMj-grS0DrGw_8HDWBi865kIdqtTd7efo' }}
                                                style={[styles.centerAvatar, { borderRadius: (centerSize - 8) / 2 }]}
                                            />
                                        </View>
                                    );
                                })()}
                            </Animated.View>
                        </View>

                        {/* Status Indicator */}
                        <View style={styles.statusOverlay} pointerEvents="none">
                            <Text style={[styles.statusInfo, { color: colors.primary }]}>
                                {selectedFilters.includes('전체')
                                    ? `${relationships.length}명의 모든 관계가 공명 중입니다`
                                    : `${selectedFilters.join(', ')} 그룹 ${filteredRelationships.length}명이 공명 중입니다`}
                            </Text>
                        </View>

                        {/* Vertical Controls Container */}
                        <View style={styles.rightControls}>
                            {/* Zoom Levels with Glassmorphism */}
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
                                            zoomLevel === level && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setZoomLevel(level)}
                                    >
                                        <Text style={[
                                            styles.zoomBtnText,
                                            { color: zoomLevel === level ? colors.white : colors.primary }
                                        ]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </BlurView>

                            {/* Dynamic Recenter Button */}
                            {isMoved && (
                                <TouchableOpacity
                                    style={[styles.recenterBtn, { backgroundColor: colors.white + 'CC' }]}
                                    onPress={handleRecenter}
                                >
                                    <LocateFixed size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* SOS Button */}

                        {/* SOS Button */}
                        <TouchableOpacity
                            style={[styles.sosButton, { backgroundColor: colors.accent }]}
                            onPress={onPressSos}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.sosText}>SOS</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    filterBar: {
        paddingVertical: 12,
        backgroundColor: 'transparent',
        zIndex: 100,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 22, // Full round chip style
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
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 6,
        overflow: 'visible',
    },
    avatarWrapper: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        padding: 2,
        backgroundColor: '#fff',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    nodeIndicator: {
        position: 'absolute',

        borderWidth: 2,
        borderColor: '#fff',
    },
    thermostatContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
    },
    thermostatText: {
        fontSize: 14,
        fontWeight: '800',
    },
    statusOverlay: {
        position: 'absolute',
        bottom: 120,
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
    },
    sosButton: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        zIndex: 30,
    },
    sosText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
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
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    nodeName: {
        fontSize: 10,
        fontWeight: '900',
        marginTop: 6,
        textAlign: 'center',
        textShadowColor: 'rgba(255,255,255,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    nodeTextContent: { marginTop: 4, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, }, nodeRole: {
        fontSize: 8,
        fontWeight: '600',
        opacity: 0.5,
        textAlign: 'center',
    },
    avatarAura: {
        position: 'absolute',
        zIndex: 1,
    },
    dotPulse: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
    },
});
