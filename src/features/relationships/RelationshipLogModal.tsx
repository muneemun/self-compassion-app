import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Dimensions, Animated, PanResponder, ScrollView } from 'react-native';
import { X, Edit3, Heart, Zap, Calendar } from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useAppStore } from '../../store/useAppStore';

const { width, height } = Dimensions.get('window');

// Reusable Metric Slider for the modal with Pan Support
const MetricSlider = ({ value, onChange, activeColor, trackColor, thumbColor }: any) => {
    const sliderWidth = width - 48; // Full card width minus padding
    
    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                const x = evt.nativeEvent.locationX;
                const percent = Math.min(100, Math.max(0, Math.round((x / sliderWidth) * 100)));
                onChange(percent);
            },
            onPanResponderMove: (evt, gestureState) => {
                // Adjust for gestureState.dx if using move, but simpler to use locationX if possible
                // Using locationX in onPanResponderMove is tricky because it's relative to the touch
                // Better: use gestureState.moveX relative to the component's absolute position
                // For simplicity here, let's use the press position
                const x = evt.nativeEvent.locationX;
                const percent = Math.min(100, Math.max(0, Math.round((x / sliderWidth) * 100)));
                onChange(percent);
            },
        })
    ).current;

    return (
        <View style={styles.sliderContainer} {...panResponder.panHandlers}>
            <View pointerEvents="none" style={[styles.sliderTrack, { backgroundColor: trackColor }]}>
                <View style={[styles.sliderFill, { width: `${value}%`, backgroundColor: activeColor }]} />
            </View>
            <View pointerEvents="none" style={[styles.sliderThumb, { left: `${value}%`, backgroundColor: thumbColor, borderColor: activeColor }]} />
        </View>
    );
};

export const RelationshipLogModal = () => {
    const colors = useColors();
    const { 
        isRelationshipLogModalOpen, 
        currentLogTargetId, 
        editingLogId,
        setRelationshipLogModalOpen,
        setInteractionFeedback,
        setCognitiveFeedback
    } = useAppStore();
    
    const node = useRelationshipStore(state => 
        state.relationships.find(r => r.id === currentLogTargetId)
    );
    const addInteraction = useRelationshipStore(state => state.addInteraction);
    const updateInteraction = useRelationshipStore(state => state.updateInteraction);

    const [newLog, setNewLog] = useState({ 
        title: '', 
        description: '', 
        satisfaction: 50, 
        energyDrain: 30,
        date: new Date().toISOString().split('T')[0]
    });

    // Reset or Load state when opening
    useEffect(() => {
        if (isRelationshipLogModalOpen && node) {
            if (editingLogId) {
                const existingLog = node.history.find(h => h.id === editingLogId);
                if (existingLog) {
                    setNewLog({
                        title: existingLog.title || '',
                        description: existingLog.description || '',
                        satisfaction: existingLog.satisfaction || 50,
                        energyDrain: existingLog.energyDrain || 30,
                        date: existingLog.date || new Date().toISOString().split('T')[0]
                    });
                }
            } else {
                setNewLog({ 
                    title: '', 
                    description: '', 
                    satisfaction: 50, 
                    energyDrain: 30,
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isRelationshipLogModalOpen, currentLogTargetId, editingLogId, node]);

    if (!isRelationshipLogModalOpen || !node) return null;

    const handleSave = () => {
        if (!newLog.title.trim()) return;
        
        if (editingLogId) {
            // Update existing log
            updateInteraction(node.id, editingLogId, {
                title: newLog.title,
                description: newLog.description,
                satisfaction: newLog.satisfaction,
                energyDrain: newLog.energyDrain,
                date: newLog.date
            });
            setRelationshipLogModalOpen(false);
        } else {
            // Add new log
            const ALPHA = 0.15;
            const delta = Math.round(ALPHA * (newLog.satisfaction - newLog.energyDrain));
            
            addInteraction(
                node.id, 
                newLog.date, 
                newLog.satisfaction, 
                newLog.energyDrain, 
                newLog.title, 
                newLog.description
            );

            setRelationshipLogModalOpen(false);

            // Trigger Feedback only for new interactions
            setInteractionFeedback({
                targetId: node.id,
                isActive: true,
                closenessDelta: delta
            });

            const absDelta = Math.abs(delta);
            const message = delta > 0 
                ? `정서적 공명을 통해 긴밀도가 ${absDelta}% 상승했습니다.`
                : delta < 0 
                    ? `심리적 거리감이 ${absDelta}% 확보되었습니다.`
                    : '안정적인 관계 밸런스를 유지했습니다.';
            
            setCognitiveFeedback({
                message,
                type: 'INTERACTION'
            });
        }
    };

    return (
        <Modal
            transparent
            visible={isRelationshipLogModalOpen}
            animationType="slide"
            onRequestClose={() => setRelationshipLogModalOpen(false)}
        >
            <View style={styles.backdrop}>
                <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    onPress={() => setRelationshipLogModalOpen(false)} 
                />
                <View style={[styles.card, { backgroundColor: colors.white }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <View style={styles.titleRow}>
                                <Edit3 size={20} color={colors.primary} />
                                <Text style={[styles.title, { color: colors.primary }]}>
                                    {editingLogId ? '교류 기록 수정' : `${node.name}님과의 교류 기록`}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setRelationshipLogModalOpen(false)}>
                                <X size={24} color={colors.primary} opacity={0.5} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.primary }]}>교류 날짜</Text>
                                <View style={styles.dateInputWrapper}>
                                    <Calendar size={16} color={colors.primary} style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={[styles.dateInput, { color: colors.primary }]}
                                        value={newLog.date}
                                        onChangeText={t => setNewLog(p => ({ ...p, date: t }))}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.primary }]}>활동 주제</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.primary, borderColor: colors.primary + '20' }]}
                                    placeholder="예: 저녁 식사, 카페 대화"
                                    placeholderTextColor="#999"
                                    value={newLog.title}
                                    onChangeText={t => setNewLog(p => ({ ...p, title: t }))}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.primary }]}>상세 내용 (선택)</Text>
                                <TextInput
                                    style={[styles.input, { 
                                        color: colors.primary, 
                                        borderColor: colors.primary + '20',
                                        height: 100,
                                        textAlignVertical: 'top'
                                    }]}
                                    placeholder="어떤 이야기를 나누었나요? 기분은 어땠나요?"
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                    value={newLog.description}
                                    onChangeText={t => setNewLog(p => ({ ...p, description: t }))}
                                />
                            </View>

                            <View style={styles.metricsGroup}>
                                <View style={styles.metricItem}>
                                    <View style={styles.metricHeader}>
                                        <View style={styles.metricLabelRow}>
                                            <Heart size={16} color={colors.accent} fill={colors.accent} />
                                            <Text style={[styles.metricLabel, { color: colors.primary }]}>충족감 (만족도)</Text>
                                        </View>
                                        <Text style={[styles.metricValue, { color: colors.accent }]}>{newLog.satisfaction}%</Text>
                                    </View>
                                    <MetricSlider 
                                        value={newLog.satisfaction}
                                        onChange={(v) => setNewLog(p => ({ ...p, satisfaction: v }))}
                                        activeColor={colors.accent}
                                        trackColor={colors.primary + '10'}
                                        thumbColor={colors.white}
                                    />
                                </View>

                                <View style={styles.metricItem}>
                                    <View style={styles.metricHeader}>
                                        <View style={styles.metricLabelRow}>
                                            <Zap size={16} color="#90A4AE" fill="#90A4AE" />
                                            <Text style={[styles.metricLabel, { color: colors.primary }]}>에너지 소모량</Text>
                                        </View>
                                        <Text style={[styles.metricValue, { color: '#90A4AE' }]}>{newLog.energyDrain}%</Text>
                                    </View>
                                    <MetricSlider 
                                        value={newLog.energyDrain}
                                        onChange={(v) => setNewLog(p => ({ ...p, energyDrain: v }))}
                                        activeColor="#90A4AE"
                                        trackColor={colors.primary + '10'}
                                        thumbColor={colors.white}
                                    />
                                </View>
                            </View>

                            <Text style={styles.guideText}>
                                충족감이 소모량보다 높으면 긴밀도가 상승합니다.
                            </Text>

                            <TouchableOpacity 
                                style={[
                                    styles.submitBtn, 
                                    { backgroundColor: colors.primary },
                                    !newLog.title.trim() && { opacity: 0.5 }
                                ]}
                                onPress={handleSave}
                                disabled={!newLog.title.trim()}
                            >
                                <Text style={styles.submitBtnText}>{editingLogId ? '수정 완료' : '기록 완료'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    card: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.6,
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '600',
    },
    metricsGroup: {
        gap: 24,
    },
    metricItem: {
        gap: 12,
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metricLabel: {
        fontSize: 15,
        fontWeight: '700',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    sliderContainer: {
        height: 24,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    sliderFill: {
        height: '100%',
    },
    sliderThumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        top: 0,
        marginLeft: -12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sliderInputOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    guideText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontWeight: '500',
    },
    submitBtn: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    dateInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderColor: 'rgba(74, 93, 78, 0.1)',
    },
    dateInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    }
});
