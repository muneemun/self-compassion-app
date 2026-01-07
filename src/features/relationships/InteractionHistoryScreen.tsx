import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { ArrowLeft, Calendar, Search, Filter, MessageCircle, Heart, Zap } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width } = Dimensions.get('window');

interface Props {
    relationshipId: string;
    onBack: () => void;
}

export const InteractionHistoryScreen: React.FC<Props> = ({ relationshipId, onBack }) => {
    const colors = useColors();
    const node = useRelationshipStore(state => state.relationships.find(r => r.id === relationshipId));

    const [filterType, setFilterType] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');

    const historyData = useMemo(() => {
        if (!node?.history) return [];
        let data = [...node.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (filterType === 'POSITIVE') {
            data = data.filter(item => item.temperature >= 60);
        } else if (filterType === 'NEGATIVE') {
            data = data.filter(item => item.temperature < 60);
        }
        return data;
    }, [node?.history, filterType]);

    if (!node) return null;

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.logItem, { borderColor: item.temperature >= 70 ? colors.accent : '#eee' }]}>
            <View style={styles.logLeft}>
                <View style={[styles.dateBadge, { backgroundColor: colors.background }]}>
                    <Text style={styles.dateText}>{item.date.split('-')[1]}/{item.date.split('-')[2]}</Text>
                    <Text style={styles.yearText}>{item.date.split('-')[0]}</Text>
                </View>
                <View style={styles.connectorLine} />
            </View>

            <View style={[styles.logCard, { backgroundColor: '#fff' }]}>
                <View style={styles.logHeader}>
                    <View style={styles.logTypeTag}>
                        <MessageCircle size={10} color={colors.primary} />
                        <Text style={styles.logType}>상호작용</Text>
                    </View>
                    <Text style={[styles.tempText, { color: item.temperature >= 60 ? colors.accent : '#999' }]}>
                        {item.temperature}°C
                    </Text>
                </View>

                <Text style={styles.logEvent}>{item.event || "기록 없음"}</Text>

                <View style={styles.logFooter}>
                    {item.oxytocin && item.oxytocin > 50 && (
                        <View style={styles.hormoneTag}>
                            <Heart size={10} color="#E91E63" />
                            <Text style={styles.hormoneText}>옥시토신 {item.oxytocin}%</Text>
                        </View>
                    )}
                    {item.cortisol && item.cortisol > 50 && (
                        <View style={styles.hormoneTag}>
                            <Zap size={10} color="#F44336" />
                            <Text style={styles.hormoneText}>코르티솔 {item.cortisol}%</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#FCF9F2' }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.primary }]}>{node.name}님과의 기록</Text>
                    <Text style={styles.headerSubtitle}>총 {node.history?.length || 0}개의 상호작용</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {['ALL', 'POSITIVE', 'NEGATIVE'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.filterChip,
                            filterType === type && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setFilterType(type as any)}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: filterType === type ? 'white' : colors.primary }
                        ]}>
                            {type === 'ALL' ? '전체' : type === 'POSITIVE' ? '긍정적' : '부정적'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={historyData}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>기록이 없습니다.</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    logItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    logLeft: {
        alignItems: 'center',
        marginRight: 16,
        width: 50,
    },
    dateBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        zIndex: 2,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#333',
    },
    yearText: {
        fontSize: 9,
        color: '#999',
    },
    connectorLine: {
        width: 2,
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginTop: -10,
        marginBottom: -30, // Next item connection
    },
    logCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    logTypeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    logType: {
        fontSize: 10,
        fontWeight: '700',
        color: '#666',
    },
    tempText: {
        fontSize: 14,
        fontWeight: '900',
    },
    logEvent: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        lineHeight: 22,
    },
    logFooter: {
        flexDirection: 'row',
        gap: 8,
    },
    hormoneTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    hormoneText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    }
});
