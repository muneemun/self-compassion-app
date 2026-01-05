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
import { useAppStore } from './src/store/useAppStore';
import { SettingsScreen } from './src/features/settings/SettingsScreen';

function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'insight' | 'tuning' | 'space' | 'sos'>('map');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisMode, setDiagnosisMode] = useState<"ZONE" | "RQS">("ZONE");
  const [isManagingProfile, setIsManagingProfile] = useState(false);
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);

  return (
    <SafeAreaProvider>
      <ColorLockProvider>
        <View style={styles.root}>
          <StatusBar style="dark" translucent backgroundColor="transparent" />

          {!hasCompletedOnboarding ? (
            <OnboardingScreen />
          ) : (
            <View style={styles.contentContainer}>
              {selectedNodeId ? (
                isDiagnosing ? (
                  <RelationshipDiagnosis
                    mode={diagnosisMode}
                    relationshipId={selectedNodeId}
                    onBack={() => setIsDiagnosing(false)}
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
                  onComplete={(id) => {
                    setIsAddingRelationship(false);
                    setSelectedNodeId(id);
                    setIsDiagnosing(true);
                  }}
                />
              ) : (
                <>
                  <View style={styles.tabView}>
                    {activeTab === 'map' && (
                      <MainOrbitMap
                        onSelectNode={(id: string) => setSelectedNodeId(id)}
                        onPressAdd={() => setIsAddingRelationship(true)}
                        onPressSos={() => setActiveTab('sos')}
                        onPressSettings={() => setActiveTab('space')}
                      />
                    )}
                    {activeTab === 'insight' && (
                      <EgoReflectionDashboard
                        onBack={() => setActiveTab('map')}
                      />
                    )}
                    {activeTab === 'tuning' && (
                      <RelationshipTuningDashboard
                        onBack={() => setActiveTab('insight')}
                        onSelectNode={(id) => {
                          setSelectedNodeId(id);
                          setIsViewingReport(false);
                          setIsDiagnosing(false);
                          setIsManagingProfile(false);
                        }}
                      />
                    )}
                    {activeTab === 'space' && (
                      <SettingsScreen onBack={() => setActiveTab('map')} />
                    )}
                    {activeTab === 'sos' && (
                      <SosRxCenter
                        onBack={() => setActiveTab('map')}
                      />
                    )}
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
                      style={[styles.navItem, activeTab === 'insight' && styles.activeNavItem]}
                      onPress={() => setActiveTab('insight')}
                    >
                      <Text style={[styles.navText, activeTab === 'insight' && styles.activeNavText]}>Insight</Text>
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
});

registerRootComponent(App);
