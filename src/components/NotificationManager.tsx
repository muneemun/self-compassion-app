import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/useAppStore';
import { NotificationService } from '../utils/notificationService';

export const NotificationManager = () => {
    const { reminderSettings, notificationSettings, setActiveTab, setSelfTimeModalOpen } = useAppStore();
    
    useEffect(() => {
        const initNotifications = async () => {
            try {
                const hasPermission = await NotificationService.requestPermissions();
                if (hasPermission) {
                    await syncNotifications();
                }
            } catch (error) {
                console.warn('알림 모듈을 초기화할 수 없습니다. 네이티브 빌드가 필요할 수 있습니다:', error);
            }
        };
        
        initNotifications();

        // 알림 클릭(응답) 리스너 등록
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            
            if (data.screen === 'Health') {
                setActiveTab('health');
            } else if (data.screen === 'Tuning') {
                setActiveTab('tuning');
            } else if (data.screen === 'CheckIn') {
                setActiveTab('map');
                setSelfTimeModalOpen(true);
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        try {
            syncNotifications();
        } catch (error) {
            // Silently ignore sync errors if module is missing
        }
    }, [reminderSettings, notificationSettings]);

    const syncNotifications = async () => {
        try {
            // 1. 기존 알림 모두 삭제
            await NotificationService.cancelAllNotifications();

            // 2. 오늘 기록 리마인더 (Daily)
            if (reminderSettings.isDailyEnabled) {
                const dailyTime = new Date(reminderSettings.dailyTime);
                if (!isNaN(dailyTime.getTime())) {
                    await NotificationService.scheduleDailyReminder(
                        dailyTime.getHours(),
                        dailyTime.getMinutes()
                    );
                } else {
                    console.warn('Invalid daily reminder time:', reminderSettings.dailyTime);
                }
            }

            // 3. 정기 궤도 점검 (Periodic)
            if (reminderSettings.isTuningEnabled) {
                const tuningTime = new Date(reminderSettings.tuningTime);
                const dayOfWeek = mapAnchorToDayOfWeek(reminderSettings.tuningAnchor);
                
                if (!isNaN(tuningTime.getTime()) && dayOfWeek !== -1) {
                    await NotificationService.scheduleTuningReminder(
                        dayOfWeek,
                        tuningTime.getHours(),
                        tuningTime.getMinutes()
                    );
                } else {
                    console.warn('Invalid tuning reminder settings:', { tuningTime, dayOfWeek });
                }
            }

            // 4. 분석 리포트 알림 (설정 활성화 시)
            if (notificationSettings.isSelfReportEnabled || notificationSettings.isOrbitReportEnabled) {
                await NotificationService.scheduleReportReminder();
            }
        } catch (error) {
            console.error('Failed to sync notifications:', error);
        }
    };

    const mapAnchorToDayOfWeek = (anchor: string): number => {
        const map: Record<string, number> = {
            '일요일': 1,
            '월요일': 2,
            '화요일': 3,
            '수요일': 4,
            '목요일': 5,
            '금요일': 6,
            '토요일': 7,
            '매월 1일': -1, // 복잡한 주기는 현재 단순화
            '매월 말일': -1,
            '마지막 일요일': 1,
        };
        return map[anchor] || -1;
    };

    return null; // UI는 없음
};
