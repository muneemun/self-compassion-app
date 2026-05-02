import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Shield, Zap, Leaf, ChevronRight, X, LayoutGrid, Info, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStructuralDiagnosis, StructuralInsight } from './useStructuralDiagnosis';

const THEME = {
    primary: "#4A5D4E",
    secondary: "#D98B73",
    background: "#FCF9F2",
    surface: "#FFFFFF",
    textMain: "#2F332F",
    textMuted: "#8C968D",
    accent: "#E9A15A",
};

interface ActionableInsightCardProps {
    onClose: () => void;
}

export const ActionableInsightCard: React.FC<ActionableInsightCardProps> = ({ onClose }) => {
    const { headline, insights, actionItems } = useStructuralDiagnosis();

    const getInsightIcon = (type: StructuralInsight['type']) => {
        switch (type) {
            case 'density': return <LayoutGrid size={18} color={THEME.primary} />;
            case 'stress': return <Zap size={18} color={THEME.secondary} />;
            case 'recovery': return <Leaf size={18} color={THEME.accent} />;
            default: return <Info size={18} color={THEME.primary} />;
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#FDFBF7']}
                style={styles.card}
            >
                {/* 1. Headline Diagnosis */}
                <View style={styles.header}>
                    <View style={styles.tag}>
                        <Shield size={12} color="white" fill="white" />
                        <Text style={styles.tagText}>오늘의 우주 진단</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={20} color={THEME.textMuted} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.headline}>{headline}</Text>

                {/* 2. WHY: Structural Causes */}
                <View style={styles.insightsGrid}>
                    {insights.map((insight, idx) => (
                        <View key={idx} style={styles.insightRow}>
                            <View style={[styles.iconBox, { backgroundColor: insight.severity === 'high' ? 'rgba(217, 139, 115, 0.1)' : 'rgba(74, 93, 78, 0.05)' }]}>
                                {getInsightIcon(insight.type)}
                            </View>
                            <View style={styles.insightContent}>
                                <View style={styles.insightTitleRow}>
                                    <Text style={styles.insightTitle}>{insight.title}</Text>
                                    <Text style={[styles.insightValue, { color: insight.severity === 'high' ? THEME.secondary : THEME.primary }]}>
                                        {insight.value}
                                    </Text>
                                </View>
                                <Text style={styles.insightDesc}>{insight.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 3. WHAT NEXT: Immediate Actions */}
                <View style={styles.actionSection}>
                    <View style={styles.sectionHeader}>
                        <Sparkles size={14} color={THEME.secondary} />
                        <Text style={styles.sectionTitle}>추천 액션</Text>
                    </View>
                    
                    {actionItems.map((item, idx) => (
                        <TouchableOpacity key={idx} style={styles.actionButton}>
                            <View style={styles.actionInner}>
                                <Text style={styles.actionLabel}>{item.label}</Text>
                                <ChevronRight size={16} color={THEME.primary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
                    <Text style={styles.confirmText}>확인</Text>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        width: '100%',
    },
    card: {
        borderRadius: 32,
        padding: 24,
        shadowColor: "#4A5D4E",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    tagText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    closeBtn: {
        padding: 4,
    },
    headline: {
        fontSize: 22,
        fontWeight: '900',
        color: THEME.primary,
        lineHeight: 30,
        marginBottom: 24,
    },
    insightsGrid: {
        gap: 16,
        marginBottom: 32,
    },
    insightRow: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightContent: {
        flex: 1,
    },
    insightTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    insightTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: THEME.textMain,
    },
    insightValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    insightDesc: {
        fontSize: 13,
        color: THEME.textMuted,
        lineHeight: 18,
        fontWeight: '500',
    },
    actionSection: {
        gap: 12,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: THEME.textMuted,
        textTransform: 'uppercase',
    },
    actionButton: {
        backgroundColor: 'rgba(74, 93, 78, 0.03)',
        borderRadius: 16,
        padding: 16,
    },
    actionInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.primary,
    },
    confirmBtn: {
        backgroundColor: THEME.primary,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    confirmText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});
