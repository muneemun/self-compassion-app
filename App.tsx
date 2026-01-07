import React, { useState, useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
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
import { useAppStore } from './src/store/useAppStore';
import { useRelationshipStore } from './src/store/useRelationshipStore';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { DataManagementScreen } from './src/features/settings/DataManagementScreen';
import { ProfileEditScreen } from './src/features/settings/ProfileEditScreen';
import { ReminderSettingsScreen } from './src/features/settings/ReminderSettingsScreen';
import { NotificationSettingsScreen } from './src/features/settings/NotificationSettingsScreen';

function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'insight' | 'tuning' | 'space' | 'sos' | 'health'>('map');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisMode, setDiagnosisMode] = useState<"ZONE" | "RQS">("ZONE");
  const [isManagingProfile, setIsManagingProfile] = useState(false);
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [isViewingSelfReport, setIsViewingSelfReport] = useState(false); // Removed temporary flag logic
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
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const { addRelationship, updateDiagnosisResult } = useRelationshipStore();

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
                      onComplete={(result) => {
                        // 진단 완료 시 실제 프로필 추가
                        if (pendingRelationship) {
                          const newId = addRelationship(
                            pendingRelationship.name,
                            pendingRelationship.type as any,
                            pendingRelationship.role,
                            pendingRelationship.phoneNumber,
                            pendingRelationship.image
                          );

                          // 진단 결과가 있으면 업데이트
                          if (result) {
                            updateDiagnosisResult(newId, {
                              ...result,
                              event: '초기 진단 완료'
                            });
                          }

                          setSelectedNodeId(newId);
                          setPendingRelationship(null);
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
                      onBack={() => setSelectedNodeId(null)}
                      onDiagnose={(mode) => {
                        setDiagnosisMode(mode);
                        setIsDiagnosing(true);
                      }}
                      onManageProfile={() => setIsManagingProfile(true)}
                      onViewReport={() => setIsViewingReport(true)}
                    />
                  )
                ) : isAddingRelationship ? (
                  <RelationshipEntry
                    onBack={() => setIsAddingRelationship(false)}
                    onComplete={(data) => {
                      setPendingRelationship(data);
                      // 임시 ID로 진단 시작
                      setSelectedNodeId('temp-' + Date.now());
                      setIsAddingRelationship(false);
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
                          onPressSos={() => setActiveTab('sos')}
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
                        />
                      </View>
                    </View>

                    {/* Bottom Navigation */}
                    <SafeAreaView edges={['bottom']} style={styles.navContainer}>
                      <TouchableOpacity
                        style={[styles.navItem, activeTab === 'map' && styles.activeNavItem]}
                        onPress={() => setActiveTab('map')}
                      >
                        <Text style={[styles.navText, activeTab === 'map' && styles.activeNavText]}>Orbit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.navItem, activeTab === 'tuning' && styles.activeNavItem]}
                        onPress={() => setActiveTab('tuning')}
                      >
                        <Text style={[styles.navText, activeTab === 'tuning' && styles.activeNavText]}>Tuning</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.navItem, activeTab === 'health' && styles.activeNavItem]}
                        onPress={() => setActiveTab('health')}
                      >
                        <Text style={[styles.navText, activeTab === 'health' && styles.activeNavText]}>Health</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.navItem, activeTab === 'space' && styles.activeNavItem]}
                        onPress={() => setActiveTab('space')}
                      >
                        <Text style={[styles.navText, activeTab === 'space' && styles.activeNavText]}>Space</Text>
                      </TouchableOpacity>
                    </SafeAreaView>
                  </>
                )}
            </View>
          )}
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
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#FCF9F2',
    borderTopWidth: 1,
    borderTopColor: 'rgba(74,93,78,0.1)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#4A5D4E',
  },
  navText: {
    color: '#9E9E9E',
    fontWeight: '600',
    fontSize: 12,
  },
  activeNavText: {
    color: '#4A5D4E',
    fontWeight: '800',
  },
  sosNavText: {
    color: '#FF5252',
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
