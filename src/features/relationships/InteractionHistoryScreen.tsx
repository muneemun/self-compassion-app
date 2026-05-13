import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Search, Filter, MessageCircle, Heart, Zap, User, Edit3, Clock } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useSelfTimeStore } from '../../store/useSelfTimeStore';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

interface Props {
    relationshipId?: string; // Optional for Global History
    dateRange?: { start: Date; end: Date } | null;
    onBack: () => void;
}

export const InteractionHistoryScreen: React.FC<Props> = ({ relationshipId, dateRange, onBack }) => {
    const colors = useColors();
    const relationships = useRelationshipStore(state => state.relationships);
    const selfTimeEntries = useSelfTimeStore(state => state.entries);
    const setRelationshipLogModalOpen = useAppStore(state => state.setRelationshipLogModalOpen);

    const [filterType, setFilterType] = useState<'ALL' | 'INTERACTION' | 'SELF_TIME'>('ALL');

    const getRelativeTime = (dateStr: string) => {
        const now = new Date();
        const past = new Date(dateStr);
        const diffMs = now.getTime() - past.getTime();
        const diffMin = Math.floor(diffMs / (1000 * 60));
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffMin < 1) return '방금 전';
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHr < 24) return `${diffHr}시간 전`;
        if (diffDay === 1) return '어제';
        if (diffDay < 7) return `${diffDay}일 전`;
        return past.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    const historyData = useMemo(() => {
        // 1. Interactions
        let interactions = relationships.flatMap(node => 
            (node.history || []).map(h => ({
                ...h,
                type: 'INTERACTION' as const,
                nodeId: node.id,
                nodeName: node.name,
                nodeImage: node.image,
                createdAt: h.createdAt || h.date
            }))
        );

        if (relationshipId) {
            interactions = interactions.filter(h => h.nodeId === relationshipId);
        }

        // 2. Self Time (only if no specific relationshipId or filter allows)
        let selfTime: any[] = [];
        if (!relationshipId) {
            selfTime = (selfTimeEntries || []).filter(e => !e.isDeleted).map(e => ({
                id: e.id,
                type: 'SELF_TIME' as const,
                nodeName: '나와의 시간',
                title: e.activityName || '자기돌봄',
                satisfaction: e.emotionalSatisfaction,
                energyDrain: e.physicalEnergy,
                createdAt: e.createdAt,
                date: e.createdAt.split('T')[0],
                category: e.category
            }));
        }

        let combined = [...interactions, ...selfTime].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (dateRange) {
            combined = combined.filter(h => {
                const hDate = new Date(h.createdAt);
                return hDate >= dateRange.start && hDate <= dateRange.end;
            });
        }

        if (filterType === 'INTERACTION') {
            combined = combined.filter(h => h.type === 'INTERACTION');
        } else if (filterType === 'SELF_TIME') {
            combined = combined.filter(h => h.type === 'SELF_TIME');
        }

        return combined;
    }, [relationships, selfTimeEntries, relationshipId, filterType]);

    const renderItem = ({ item }: { item: any }) => {
        const isSelfTime = item.type === 'SELF_TIME';
        const displayColor = isSelfTime ? '#4A8C8C' : colors.accent;
        const displayBg = isSelfTime ? 'rgba(74,140,140,0.05)' : 'rgba(217,139,115,0.05)';

        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                    const title = item.title || item.event || '';
                    const isSystemLog = title.includes('초기') || 
                                      title.includes('등록') || 
                                      title.includes('추가') || 
                                      title.includes('반영') || 
                                      title.includes('진단') || 
                                      title.includes('재설정') ||
                                      title.includes('조율') ||
                                      title.includes('업데이트');
                    if (isSystemLog) return;

                    if (isSelfTime) {
                        useAppStore.setState({ editingLogId: item.id, isSelfTimeModalOpen: true });
                    } else {
                        setRelationshipLogModalOpen(true, item.nodeId, item.id);
                    }
                }}
                style={styles.logItem}
            >
                <View style={styles.logLeft}>
                    <View style={[styles.dateCircle, { backgroundColor: displayBg }]}>
                        <Text style={[styles.relativeDate, { color: displayColor }]}>{getRelativeTime(item.createdAt)}</Text>
                    </View>
                    <View style={styles.connectorLine} />
                </View>

                <View style={[styles.logCard, { borderLeftColor: displayColor }]}>
                    <View style={styles.logHeader}>
                        <View style={styles.nodeInfo}>
                            {item.nodeImage ? (
                                <Image source={{ uri: item.nodeImage }} style={styles.nodeAvatar} />
                            ) : (
                                <View style={[styles.nodeAvatar, { backgroundColor: displayBg, alignItems: 'center', justifyContent: 'center' }]}>
                                    <User size={12} color={displayColor} />
                                </View>
                            )}
                            <Text style={[styles.nodeName, { color: colors.primary }]}>{item.nodeName}</Text>
                        </View>
                        <View style={[styles.typeBadge, { backgroundColor: displayBg }]}>
                            <Text style={[styles.typeText, { color: displayColor }]}>{isSelfTime ? '치유' : '교감'}</Text>
                        </View>
                    </View>

                    <Text style={[styles.logTitle, { color: colors.primary }]}>{item.title || item.event}</Text>
                    
                    <View style={styles.logFooter}>
                        <View style={styles.metricRow}>
                            <Clock size={12} color="#999" />
                            <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        {(() => {
                            const title = item.title || '';
                            const isInitialOrSystem = title.includes('초기') || 
                                                     title.includes('등록') || 
                                                     title.includes('진단') || 
                                                     title.includes('재설정') ||
                                                     title.includes('업데이트');
                            
                            if (isInitialOrSystem) return null;

                            return (
                                <View style={styles.metricRow}>
                                    <Heart size={12} color={displayColor} />
                                    <Text style={[styles.metricText, { color: displayColor }]}>
                                        {`${Math.round(item.satisfaction || item.temperature || 0)}%`}
                                    </Text>
                                </View>
                            );
                        })()}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: '#FAF8F4' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleArea}>
                    <Text style={[styles.headerTitle, { color: colors.primary }]}>
                        {relationshipId ? "기록 타임라인" : "전체 활동 히스토리"}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {historyData.length}개의 정서 데이터가 연결되어 있습니다.
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {!relationshipId && (
                <View style={styles.filterContainer}>
                    {[
                        { id: 'ALL', label: '전체' },
                        { id: 'INTERACTION', label: '인맥 교류' },
                        { id: 'SELF_TIME', label: '나와의 시간' }
                    ].map(f => (
                        <TouchableOpacity
                            key={f.id}
                            onPress={() => setFilterType(f.id as any)}
                            style={[
                                styles.filterTab,
                                filterType === f.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                        >
                            <Text style={[styles.filterTabText, filterType === f.id && { color: 'white' }]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <FlatList
                data={historyData}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MessageCircle size={48} color={colors.primary} opacity={0.1} />
                        <Text style={styles.emptyText}>아직 기록된 활동이 없습니다.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleArea: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '900',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#999',
    },
    listContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    logItem: {
        flexDirection: 'row',
        gap: 16,
    },
    logLeft: {
        alignItems: 'center',
        width: 50,
    },
    dateCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    relativeDate: {
        fontSize: 10,
        fontWeight: '900',
        textAlign: 'center',
    },
    connectorLine: {
        width: 1.5,
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.04)',
        marginVertical: 4,
    },
    logCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    nodeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nodeAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    nodeName: {
        fontSize: 13,
        fontWeight: '800',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    logTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
        lineHeight: 20,
    },
    logFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
    },
    metricText: {
        fontSize: 11,
        fontWeight: '900',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        fontWeight: '600',
    },
});
