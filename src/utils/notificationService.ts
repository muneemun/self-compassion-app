import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 알림이 도착했을 때의 기본 동작 설정
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        } as any),
    });
} catch (error) {
    console.warn('Notifications handler could not be set:', error);
}

export const NotificationService = {
    // 1. 권한 요청
    async requestPermissions() {
        // 에뮬레이터에서도 권한 흐름을 테스트할 수 있도록 허용 (실기기 여부와 상관없이 진행)
        // if (!Device.isDevice) return false; 
        
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus !== 'granted') return false;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFA000',
            });
        }
        
        return true;
    },

    // 2. 모든 예약된 알림 취소
    async cancelAllNotifications() {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Failed to cancel notifications:', error);
        }
    },

    // 3. 오늘 기록 리마인더 예약
    async scheduleDailyReminder(hour: number, minute: number) {
        try {
            if (typeof hour !== 'number' || typeof minute !== 'number') {
                console.warn('Invalid time for reminder:', { hour, minute });
                return;
            }
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "🌿 오늘 마음은 어떠셨나요?",
                    body: "오늘의 정서 에너지를 기록하고 나를 돌보는 시간을 가져보세요.",
                    data: { screen: 'CheckIn' },
                    android: { channelId: 'default' },
                } as any,
                trigger: {
                    type: 'daily',
                    hour,
                    minute,
                } as any,
            });
        } catch (error) {
            console.warn('Failed to schedule daily reminder (requires exact alarm permission):', error);
        }
    },

    // 4. 정기 궤도 점검 예약 (주간 예시)
    async scheduleTuningReminder(dayOfWeek: number, hour: number, minute: number) {
        try {
            if (typeof dayOfWeek !== 'number' || typeof hour !== 'number' || typeof minute !== 'number') {
                console.warn('Invalid data for tuning reminder:', { dayOfWeek, hour, minute });
                return;
            }
            // weekday: 1 (Sun) - 7 (Sat)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "🪐 정기 궤도 점검 시간",
                    body: "관계의 중력이 변하고 있어요. 지도를 재배치할 시간입니다.",
                    data: { screen: 'Tuning' },
                    android: { channelId: 'default' },
                } as any,
                trigger: {
                    type: 'weekly',
                    weekday: dayOfWeek,
                    hour,
                    minute,
                } as any,
            });
        } catch (error) {
            console.warn('Failed to schedule tuning reminder (requires exact alarm permission):', error);
        }
    },

    // 5. 리포트 알림 (매주 월요일 오전 9시 예시)
    async scheduleReportReminder() {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "📊 주간 건강 리포트 도착",
                    body: "지난주 당신의 마음 날씨 분석이 완료되었습니다.",
                    data: { screen: 'Health' },
                    android: { channelId: 'default' },
                } as any,
                trigger: {
                    type: 'weekly',
                    weekday: 2, // Monday
                    hour: 9,
                    minute: 0,
                } as any,
            });
        } catch (error) {
            console.warn('Failed to schedule report reminder:', error);
        }
    },

    // 6. 월간 리마인더 예약
    async scheduleMonthlyReminder(day: number, hour: number, minute: number) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "🪐 월간 궤도 대점검",
                    body: "한 달간의 정서 흐름을 정리하고 새로운 목표를 세워보세요.",
                    data: { screen: 'Tuning' },
                    android: { channelId: 'default' },
                } as any,
                trigger: {
                    type: 'monthly',
                    day,
                    hour,
                    minute,
                } as any,
            });
        } catch (error) {
            console.warn('Failed to schedule monthly reminder:', error);
        }
    },

    // 7. 공지사항 및 업데이트 알림 (주간 체크 유도)
    async scheduleNoticeReminder() {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "📢 새로운 마음 가이드 업데이트",
                    body: "관계 비타민과 새로운 공지사항이 도착했는지 확인해보세요.",
                    data: { screen: 'Settings' },
                    android: { channelId: 'default' },
                } as any,
                trigger: {
                    type: 'weekly',
                    weekday: 5, // Friday
                    hour: 14,
                    minute: 0,
                } as any,
            });
        } catch (error) {
            console.warn('Failed to schedule notice reminder:', error);
        }
    }
};
