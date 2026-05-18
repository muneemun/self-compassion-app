import * as React from 'react';
import { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, BackHandler, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Orbit, SlidersHorizontal, Activity, Rocket, FlaskConical } from 'lucide-react-native';

import { ColorLockProvider } from './src/theme/ColorLockContext';
import { COMMON_STYLES } from './src/theme/LayoutStyles';
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
import { InteractionHistoryScreen } from './src/features/relationships/InteractionHistoryScreen';
import { ZoomableRelationshipMap } from './src/features/analysis/ZoomableRelationshipMap';
import { useAppStore } from './src/store/useAppStore';
import { useRelationshipStore } from './src/store/useRelationshipStore';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { DataManagementScreen } from './src/features/settings/DataManagementScreen';
import { ProfileEditScreen } from './src/features/settings/ProfileEditScreen';
import { ReminderSettingsScreen } from './src/features/settings/ReminderSettingsScreen';
import { NotificationSettingsScreen } from './src/features/settings/NotificationSettingsScreen';
import { SelfTimeCheckInModal } from './src/features/selfcare/SelfTimeCheckInModal';
import { NotificationManager } from './src/components/NotificationManager';
import { TestOrbitMap } from './src/features/map/TestOrbitMap';

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
  const activeTab = useAppStore(state => state.activeTab);
  const setActiveTab = useAppStore(state => state.setActiveTab);
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
  const [isViewingInteractionHistory, setIsViewingInteractionHistory] = useState(false);
  const [historyDateRange, setHistoryDateRange] = useState<{start: Date, end: Date} | null>(null);
  const [isViewingDetailedMap, setIsViewingDetailedMap] = useState(false);
  const [detailedMapDateRange, setDetailedMapDateRange] = useState<{start: Date, end: Date} | null>(null);
  const [enteredFromDetailedMap, setEnteredFromDetailedMap] = useState(false);
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
  const isRelationshipLogModalOpen = useAppStore(state => state.isRelationshipLogModalOpen);
  const setRelationshipLogModalOpen = useAppStore(state => state.setRelationshipLogModalOpen);
  // ✅ Reactive subscription — NOT getState() snapshot
  const relationships = useRelationshipStore(state => state.relationships);
  const { addRelationship, updateAnalysisResult, orbitMapViewState, setOrbitMapViewState } = useRelationshipStore();

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

  // Android Back Button Handler
  useEffect(() => {
    const handleBackPress = () => {
      // If a modal/detail screen is open, close it
      if (isRelationshipLogModalOpen) { setRelationshipLogModalOpen(false); return true; }
      if (isDiagnosing) { setIsDiagnosing(false); setPendingRelationship(null); setSelectedNodeId(null); return true; }
      if (isManagingProfile) { setIsManagingProfile(false); return true; }
      if (isViewingReport) { setIsViewingReport(false); return true; }
      if (isViewingDetailedMap) { setIsViewingDetailedMap(false); return true; }
      if (isViewingInteractionHistory) { setIsViewingInteractionHistory(false); return true; }
      if (isViewingDataManagement) { setIsViewingDataManagement(false); return true; }
      if (isViewingProfileEdit) { setIsViewingProfileEdit(false); return true; }
      if (isViewingReminders) { setIsViewingReminders(false); return true; }
      if (isViewingNotifications) { setIsViewingNotifications(false); return true; }
      if (isAddingRelationship) { setIsAddingRelationship(false); return true; }
      if (selectedNodeId) {
        if (enteredFromDetailedMap) {
          setSelectedNodeId(null);
          setIsViewingDetailedMap(true);
          setEnteredFromDetailedMap(false);
        } else {
          setSelectedNodeId(null);
        }
        return true;
      }
      if (orbitMapViewState.viewMode === 'list') { 
        setOrbitMapViewState({ viewMode: 'map' }); 
        return true; 
      }

      // 'insight' 탭(균형 상세 리포트)에서는 'tuning' 탭으로 복귀
      if (activeTab === 'insight') {
        setActiveTab('tuning');
        return true;
      }

      // If we are not on the main 'map' tab, go back to 'map'
      if (activeTab !== 'map') {
        setActiveTab('map');
        return true;
      }

      // If we are on the main 'map' tab, prompt exit
      Alert.alert(
        '앱 종료',
        '앱을 종료하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '종료', onPress: () => BackHandler.exitApp(), style: 'destructive' }
        ]
      );
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [
    isRelationshipLogModalOpen, isDiagnosing, isManagingProfile, isViewingReport, isViewingDetailedMap, 
    isViewingInteractionHistory, isViewingDataManagement, isViewingProfileEdit, 
    isViewingReminders, isViewingNotifications, isAddingRelationship, 
    selectedNodeId, enteredFromDetailedMap, orbitMapViewState.viewMode, activeTab
  ]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationManager />
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
                        if (pendingRelationship) {
                          // 진단 완료 시 실제 프로필 추가 후 → 맵으로 복귀
                          const newId = addRelationship(
                            pendingRelationship.name,
                            pendingRelationship.type as any,
                            pendingRelationship.role,
                            pendingRelationship.phoneNumber,
                            pendingRelationship.image
                          );

                          if (result) {
                            updateAnalysisResult(newId, {
                              ...result,
                              event: '초기 진단 완료'
                            });
                          }

                          // ✅ 흰 화면 방지: 모든 임시 상태를 초기화하고 맵으로 복귀
                          setPendingRelationship(null);
                          setSelectedNodeId(null);
                          setIsDiagnosing(false);
                          setIsAddingRelationship(false);
                        } else if (result?.zone && selectedNodeId) {
                          // ✅ 기존 관계 오빗존 재설정 완료 처리
                          updateAnalysisResult(selectedNodeId, {
                            zone: result.zone,
                            event: '오빗존 재설정'
                          });
                          setIsDiagnosing(false);
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
                        if (enteredFromDetailedMap) {
                          setSelectedNodeId(null);
                          setIsViewingDetailedMap(true);
                          setEnteredFromDetailedMap(false);
                        } else {
                          setSelectedNodeId(null);
                        }
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
                        setInitialSetupDone(true);
                    }}
                    onComplete={(data) => {
                      setPendingRelationship(data);
                      setSelectedNodeId('temp-' + Date.now());
                      setDiagnosisMode('ZONE'); // 궤도 배치 체크리스트만 진행
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
                ) : isViewingInteractionHistory ? (
                  <InteractionHistoryScreen 
                    onBack={() => { setIsViewingInteractionHistory(false); setHistoryDateRange(null); }} 
                    dateRange={historyDateRange}
                  />
                ) : isViewingDetailedMap ? (
                  <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F4' }}>
                    <View style={COMMON_STYLES.headerContainer}>
                      <TouchableOpacity onPress={() => setIsViewingDetailedMap(false)} style={COMMON_STYLES.secondaryActionBtn}>
                        <ArrowLeft size={24} color="#4A5D4E" />
                      </TouchableOpacity>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#4A5D4E' }}>상세 관계 지형도</Text>
                        <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                          {detailedMapDateRange 
                            ? `${detailedMapDateRange.start.getMonth()+1}월 ${detailedMapDateRange.start.getDate()}일 - ${detailedMapDateRange.end.getMonth()+1}월 ${detailedMapDateRange.end.getDate()}일`
                            : "확대/축소하여 상세 분석"}
                        </Text>
                      </View>
                      <View style={{ width: 44 }} />
                    </View>
                    <ZoomableRelationshipMap 
                      dateRange={detailedMapDateRange}
                      onSelectNode={(id) => {
                        setSelectedNodeId(id);
                        setIsViewingDetailedMap(false);
                        setEnteredFromDetailedMap(true);
                      }} 
                    />
                  </SafeAreaView>
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
                          onViewDetailedMap={() => setIsViewingDetailedMap(true)}
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
                          onViewAllHistory={(range) => {
                            setHistoryDateRange(range || null);
                            setIsViewingInteractionHistory(true);
                          }}
                          onSelectRelationship={(id) => {
                            setSelectedNodeId(id);
                          }}
                          onViewDetailedMap={(range) => {
                            setDetailedMapDateRange(range || null);
                            setIsViewingDetailedMap(true);
                          }}
                        />
                      </View>
                      <View style={activeTab === 'test' ? styles.tabActive : styles.tabHidden}>
                        <TestOrbitMap />
                      </View>

                    </View>

                    {/* Floating Bottom Navigation */}
                    <View style={styles.navWrapper}>
                      <View style={styles.navContainer}>
                        <TouchableOpacity
                          style={styles.navItem}
                          onPress={() => {
                            if (activeTab === 'map') {
                              const currentMode = orbitMapViewState.viewMode || 'map';
                              setOrbitMapViewState({ viewMode: currentMode === 'map' ? 'list' : 'map' });
                            } else {
                              setActiveTab('map');
                            }
                          }}
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
                          onPress={() => setActiveTab('test')}
                        >
                          <View style={styles.iconWrapper}>
                            {activeTab === 'test' && <View style={styles.activeIconBg} />}
                            <FlaskConical size={22} color={activeTab === 'test' ? '#4A5D4E' : '#9E9E9E'} strokeWidth={activeTab === 'test' ? 2.5 : 2} />
                          </View>
                          <Text style={[styles.navText, activeTab === 'test' && styles.activeNavText]}>Lab</Text>
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
    </GestureHandlerRootView>
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
