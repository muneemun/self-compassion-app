import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { Plus, Search, Radio, Heart, Users, Target, Briefcase, Menu, ChevronDown, ChevronUp } from 'lucide-react-native';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';

const { width } = Dimensions.get('window');

import { useRelationshipStore } from '../../store/useRelationshipStore';
import { RelationshipNode, RELATIONSHIP_TYPE_LABELS } from '../../types/relationship';

const BadgeIcon = ({ type, color }: { type: string, color: string }) => {
    const iconSize = 14;
    switch (type) {
        case 'favorite': return <Heart color={color} size={iconSize} fill={color} />;
        case 'family': return <Users color={color} size={iconSize} />;
        case 'work': return <Briefcase color={color} size={iconSize} />;
        case 'friend': return <Target color={color} size={iconSize} />;
        default: return null;
    }
};

const RelationshipCard = ({ node, onSelect }: { node: RelationshipNode, onSelect?: (id: string) => void }) => {
    const colors = useColors();
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.white }]}
            onPress={() => onSelect?.(node.id)}
        >
            <View style={styles.avatarContainer}>
                {node.image ? (
                    <Image source={{ uri: node.image }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                        <Users size={32} color={colors.primary} />
                    </View>
                )}
                <View style={[styles.badge, { backgroundColor: colors.background, borderColor: 'rgba(74,93,78,0.1)' }]}>
                    <BadgeIcon type={node.type} color={colors.accent} />
                </View>
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
                                height: `${node.temperature}%`,
                                backgroundColor: node.temperature > 70 ? colors.accent : colors.primary,
                                opacity: node.temperature / 100
                            }
                        ]}
                    />
                </View>
                <Text style={[styles.tempText, { color: node.temperature > 70 ? colors.accent : colors.primary }]}>
                    {node.temperature}°
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
    onSelectNode?: (id: string) => void;
    onPressAdd?: () => void;
    hideHeader?: boolean;
    selectedTab: string;
    onSelectTab: (tab: string) => void;
    selectedFilters?: string[];
    dynamicTabs?: string[];
}

export const RelationshipList = ({
    onSelectNode,
    onPressAdd,
    hideHeader = false,
    selectedTab,
    onSelectTab,
    selectedFilters = ['전체'],
    dynamicTabs: passedTabs
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
            <View style={COMMON_STYLES.headerRightGroup}>
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
            { id: 'z1', label: '안전 기지', zone: 1 },
            { id: 'z2', label: '심리적 우군', zone: 2 },
            { id: 'z3', label: '전략적 동행', zone: 3 },
            { id: 'z4', label: '사회적 지인', zone: 4 },
            { id: 'z5', label: '배경 소음', zone: 5 },
        ];

        const uniqueTypes = Array.from(new Set(relationships.map(r => RELATIONSHIP_TYPE_LABELS[r.type] || r.type)));
        const dynamicTabs = passedTabs || ['전체', ...zoneFilters.map(z => z.label), ...uniqueTypes];

        const filteredRelationships = selectedFilters.includes('전체')
            ? relationships
            : relationships.filter(r => {
                const rType = RELATIONSHIP_TYPE_LABELS[r.type] || r.type;
                const rZoneLabel = zoneFilters.find(zf => zf.zone === r.zone)?.label;
                return selectedFilters.includes(rType) || (rZoneLabel && selectedFilters.includes(rZoneLabel));
            });

        return (
            <View style={styles.container}>
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
                        const zone1Nodes = filteredRelationships.filter(node => node.zone === 1);
                        return (
                            <>
                                <ZoneSection zone={1} title="안전 기지" priority count={zone1Nodes.length} />
                                {zone1Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelectNode} />
                                ))}
                            </>
                        );
                    })()}

                    {/* Zone 2 */}
                    {(() => {
                        const zone2Nodes = filteredRelationships.filter(node => node.zone === 2);
                        return (
                            <>
                                <ZoneSection zone={2} title="심리적 우군" count={zone2Nodes.length} />
                                {zone2Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelectNode} />
                                ))}
                            </>
                        );
                    })()}

                    {/* Zone 3 */}
                    {(() => {
                        const zone3Nodes = filteredRelationships.filter(node => node.zone === 3);
                        return (
                            <>
                                <ZoneSection zone={3} title="전략적 동행" count={zone3Nodes.length} />
                                {zone3Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelectNode} />
                                ))}
                            </>
                        );
                    })()}

                    {/* Zone 4 */}
                    {(() => {
                        const zone4Nodes = filteredRelationships.filter(node => node.zone === 4);
                        return (
                            <>
                                <ZoneSection zone={4} title="사회적 지인" count={zone4Nodes.length} />
                                {zone4Nodes.map(node => (
                                    <RelationshipCard key={node.id} node={node} onSelect={onSelectNode} />
                                ))}
                            </>
                        );
                    })()}
                </View>
            </View>
        );
    };

    if (hideHeader) {
        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderInnerContent()}
            </ScrollView>
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
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
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
