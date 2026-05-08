import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { Plus, Search, Radio, Heart, Users, Target, Briefcase, Menu, ChevronDown, ChevronUp, Star, Trash2, Zap, Calendar, Flame, Leaf, CircleDashed } from 'lucide-react-native';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';

const { width } = Dimensions.get('window');

import { useRelationshipStore } from '../../store/useRelationshipStore';
import { RelationshipNode, RELATIONSHIP_TYPE_LABELS, getDynamicCharacter, RQS_GRADE_BADGES } from '../../types/relationship';

// 4-Quadrant aligned character badge
const BadgeIcon = ({ character }: { character: ReturnType<typeof getDynamicCharacter> }) => {
    const iconSize = 14;
    if (!character) return null;
    if (character.icon === 'Zap')          return <Zap color={character.color} size={iconSize} />;
    if (character.icon === 'Flame')        return <Flame color={character.color} size={iconSize} fill={character.color} />;
    if (character.icon === 'CircleDashed') return <CircleDashed color={character.color} size={iconSize} />;
    return <Leaf color={character.color} size={iconSize} />;
};

const RelationshipCard = ({ node, onSelect }: { node: RelationshipNode, onSelect?: (id: string) => void }) => {
    const colors = useColors();
    const zoneColors: Record<number, string> = {
        1: '#FFB74D',
        2: '#D98B73',
        3: '#4A5D4E',
        4: '#90A4AE',
        5: '#D1D5DB'
    };
    const zoneColor = zoneColors[node.zone] || colors.primary;

    // [Platformization] Use interactions for character calculation
    const character = getDynamicCharacter(node.interactions || []);
    const rqsGrade = node.rqsResult?.grade ? RQS_GRADE_BADGES[node.rqsResult.grade] : null;

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.white }]}
            onPress={() => onSelect?.(node.id)}
        >
            <View style={styles.avatarContainer}>
                <View style={[styles.avatarWrapper, { borderColor: zoneColor, borderWidth: 3, borderRadius: 36, padding: 2 }]}>
                    {node.image ? (
                        <Image source={{ uri: node.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                            <Users size={32} color={colors.primary} />
                        </View>
                    )}
                </View>
                {/* Primary: 4-quadrant character badge (교류 기록 기반) */}
                {character && (
                    <View style={[styles.badge, { backgroundColor: character.bgColor, borderColor: character.color }]}>
                        <BadgeIcon character={character} />
                    </View>
                )}
                {/* Supplementary: RQS grade badge (RQS 실시한 경우만) */}
                {rqsGrade && (
                    <View style={[styles.rqsBadge, { backgroundColor: rqsGrade.color }]}>
                        <Text style={styles.rqsBadgeText}>{rqsGrade.grade}</Text>
                    </View>
                )}
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.name, { color: colors.primary }]}>{node.name}</Text>
                <Text style={[styles.role, { color: colors.primary, opacity: 0.6 }]}>
                    {node.role} • {node.lastInteraction}
                </Text>
            </View>

            <View style={styles.tempContainer}>
                <View style={styles.tempBarBackground}>
                    <View
                        style={[
                            styles.tempBarFill,
                            {
                                height: `${Math.max(0, Math.min(100, node.temperature || 0))}%`,
                                backgroundColor: (node.temperature || 0) > 70 ? colors.accent : colors.primary,
                                opacity: Math.max(0.1, (node.temperature || 0) / 100)
                            }
                        ]}
                    />
                </View>
                <Text style={[styles.tempText, { color: (node.temperature || 0) > 70 ? colors.accent : colors.primary }]}>
                    {(node.temperature || 0)}%
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const ZoneSection = ({ zone, title, priority, count }: { zone: number, title: string, priority?: boolean, count: number }) => {
    const colors = useColors();

    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
                <View style={[styles.zoneNumber, { borderColor: colors.primary }]}>
                    <Text style={[styles.zoneNumberText, { color: colors.primary }]}>{zone}</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.6 }]}>
                    ZONE {zone} • {title} ({count}명)
                </Text>
            </View>
            {priority && (
                <View style={[styles.priorityBadge, { backgroundColor: 'rgba(217,139,115,0.1)' }]}>
                    <Text style={[styles.priorityBadgeText, { color: colors.accent }]}>High Priority</Text>
                </View>
            )}
        </View>
    );
};

interface RelationshipListProps {
    onSelect?: (id: string) => void;
    onPressAdd?: () => void;
    hideHeader?: boolean;
    selectedTab: string;
    onSelectTab: (tab: string) => void;
    selectedFilters?: string[];
    dynamicTabs?: string[];
    sortMode?: 'default' | 'hot' | 'cold';
}

export const RelationshipList = ({
    onSelect,
    onPressAdd,
    hideHeader = false,
    selectedTab,
    onSelectTab,
    selectedFilters = ['전체'],
    dynamicTabs: passedTabs,
    sortMode = 'default'
}: RelationshipListProps) => {
    const colors = useColors();
    const relationships = useRelationshipStore(state => state.relationships);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const renderHeader = () => (
        <View style={[COMMON_STYLES.headerContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity
                style={[COMMON_STYLES.primaryActionBtn, { backgroundColor: colors.primary }]}
                onPress={onPressAdd}
            >
                <Plus color={colors.white} size={UI_CONSTANTS.ICON_SIZE} />
            </TouchableOpacity>
            
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: colors.primary }}>관계 궤도</Text>
            </View>

            <View style={[COMMON_STYLES.headerRightGroup, { gap: 12 }]}>
                <TouchableOpacity style={COMMON_STYLES.secondaryActionBtn}>
                    <Search color={colors.primary} size={UI_CONSTANTS.ICON_SIZE} />
                </TouchableOpacity>
                <TouchableOpacity style={COMMON_STYLES.secondaryActionBtn}>
                    <Menu color={colors.primary} size={UI_CONSTANTS.ICON_SIZE} />
                </TouchableOpacity>
            </View>
        </View>
    );


    const renderInnerContent = () => {
        const zoneFilters = [
            { id: 'z1', label: '핵심 그룹', zone: 1 },
            { id: 'z2', label: '정서적 공유 그룹', zone: 2 },
            { id: 'z3', label: '기능적 협력 관계', zone: 3 },
            { id: 'z4', label: '단순 인지 관계', zone: 4 },
            { id: 'z5', label: '배경 소음(외부 환경)', zone: 5 },
        ];

        const uniqueTypes = Array.from(new Set(relationships.map(r => (r.type && RELATIONSHIP_TYPE_LABELS[r.type]) || r.type))).filter(Boolean) as string[];
        const dynamicTabs = passedTabs || ['전체', ...zoneFilters.map(z => z.label), ...uniqueTypes];

        const filteredRelationships = (relationships || []).filter(r => {
            if (!r) return false;
            if (selectedFilters.includes('전체')) return true;

            const rType = (r.type && RELATIONSHIP_TYPE_LABELS[r.type]) || r.type;
            const zoneMatch = zoneFilters.find(zf => zf.zone === r.zone);
            const rZoneLabel = zoneMatch ? zoneMatch.label : (r.zone ? `Zone ${r.zone}` : '');

            return (rType && selectedFilters.includes(rType)) || (rZoneLabel && selectedFilters.includes(rZoneLabel));
        });

        const sortedFilteredRelationships = [...filteredRelationships].sort((a, b) => {
            if (!a || !b) return 0;
            if (sortMode === 'hot') return (b.temperature || 0) - (a.temperature || 0);
            if (sortMode === 'cold') return (a.temperature || 0) - (b.temperature || 0);
            return (a.name || '').localeCompare(b.name || '');
        });

        return (
            <View style={styles.container}>
                {relationships.length === 0 ? (
                    <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 100,
                        padding: 24,
                    }}>
                        <View style={{
                            width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(74,93,78,0.1)', 
                            alignItems: 'center', justifyContent: 'center', marginBottom: 16
                        }}>
                            <Users size={32} color={colors.primary} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary, marginBottom: 8, textAlign: 'center' }}>
                            아직 등록된 관계가 없습니다
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.primary, opacity: 0.6, marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>
                            새로운 사람을 추가하여{'\n'}관계 지표를 분석하고 관리해보세요.
                        </Text>
                        <TouchableOpacity
                            style={{ 
                                backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 14, 
                                borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 
                            }}
                            onPress={onPressAdd}
                        >
                            <Plus size={18} color="white" />
                            <Text style={{ fontSize: 15, fontWeight: '800', color: 'white' }}>관계 추가하기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Filter Bar - Only show if not hidden in Map view */}
                {!hideHeader && (
                    <View style={[styles.filterBar, isFilterExpanded && styles.filterBarExpanded, { marginBottom: 20 }]}>
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
                                            onPress={() => onSelectTab(tab)}
                                        >
                                            <Text style={[styles.filterChipText, { color: isSelected ? colors.white : colors.primary, opacity: isSelected ? 1 : 0.7 }]}>
                                                {tab}
                                            </Text>
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
                                            onPress={() => onSelectTab(tab)}
                                        >
                                            <Text style={[styles.filterChipText, { color: isSelected ? colors.white : colors.primary, opacity: isSelected ? 1 : 0.7 }]}>
                                                {tab}
                                            </Text>
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
                                <ChevronUp size={16} color={colors.white} />
                            ) : (
                                <ChevronDown size={16} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* List Content */}
                <View style={styles.listContent}>
                    {/* Zone 1 */}
                    {(() => {
                        const zone1Nodes = sortedFilteredRelationships.filter(node => node.zone === 1);
                        return (
                            <>
                                <ZoneSection zone={1} title="핵심 그룹" priority count={zone1Nodes.length} />
                                {zone1Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelect} />
                                ))}
                            </>
                        );
                    })()}

                    {/* Zone 2 */}
                    {(() => {
                        const zone2Nodes = sortedFilteredRelationships.filter(node => node.zone === 2);
                        return (
                            <>
                                <ZoneSection zone={2} title="정서적 공유 그룹" count={zone2Nodes.length} />
                                {zone2Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelect} />
                                ))}
                            </>
                        );
                    })()}

                    {/* Zone 3 */}
                    {(() => {
                        const zone3Nodes = sortedFilteredRelationships.filter(node => node.zone === 3);
                        return (
                            <>
                                <ZoneSection zone={3} title="기능적 협력 관계" count={zone3Nodes.length} />
                                {zone3Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelect} />
                                ))}
                            </>
                        );
                    })()}

                    {/* Zone 4 */}
                    {(() => {
                        const zone4Nodes = sortedFilteredRelationships.filter(node => node.zone === 4);
                        return (
                            <>
                                <ZoneSection zone={4} title="단순 인지 관계" count={zone4Nodes.length} />
                                {zone4Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelect} />
                                ))}
                            </>
                        );
                    })()}
                </View>
                </>
                )}
            </View>
        );
    };

    if (hideHeader) {
        return (
            <>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {renderInnerContent()}
                    <View style={{ height: 100 }} />
                </ScrollView>
                {/* 하단 시스템 바 가독성 가드 */}
                <ExpoLinearGradient
                    colors={['transparent', colors.background]}
                    style={styles.navBottomGuard}
                    pointerEvents="none"
                />
            </>
        );
    }

    return (
        <HubLayout header={renderHeader()} scrollable>
            {renderInnerContent()}
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },
    navBottomGuard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        zIndex: 10,
    },
    container: {
        paddingHorizontal: 20,
    },
    filterBar: {
        flexDirection: 'row',
        marginHorizontal: -20,
        alignItems: 'flex-start',
    },
    filterBarExpanded: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 20,
        marginHorizontal: -20,
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
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    filterToggleBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        marginRight: 10,
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
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    listContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    zoneNumber: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.3,
    },
    zoneNumberText: {
        fontSize: 10,
        fontWeight: '800',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    priorityBadgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        shadowColor: '#4a5d4e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarWrapper: {
        borderRadius: 36,
        padding: 2,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    badge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rqsBadge: {
        position: 'absolute',
        top: -4,
        left: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    rqsBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    role: {
        fontSize: 14,
        fontWeight: '600',
    },
    tempContainer: {
        alignItems: 'center',
        paddingLeft: 8,
        gap: 4,
    },
    tempBarBackground: {
        width: 6,
        height: 40,
        borderRadius: 3,
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
    }
});
