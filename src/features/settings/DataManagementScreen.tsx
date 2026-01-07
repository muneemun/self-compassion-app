import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import {
    ChevronLeft, ShieldCheck, Database, Heart, RefreshCw,
    FileText, HardDrive, Lock as LockIcon, History,
    ChevronRight, Download, Info
} from 'lucide-react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { useRelationshipStore } from '../../store/useRelationshipStore';

const { width } = Dimensions.get('window');

interface DataManagementScreenProps {
    onBack: () => void;
}

export const DataManagementScreen = ({ onBack }: DataManagementScreenProps) => {
    const colors = useColors();
    const { relationships } = useRelationshipStore();

    // 추정치 계산: 기본 2.5MB + 인맥당 0.1MB (진단 데이터 포함)
    const estimatedSize = (2.5 + (relationships.length * 0.1)).toFixed(1);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const breatheAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulse Ring Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ])
        ).start();

        // Breathing Orb Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>데이터 관리</Text>
            <View style={{ width: 44 }} />
        </View>
    );

    const StatCard = ({ icon: Icon, label, value, subLabel }: any) => (
        <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <View style={styles.statHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon size={18} color={colors.primary} />
                    <Text style={[styles.statLabel, { color: colors.gray[500] }]}>{label}</Text>
                </View>
                {subLabel && <Info size={14} color={colors.gray[400]} />}
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
            {subLabel && <Text style={[styles.statSubLabel, { color: colors.gray[400] }]}>{subLabel}</Text>}
        </View>
    );

    const MenuButton = ({ icon: Icon, title, subtitle }: any) => (
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: colors.white }]}>
            <View style={styles.menuLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: colors.primary + '08' }]}>
                    <Icon size={20} color={colors.primary} />
                </View>
                <View>
                    <Text style={[styles.menuTitle, { color: colors.primary }]}>{title}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.gray[500] }]}>{subtitle}</Text>
                </View>
            </View>
            <ChevronRight size={20} color={colors.gray[300]} />
        </TouchableOpacity>
    );

    return (
        <HubLayout header={renderHeader()} scrollable>
            <View style={styles.container}>

                {/* Visual Status Area */}
                <View style={styles.heroSection}>
                    <Animated.View style={[
                        styles.pulseRing,
                        {
                            borderColor: colors.primary + '10',
                            transform: [{ scale: pulseAnim }]
                        }
                    ]} />
                    <View style={[styles.pulseRingInner, { borderColor: colors.primary + '15' }]} />

                    <Animated.View style={[
                        styles.orbContainer,
                        {
                            backgroundColor: colors.white,
                            transform: [{ scale: breatheAnim }],
                            shadowColor: colors.primary,
                        }
                    ]}>
                        <ShieldCheck size={48} color={colors.primary} strokeWidth={1.5} />
                        <View style={styles.onlineStatus} />
                    </Animated.View>

                    <View style={styles.statusTextContainer}>
                        <Text style={[styles.statusTitle, { color: colors.primary }]}>시스템 상태: 안전</Text>
                        <Text style={[styles.statusDesc, { color: colors.gray[500] }]}>당신의 기록이 소중하게 보호되고 있습니다.</Text>
                        <Text style={[styles.lastSync, { color: colors.primary + '80' }]}>마지막 동기화: 2분 전</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon={Database}
                        label="저장 공간"
                        value={`${estimatedSize} MB`}
                        subLabel="*기록 기반 추정치"
                    />
                    <StatCard icon={Heart} label="인맥 수" value={relationships.length.toLocaleString()} />
                </View>

                {/* Primary Actions */}
                <View style={styles.actionSection}>
                    <TouchableOpacity style={[styles.syncButton, { backgroundColor: colors.primary }]}>
                        <RefreshCw size={20} color={colors.white} />
                        <Text style={styles.syncButtonText}>지금 클라우드에 백업</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.pdfButton, { borderColor: colors.accent + '30', backgroundColor: colors.white }]}>
                        <View style={[styles.pdfIconCircle, { backgroundColor: colors.accent + '15' }]}>
                            <FileText size={18} color={colors.accent} />
                        </View>
                        <Text style={[styles.pdfButtonText, { color: colors.accent }]}>리포트 PDF 파일로 저장</Text>
                        <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
                            <Text style={styles.premiumText}>프리미엄 전용</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Settings Menu */}
                <View style={[styles.menuSection, { backgroundColor: colors.white }]}>
                    <MenuButton
                        icon={HardDrive}
                        title="저장 데이터 최적화"
                        subtitle="캐시 및 오래된 로그 정리"
                    />
                    <View style={styles.divider} />
                    <MenuButton
                        icon={LockIcon}
                        title="보안 및 암호화 설정"
                        subtitle="생체 인증 및 보안키 관리"
                    />
                    <View style={styles.divider} />
                    <MenuButton
                        icon={History}
                        title="백업 기록/복원"
                        subtitle="이전 복원 지점 확인 및 데이터 불러오기"
                    />
                </View>

                <View style={{ height: 60 }} />
            </View>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingVertical: 60,
        position: 'relative',
    },
    pulseRing: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        borderWidth: 1,
        top: 0, // Adjusted to center
    },
    pulseRingInner: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1,
        top: 30, // Adjusted to center
    },
    orbContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        zIndex: 10,
        marginBottom: 24,
    },
    onlineStatus: {
        position: 'absolute',
        top: 15,
        right: 25,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: 'white',
    },
    statusTextContainer: {
        alignItems: 'center',
        zIndex: 10,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    statusDesc: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.8,
    },
    lastSync: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    statSubLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 4,
    },

    // Action Section
    actionSection: {
        gap: 12,
        marginBottom: 24,
    },
    syncButton: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 4,
        shadowColor: '#4b5d4f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    syncButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    pdfButton: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderWidth: 2,
    },
    pdfIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pdfButtonText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '800',
        paddingRight: 40,
    },
    premiumBadge: {
        position: 'absolute',
        right: 16,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    premiumText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '900',
    },

    // Menu Section
    menuSection: {
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
        elevation: 3,
        shadowColor: '#4b5d4f',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    menuSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
        opacity: 0.7,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.03)',
        marginHorizontal: 20,
    },
});
