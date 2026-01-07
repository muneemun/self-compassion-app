import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Switch, ScrollView, Platform, Modal, Pressable
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import {
    ChevronLeft, Clock, Calendar, CheckCircle,
    Zap, Sparkles, RefreshCcw, Info, Orbit
} from 'lucide-react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { useAppStore } from '../../store/useAppStore';

interface ReminderSettingsScreenProps {
    onBack: () => void;
}

type TuningPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const ReminderSettingsScreen = ({ onBack }: ReminderSettingsScreenProps) => {
    const colors = useColors();
    const { userProfile } = useAppStore();
    const hasBirthday = !!userProfile?.birthday;

    // Wellness State
    const [isDailyEnabled, setIsDailyEnabled] = useState(true);
    const [dailyTime, setDailyTime] = useState(new Date(new Date().setHours(22, 0, 0, 0)));
    const [showDailyPicker, setShowDailyPicker] = useState(false);

    // Tuning State
    const [isTuningEnabled, setIsTuningEnabled] = useState(true);
    const [tuningPeriod, setTuningPeriod] = useState<TuningPeriod>('weekly');
    const [tuningAnchor, setTuningAnchor] = useState('일요일'); // '일요일', '매월 말일', etc.
    const [tuningTime, setTuningTime] = useState(new Date(new Date().setHours(21, 0, 0, 0)));
    const [showTuningPicker, setShowTuningPicker] = useState(false);
    const [showAnchorPicker, setShowAnchorPicker] = useState(false);

    const ANCHOR_OPTIONS: Record<TuningPeriod, string[]> = {
        weekly: ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'],
        monthly: ['매월 1일', '매월 말일', '마지막 일요일'],
        quarterly: ['분기 시작일', '분기 종료일'],
        yearly: ['1월 1일 (새해)', '12월 31일 (연말)', '내 생일']
    };

    // 주기가 바뀔 때 기본 앵커 설정
    const handlePeriodChange = (p: TuningPeriod) => {
        setTuningPeriod(p);
        setTuningAnchor(ANCHOR_OPTIONS[p][ANCHOR_OPTIONS[p].length - 1]); // 추천(마지막 항목) 기본 선택
    };

    const getNextDatePreview = () => {
        const now = new Date();
        if (tuningPeriod === 'weekly') {
            return `다음 점검 예정: 이번 주 ${tuningAnchor} ${formatTime(tuningTime)}`;
        }
        if (tuningPeriod === 'monthly') {
            return `다음 점검 예정: ${tuningAnchor} ${formatTime(tuningTime)}`;
        }
        return `다음 점검 예정: ${tuningAnchor} 자정`;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const PERIOD_INFO = {
        weekly: {
            title: '주 단위',
            desc: '일상의 소소한 감정 사건을 정리하고,\n인맥 궤도를 미세하게 조정합니다.',
            icon: RefreshCcw
        },
        monthly: {
            title: '월 단위',
            desc: '한 달간의 감정 추세를 분석하여,\n관계에서의 내 역할을 재검토합니다.',
            icon: Zap
        },
        quarterly: {
            title: '분기 단위',
            desc: '시즌별 내면의 성장을 확인하고,\n에너지를 주는 관계를 선순환시킵니다.',
            icon: Sparkles
        },
        yearly: {
            title: '연 단위',
            desc: '삶의 가치관 변화에 맞춰,\n인간관계의 근본 우주관을 재정립합니다.',
            icon: Orbit
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>리마인더 설정</Text>
            <View style={{ width: 44 }} />
        </View>
    );

    const SettingsCard = ({ title, icon: Icon, description, children, isEnabled, onToggle, tags }: any) => (
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

            {isEnabled && (
                <View style={[styles.cardBody, { borderTopColor: colors.gray[100] }]}>
                    {children}
                </View>
            )}
        </View>
    );

    return (
        <HubLayout header={renderHeader()} scrollable>
            <ScrollView contentContainerStyle={styles.container}>

                {/* Section 1: Wellness */}
                <Text style={[styles.sectionTitle, { color: colors.gray[500] }]}>개인 관리</Text>
                <SettingsCard
                    title="오늘 기록 리마인더"
                    description="오늘 당신의 감정 온도는 몇 도였나요? 잠시 궤도를 멈추고 기록하도록 조용히 노크합니다."
                    icon={CheckCircle}
                    isEnabled={isDailyEnabled}
                    onToggle={setIsDailyEnabled}
                    tags={['상호작용', '정서개입', '마음흔적']}
                >
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowDailyPicker(true)}
                    >
                        <Text style={[styles.itemLabel, { color: colors.primary }]}>알림 시간</Text>
                        <View style={[styles.pickerBadge, { backgroundColor: colors.primary + '10' }]}>
                            <Text style={[styles.pickerText, { color: colors.primary }]}>{formatTime(dailyTime)}</Text>
                            <Clock size={14} color={colors.primary} />
                        </View>
                    </TouchableOpacity>

                    {showDailyPicker && (
                        <DateTimePicker
                            value={dailyTime}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowDailyPicker(Platform.OS === 'ios');
                                if (selectedDate) setDailyTime(selectedDate);
                            }}
                        />
                    )}
                </SettingsCard>

                {/* Section 2: Tuning Routine */}
                <Text style={[styles.sectionTitle, { color: colors.gray[500], marginTop: 32 }]}>관계 관리</Text>
                <SettingsCard
                    title="정기 궤도 점검"
                    description="행성들의 중력이 변하고 있어요. 관계 지도를 재배치하여 균형을 맞출 시간임을 알려드려요."
                    icon={Orbit}
                    isEnabled={isTuningEnabled}
                    onToggle={setIsTuningEnabled}
                >
                    <View style={styles.periodChoiceContainer}>
                        {(Object.keys(PERIOD_INFO) as TuningPeriod[]).map((p) => {
                            const active = tuningPeriod === p;
                            return (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.periodBtn,
                                        { backgroundColor: active ? colors.primary : colors.white, borderColor: active ? colors.primary : colors.gray[200] }
                                    ]}
                                    onPress={() => handlePeriodChange(p)}
                                >
                                    <Text style={[styles.periodBtnText, { color: active ? colors.white : colors.gray[500] }]}>
                                        {PERIOD_INFO[p].title.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={[styles.guideBox, { backgroundColor: colors.accent + '05' }]}>
                        <View style={styles.guideHeader}>
                            {React.createElement(PERIOD_INFO[tuningPeriod].icon, { size: 16, color: colors.accent })}
                            <Text style={[styles.guideTitle, { color: colors.accent }]}>
                                {PERIOD_INFO[tuningPeriod].title} 가이드
                            </Text>
                        </View>
                        <Text style={[styles.cardDesc, { color: colors.primary + '90' }]}>
                            {PERIOD_INFO[tuningPeriod].desc}
                        </Text>

                        <View style={[styles.previewBadge, { backgroundColor: colors.accent + '15' }]}>
                            <Text style={[styles.previewText, { color: colors.accent }]}>
                                {getNextDatePreview()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.tuningPickers}>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => setShowAnchorPicker(true)}
                        >
                            <Text style={[styles.itemLabel, { color: colors.primary }]}>점검 시점(Anchor)</Text>
                            <View style={[styles.pickerBadge, { backgroundColor: colors.primary + '10' }]}>
                                <Text style={[styles.pickerText, { color: colors.primary }]}>{tuningAnchor}</Text>
                                <Calendar size={14} color={colors.primary} />
                            </View>
                        </TouchableOpacity>

                        {tuningPeriod === 'weekly' || tuningPeriod === 'monthly' ? (
                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => setShowTuningPicker(true)}
                            >
                                <Text style={[styles.itemLabel, { color: colors.primary }]}>점검 시간</Text>
                                <View style={[styles.pickerBadge, { backgroundColor: colors.primary + '10' }]}>
                                    <Text style={[styles.pickerText, { color: colors.primary }]}>{formatTime(tuningTime)}</Text>
                                    <Clock size={14} color={colors.primary} />
                                </View>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {showTuningPicker && (
                        <DateTimePicker
                            value={tuningTime}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowTuningPicker(Platform.OS === 'ios');
                                if (selectedDate) setTuningTime(selectedDate);
                            }}
                        />
                    )}
                </SettingsCard>

                {/* Anchor Picker Modal */}
                <Modal
                    visible={showAnchorPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowAnchorPicker(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowAnchorPicker(false)}
                    >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
                            <Text style={[styles.modalTitle, { color: colors.primary }]}>점검 시점 선택</Text>
                            <View style={styles.dayGrid}>
                                {ANCHOR_OPTIONS[tuningPeriod].map((anchor) => {
                                    const isBirthdayOption = anchor === '내 생일';
                                    const disabled = isBirthdayOption && !hasBirthday;

                                    return (
                                        <TouchableOpacity
                                            key={anchor}
                                            disabled={disabled}
                                            style={[
                                                styles.dayItem,
                                                tuningAnchor === anchor && { backgroundColor: colors.accent },
                                                disabled && { opacity: 0.3, borderColor: colors.gray[200] }
                                            ]}
                                            onPress={() => {
                                                setTuningAnchor(anchor);
                                                setShowAnchorPicker(false);
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Text style={[
                                                    styles.dayItemText,
                                                    { color: tuningAnchor === anchor ? colors.white : colors.primary }
                                                ]}>
                                                    {isBirthdayOption && !hasBirthday ? '내 생일 (정보 없음)' : anchor}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </Pressable>
                </Modal>

                {/* Info Note */}
                <View style={styles.infoNote}>
                    <Info size={16} color={colors.gray[400]} />
                    <Text style={[styles.infoNoteText, { color: colors.gray[400] }]}>
                        주기가 길어질수록 AI가 더 깊이 있는 질문을 던집니다.
                    </Text>
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
        marginBottom: 2,
    },
    cardBody: {
        borderTopWidth: 1,
        padding: 16,
        paddingTop: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    itemLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    pickerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    pickerText: {
        fontSize: 14,
        fontWeight: '800',
    },
    periodChoiceContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    periodBtn: {
        flex: 1,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    periodBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    guideBox: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 8,
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    guideTitle: {
        fontSize: 13,
        fontWeight: '800',
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
    previewBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    previewText: {
        fontSize: 12,
        fontWeight: '800',
    },
    tuningPickers: {
        marginTop: 12,
        gap: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
        textAlign: 'center',
    },
    dayGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    dayItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.1)',
        minWidth: '28%',
        alignItems: 'center',
    },
    dayItemText: {
        fontSize: 14,
        fontWeight: '700',
    },
    infoNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 24,
    },
    infoNoteText: {
        fontSize: 12,
        fontWeight: '600',
    }
});
