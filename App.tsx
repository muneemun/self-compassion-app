import * as React from 'react';
import { useState, useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ColorLockProvider } from './src/theme/ColorLockContext';
import { MainOrbitMap } from './src/features/map/MainOrbitMap';
import { RelationshipList } from './src/features/relationships/RelationshipList';
import { SosRxCenter } from './src/features/prescription/SosRxCenter';
import { RelationshipDiagnosis } from './src/features/diagnosis/RelationshipDiagnosis';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { RelationshipEntry } from './src/features/relationships/RelationshipEntry';
import { RelationshipDetail } from './src/features/relationships/RelationshipDetail';
import { RelationshipReport } from './src/features/relationships/RelationshipReport';
import { RelationshipProfile } from './src/features/relationships/RelationshipProfile';
import { EgoReflectionDashboard } from './src/features/analysis/EgoReflectionDashboard';
import { RelationshipTuningDashboard } from './src/features/analysis/RelationshipTuningDashboard';
import { SelfHealthReport } from './src/features/analysis/SelfHealthReport';
import { RelationshipLogModal } from './src/features/relationships/RelationshipLogModal';
import { useAppStore } from './src/store/useAppStore';
import { useRelationshipStore } from './src/store/useRelationshipStore';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { DataManagementScreen } from './src/features/settings/DataManagementScreen';
import { ProfileEditScreen } from './src/features/settings/ProfileEditScreen';
import { ReminderSettingsScreen } from './src/features/settings/ReminderSettingsScreen';
import { NotificationSettingsScreen } from './src/features/settings/NotificationSettingsScreen';
import { SelfTimeCheckInModal } from './src/features/selfcare/SelfTimeCheckInModal';
import { LabMapScreen } from './src/features/map/LabMapScreen';
import { Orbit, SlidersHorizontal, Activity, Rocket, FlaskConical } from 'lucide-react-native';
import Svg, { Circle as SvgCircle, Path as SvgPath, G as SvgG } from 'react-native-svg';

const PlanetIcon = ({ color, size }: { color: string, size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <SvgCircle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
    <SvgPath
      d="M4 14C4 14 6 11 12 11C18 11 20 14 20 14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      transform="rotate(-15 12 12)"
    />
    <SvgPath
      d="M4 14C4 14 6 17 12 17C18 17 20 14 20 14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      transform="rotate(-15 12 12)"
      opacity="0.5"
    />
  </Svg>
);

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'insight' | 'tuning' | 'space' | 'sos' | 'health' | 'lab'>('map');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisMode, setDiagnosisMode] = useState<"ZONE" | "RQS">("ZONE");
  const [isManagingProfile, setIsManagingProfile] = useState(false);
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [isViewingSelfReport, setIsViewingSelfReport] = useState(false);
  const [isViewingDataManagement, setIsViewingDataManagement] = useState(false);
  const [isViewingProfileEdit, setIsViewingProfileEdit] = useState(false);
  const [isViewingReminders, setIsViewingReminders] = useState(false);
  const [isViewingNotifications, setIsViewingNotifications] = useState(false);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [pendingRelationship, setPendingRelationship] = useState<{
    name: string;
    type: string;
    role: string;
    phoneNumber?: string;
    image?: string;
  } | null>(null);
  const [autoOpenLog, setAutoOpenLog] = useState(false);
  // 온보딩 직후 최초 인맥 추가 유도 (1회만)
  const [initialSetupDone, setInitialSetupDone] = useState(false);
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useAppStore(state => state.setHasCompletedOnboarding);
  // ✅ Reactive subscription — NOT getState() snapshot
  const relationships = useRelationshipStore(state => state.relationships);
  const { addRelationship, updateDiagnosisResult } = useRelationshipStore();

  // [DEV] 강제 데이터 초기화
  useEffect(() => {
    // 🛡️ [Emergency Fix] Safety Hydration Timeout (Max 3s)
    const safetyTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn("Hydration Safety Timeout Triggered!");
        setIsInitialized(true);
      }
    }, 3000);

    const interval = setInterval(() => {
      // @ts-ignore - persist is added via middleware
      if (useRelationshipStore.persist?.hasHydrated()) {
        setIsInitialized(true);
        clearInterval(interval);
        clearTimeout(safetyTimeout);
      }
    }, 100);

    return () => {
      clearTimeout(safetyTimeout);
      clearInterval(interval);
    };
  }, []);

  // 온보딩 완료 직후 relationships가 0명이면 1회만 자동으로 인맥 추가 화면 표시
  useEffect(() => {
    if (hasCompletedOnboarding && relationships.length === 0 && !initialSetupDone) {
      setIsAddingRelationship(true);
      setInitialSetupDone(true);
    }
  }, [hasCompletedOnboarding]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F4', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#4A5D4E', fontSize: 16, fontWeight: '600' }}>데이터를 안전하게 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ColorLockProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />

          {!hasCompletedOnboarding ? (
            <OnboardingScreen />
          ) : (
            <View style={styles.contentContainer}>
              {/* Removed isViewingSelfReport check */
                selectedNodeId ? (
                  isDiagnosing ? (
                    <RelationshipDiagnosis
                      mode={diagnosisMode}
                      relationshipId={selectedNodeId}
                      pendingData={pendingRelationship ? {
                        name: pendingRelationship.name,
                        image: pendingRelationship.image
                      } : undefined}
                      onBack={() => {
                        setIsDiagnosing(false);
                        // 진단 중단 시 pending 데이터 삭제
                        if (pendingRelationship) {
                          setPendingRelationship(null);
                          setSelectedNodeId(null);
                        }
                      }}
                      onViewReport={() => setIsViewingReport(true)}
                      onComplete={(result) => {
                        // 진단 완료 시 실제 프로필 추가 후 → 맵으로 복귀
                        if (pendingRelationship) {
                          const newId = addRelationship(
                            pendingRelationship.name,
                            pendingRelationship.type as any,
                            pendingRelationship.role,
                            pendingRelationship.phoneNumber,
                            pendingRelationship.image
                          );

                          if (result) {
                            updateDiagnosisResult(newId, {
                              ...result,
                              event: '초기 진단 완료'
                            });
                          }

                          // ✅ 흰 화면 방지: 모든 임시 상태를 초기화하고 맵으로 복귀
                          setPendingRelationship(null);
                          setSelectedNodeId(null);
                          setIsDiagnosing(false);
                          setIsAddingRelationship(false);
                        }
                      }}
                    />
                  ) : isManagingProfile ? (
                    <RelationshipProfile
                      relationshipId={selectedNodeId}
                      onBack={() => setIsManagingProfile(false)}
                      onDelete={() => {
                        setIsManagingProfile(false);
                        setSelectedNodeId(null);
                      }}
                    />
                  ) : isViewingReport ? (
                    <RelationshipReport
                      relationshipId={selectedNodeId}
                      onBack={() => setIsViewingReport(false)}
                    />
                  ) : (
                    <RelationshipDetail
                      relationshipId={selectedNodeId}
                      onBack={() => {
                        setSelectedNodeId(null);
                        setAutoOpenLog(false);
                      }}
                      onDiagnose={(mode) => {
                        setDiagnosisMode(mode);
                        setIsDiagnosing(true);
                      }}
                      onManageProfile={() => setIsManagingProfile(true)}
                      onViewReport={() => setIsViewingReport(true)}
                      autoOpenLog={autoOpenLog}
                    />
                  )
                ) : isAddingRelationship ? (
                  <RelationshipEntry
                    onBack={() => {
                        setIsAddingRelationship(false);
                        setInitialSetupDone(true); // 취소해도 맵으로 이동 허용
                    }}
                    onComplete={(data) => {
                      setPendingRelationship(data);
                      // 임시 ID로 진단 시작
                      setSelectedNodeId('temp-' + Date.now());
                      setDiagnosisMode('ZONE'); // Force ZONE diagnosis for new relationships
                      setIsAddingRelationship(false);
                      setInitialSetupDone(true);
                      setIsDiagnosing(true);
                    }}
                  />
                ) : isViewingDataManagement ? (
                  <DataManagementScreen onBack={() => setIsViewingDataManagement(false)} />
                ) : isViewingProfileEdit ? (
                  <ProfileEditScreen onBack={() => setIsViewingProfileEdit(false)} />
                ) : isViewingReminders ? (
                  <ReminderSettingsScreen onBack={() => setIsViewingReminders(false)} />
                ) : isViewingNotifications ? (
                  <NotificationSettingsScreen onBack={() => setIsViewingNotifications(false)} />
                ) : (
                  <>
                    <View style={styles.tabView}>
                      <View style={activeTab === 'map' ? styles.tabActive : styles.tabHidden}>
                        <MainOrbitMap
                          onSelectNode={(id: string) => setSelectedNodeId(id)}
                          onPressAdd={() => setIsAddingRelationship(true)}
                          onDiagnose={(id, mode) => {
                            setSelectedNodeId(id);
                            setDiagnosisMode(mode);
                            setIsDiagnosing(true);
                          }}
                          onRecordLog={(id) => {
                            setSelectedNodeId(id);
                            setAutoOpenLog(true);
                          }}
                        />
                      </View>
                      <View style={activeTab === 'insight' ? styles.tabActive : styles.tabHidden}>
                        <EgoReflectionDashboard
                          onBack={() => setActiveTab('tuning')}
                        />
                      </View>
                      <View style={activeTab === 'tuning' ? styles.tabActive : styles.tabHidden}>
                        <RelationshipTuningDashboard
                          onBack={() => setActiveTab('map')}
                          onGoToReport={() => setActiveTab('insight')}
                          onSelectNode={(id) => {
                            setSelectedNodeId(id);
                            setIsViewingReport(false);
                            setIsDiagnosing(false);
                            setIsManagingProfile(false);
                          }}
                        />
                      </View>
                      <View style={activeTab === 'space' ? styles.tabActive : styles.tabHidden}>
                        <SettingsScreen
                          onBack={() => setActiveTab('map')}
                          onNavigateToDataManagement={() => setIsViewingDataManagement(true)}
                          onNavigateToProfileEdit={() => setIsViewingProfileEdit(true)}
                          onNavigateToReminders={() => setIsViewingReminders(true)}
                          onNavigateToNotifications={() => setIsViewingNotifications(true)}
                        />
                      </View>
                      <View style={activeTab === 'sos' ? styles.tabActive : styles.tabHidden}>
                        <SosRxCenter
                          onBack={() => setActiveTab('map')}
                        />
                      </View>
                      <View style={activeTab === 'health' ? styles.tabActive : styles.tabHidden}>
                        <SelfHealthReport
                          onBack={() => setActiveTab('map')}
                          onSelectRelationship={(id) => {
                            setSelectedNodeId(id);
                          }}
                        />
                      </View>
                      <View style={activeTab === 'lab' ? styles.tabActive : styles.tabHidden}>
                        <LabMapScreen />
                      </View>
                    </View>

                    {/* Floating Bottom Navigation */}
                    <View style={styles.navWrapper}>
                      <View style={styles.navContainer}>
                        <TouchableOpacity
                          style={styles.navItem}
                          onPress={() => setActiveTab('map')}
                        >
                          <View style={styles.iconWrapper}>
                            {activeTab === 'map' && <View style={styles.activeIconBg} />}
                            <PlanetIcon color={activeTab === 'map' ? '#4A5D4E' : '#9E9E9E'} size={24} />
                          </View>
                          <Text style={[styles.navText, activeTab === 'map' && styles.activeNavText]}>Orbit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.navItem}
                          onPress={() => setActiveTab('tuning')}
                        >
                          <View style={styles.iconWrapper}>
                            {activeTab === 'tuning' && <View style={styles.activeIconBg} />}
                            <SlidersHorizontal size={22} color={activeTab === 'tuning' ? '#4A5D4E' : '#9E9E9E'} strokeWidth={activeTab === 'tuning' ? 2.5 : 2} />
                          </View>
                          <Text style={[styles.navText, activeTab === 'tuning' && styles.activeNavText]}>Tuning</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.navItem}
                          onPress={() => setActiveTab('health')}
                        >
                          <View style={styles.iconWrapper}>
                            {activeTab === 'health' && <View style={styles.activeIconBg} />}
                            <Activity size={22} color={activeTab === 'health' ? '#4A5D4E' : '#9E9E9E'} strokeWidth={activeTab === 'health' ? 2.5 : 2} />
                          </View>
                          <Text style={[styles.navText, activeTab === 'health' && styles.activeNavText]}>Health</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.navItem}
                          onPress={() => setActiveTab('lab')}
                        >
                          <View style={styles.iconWrapper}>
                            {activeTab === 'lab' && <View style={styles.activeIconBg} />}
                            <FlaskConical size={22} color={activeTab === 'lab' ? '#4A5D4E' : '#9E9E9E'} strokeWidth={activeTab === 'lab' ? 2.5 : 2} />
                          </View>
                          <Text style={[styles.navText, activeTab === 'lab' && styles.activeNavText]}>Lab</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.navItem}
                          onPress={() => setActiveTab('space')}
                        >
                          <View style={styles.iconWrapper}>
                            {activeTab === 'space' && <View style={styles.activeIconBg} />}
                            <Rocket size={22} color={activeTab === 'space' ? '#4A5D4E' : '#9E9E9E'} strokeWidth={activeTab === 'space' ? 2.5 : 2} />
                          </View>
                          <Text style={[styles.navText, activeTab === 'space' && styles.activeNavText]}>Space</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Bottom System UI Safe Guard Layer */}
                    <LinearGradient
                      colors={['transparent', 'rgba(252, 249, 242, 0.8)', '#FCF9F2']}
                      style={styles.navBottomGuard}
                      pointerEvents="none"
                    />
                  </>
                )}
            </View>
          )}
          <SelfTimeCheckInModal />
          <RelationshipLogModal />
        </View>
      </ColorLockProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FCF9F2',
  },
  contentContainer: {
    flex: 1,
  },
  tabView: {
    flex: 1,
  },
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 50, // 갤럭시 S23 등 안드로이드 시스템 UI 대응을 위해 여백 추가
    zIndex: 1000,
  },
  navBottomGuard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 900, // 네비게이션(1000)보다 아래, 콘텐츠보다 위
  },
  navContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 249, 242, 0.95)',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 12,
    // Premium Shadow
    shadowColor: '#4A5D4E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 93, 78, 0.08)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconBg: {
    position: 'absolute',
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 93, 78, 0.12)',
  },
  navText: {
    color: '#9E9E9E',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: -0.2,
  },
  activeNavText: {
    color: '#4A5D4E',
    fontWeight: '800',
  },
  tabActive: {
    flex: 1,
  },
  tabHidden: {
    display: 'none',
  },
});

registerRootComponent(App);
