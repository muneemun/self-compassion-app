import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Switch, ScrollView, Platform
} from 'react-native';
import {
    ChevronLeft, Bell, BarChart3, Activity,
    Info, Megaphone, Orbit, Heart
} from 'lucide-react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';

interface NotificationSettingsScreenProps {
    onBack: () => void;
}

export const NotificationSettingsScreen = ({ onBack }: NotificationSettingsScreenProps) => {
    const colors = useColors();

    const [isSelfReportEnabled, setIsSelfReportEnabled] = useState(true);
    const [isOrbitReportEnabled, setIsOrbitReportEnabled] = useState(true);
    const [isNoticeEnabled, setIsNoticeEnabled] = useState(false);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>알림 설정</Text>
            <View style={{ width: 44 }} />
        </View>
    );

    const SettingsCard = ({ title, icon: Icon, description, isEnabled, onToggle, tags }: any) => (
        <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '08' }]}>
                        <Icon size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.primary }]}>{title}</Text>
                        <Text style={[styles.cardDesc, { color: colors.gray[500] }]}>{description}</Text>
                        {tags && (
                            <View style={styles.tagRow}>
                                {tags.map((tag: string) => (
                                    <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '08' }]}>
                                        <Text style={[styles.tagText, { color: colors.primary + '80' }]}>#{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
                <Switch
                    value={isEnabled}
                    onValueChange={onToggle}
                    trackColor={{ false: '#E0E0E0', true: colors.accent }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                />
            </View>
        </View>
    );

    return (
        <HubLayout header={renderHeader()} scrollable>
            <ScrollView contentContainerStyle={styles.container}>

                <Text style={[styles.sectionTitle, { color: colors.gray[500] }]}>분석 리포트</Text>
                <SettingsCard
                    title="개인 건강 리포트"
                    description="지난주 마음 날씨가 분석되었습니다. 어느 시점에 가장 평온했는지 성찰 리포트를 보내드립니다."
                    icon={Heart}
                    isEnabled={isSelfReportEnabled}
                    onToggle={setIsSelfReportEnabled}
                    tags={['감정온도', '안정지수', 'AI처방']}
                />

                <View style={{ height: 16 }} />

                <SettingsCard
                    title="관계 균형 상세 리포트"
                    description="소셜 우주의 새로운 균형점이 발견되었습니다. 당신에게 소중한 궤도 변화를 리포트로 전달합니다."
                    icon={Orbit}
                    isEnabled={isOrbitReportEnabled}
                    onToggle={setIsOrbitReportEnabled}
                    tags={['궤도변화', '에너지비율', '관계밀도']}
                />

                <Text style={[styles.sectionTitle, { color: colors.gray[500], marginTop: 32 }]}>서비스 알림</Text>
                <SettingsCard
                    title="공지사항 및 업데이트"
                    description="새로운 기능 소식과 성찰 가이드 업데이트를 전해드립니다."
                    icon={Megaphone}
                    isEnabled={isNoticeEnabled}
                    onToggle={setIsNoticeEnabled}
                />

                {/* Brand Philosophy Footer */}
                <View style={styles.brandFooter}>
                    <View style={[styles.infoBox, { backgroundColor: colors.primary + '05' }]}>
                        <Info size={16} color={colors.primary + '60'} />
                        <Text style={[styles.infoText, { color: colors.primary + '80' }]}>
                            불필요한 알림을 최소화하여{"\n"}당신의 고요한 관찰 시간을 존중합니다.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
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
    },
    container: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
        marginBottom: 12,
        opacity: 0.8,
    },
    cardSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
        ...Platform.select({
            ios: {
                shadowColor: '#4A5D4E',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.08,
                shadowRadius: 20,
            },
            android: {
                elevation: 5,
            }
        })
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 18,
        marginBottom: 8,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    brandFooter: {
        marginTop: 40,
        alignItems: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 24,
        gap: 12,
        width: '100%',
    },
    infoText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 20,
    }
});
