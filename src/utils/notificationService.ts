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
        }),
    });
} catch (error) {
    console.warn('Notifications handler could not be set:', error);
}

export const NotificationService = {
    // 1. 권한 요청
    async requestPermissions() {
        if (!Device.isDevice) return false;
        
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
                lightColor: '#FF231F7C',
            });
        }
        
        return true;
    },

    // 2. 모든 예약된 알림 취소
    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    },

    // 3. 오늘 기록 리마인더 예약
    async scheduleDailyReminder(hour: number, minute: number) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🌿 오늘 마음은 어떠셨나요?",
                body: "오늘의 정서 에너지를 기록하고 나를 돌보는 시간을 가져보세요.",
                data: { screen: 'CheckIn' },
            },
            trigger: {
                hour,
                minute,
                repeats: true,
            },
        });
    },

    // 4. 정기 궤도 점검 예약 (주간 예시)
    async scheduleTuningReminder(dayOfWeek: number, hour: number, minute: number) {
        // dayOfWeek: 1 (Sun) - 7 (Sat) for Expo
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🪐 정기 궤도 점검 시간",
                body: "관계의 중력이 변하고 있어요. 지도를 재배치할 시간입니다.",
                data: { screen: 'Tuning' },
            },
            trigger: {
                weekday: dayOfWeek,
                hour,
                minute,
                repeats: true,
            },
        });
    },

    // 5. 리포트 알림 (매주 월요일 오전 9시 예시)
    async scheduleReportReminder() {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "📊 주간 건강 리포트 도착",
                body: "지난주 당신의 마음 날씨 분석이 완료되었습니다.",
                data: { screen: 'Health' },
            },
            trigger: {
                weekday: 2, // Monday (Expo weekday 1=Sun, 2=Mon...)
                hour: 9,
                minute: 0,
                repeats: true,
            },
        });
    }
};
