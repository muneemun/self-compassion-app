import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import {
    User, Lock, Link, Bell, Moon, Globe, ShieldCheck, Database, FileText,
    Clock, Sparkles, PenTool, HelpCircle, Headphones, Info, ChevronRight, ChevronLeft
} from 'lucide-react-native';
import { useColors } from '../../theme/ColorLockContext';
import { HubLayout } from '../../layouts/BaseLayout';

/**
 * MT-14: Integrated Settings Space (The Vault) -> 설정
 */
export const SettingsScreen = ({ onBack }: { onBack: () => void }) => {
    const colors = useColors();

    // Toggle State for Mindfulness Mode
    const [isMindfulnessEnabled, setIsMindfulnessEnabled] = useState(true);

    const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gray[500] }]}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    const SettingItem = ({ icon: Icon, title, showToggle = false, isLast = false, onToggle }: any) => (
        <>
            <TouchableOpacity style={styles.itemContainer} disabled={showToggle}>
                <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#F0F2EF' }]}>
                        <Icon size={22} color={colors.primary} />
                    </View>
                    <Text style={[styles.itemTitle, { color: colors.primary }]}>{title}</Text>
                </View>
                <View style={styles.itemRight}>
                    {showToggle ? (
                        <Switch
                            trackColor={{ false: "#E0E0E0", true: colors.primary }}
                            thumbColor={"#FFFFFF"}
                            ios_backgroundColor="#E0E0E0"
                            onValueChange={onToggle}
                            value={isMindfulnessEnabled}
                        />
                    ) : (
                        <ChevronRight size={20} color={colors.gray[500] + '80'} />
                    )}
                </View>
            </TouchableOpacity>
            {!isLast && <View style={styles.divider} />}
        </>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>
                Space
            </Text>
            <View style={{ width: 44 }} />
        </View>
    );

    return (
        <HubLayout header={renderHeader()} scrollable>
            <View style={styles.container}>
                <Text style={[styles.pageTitle, { color: colors.primary }]}>설정</Text>

                {/* Account Section */}
                <SettingSection title="계정 관리">
                    <SettingItem icon={User} title="프로필 정보" />
                    <SettingItem icon={Lock} title="비밀번호 및 보안" />
                    <SettingItem icon={Link} title="연결된 계정" isLast />
                </SettingSection>

                {/* App Settings Section */}
                <SettingSection title="앱 설정">
                    <SettingItem icon={Bell} title="알림 설정" />
                    <SettingItem icon={Moon} title="테마 및 화면" />
                    <SettingItem icon={Globe} title="언어" isLast />
                </SettingSection>

                {/* Privacy & Data Section */}
                <SettingSection title="개인정보 및 데이터">
                    <SettingItem icon={ShieldCheck} title="데이터 암호화" />
                    <SettingItem icon={Database} title="데이터 관리" />
                    <SettingItem icon={FileText} title="개인정보 처리방침" isLast />
                </SettingSection>

                {/* Wellness Section */}
                <SettingSection title="도구">
                    <SettingItem icon={Clock} title="리마인더 설정" />
                    <SettingItem
                        icon={Sparkles}
                        title="집중 모드"
                        showToggle={true}
                        onToggle={(v: boolean) => setIsMindfulnessEnabled(v)}
                    />
                    <SettingItem icon={PenTool} title="기록 도우미" isLast />
                </SettingSection>

                {/* Support Section */}
                <SettingSection title="고객 지원">
                    <SettingItem icon={HelpCircle} title="도움말 및 FAQ" />
                    <SettingItem icon={Headphones} title="문의하기" />
                    <SettingItem icon={Info} title="앱 정보" isLast />
                </SettingSection>

                <View style={{ height: 100 }} />
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
        letterSpacing: -0.5,
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
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 20,
    },
    section: {
        marginBottom: 32,
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
    sectionContent: {
        backgroundColor: '#FFFFFF', // colors.white (완전 불투명)
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#4A5D4E', // 녹색 그림자
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(74, 93, 78, 0.05)',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 16,
    },
});
