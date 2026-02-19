import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiRequest } from './auth';

// Configure notification behavior (works for local notifications in Expo Go too)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions and optionally get Expo push token.
 * Remote push token requires a production/development build (not Expo Go).
 * Local notifications (planner reminders) work in both Expo Go and production.
 */
export async function registerForPushNotifications(): Promise<string | null> {
    // Only request permissions on real devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device.');
        return null;
    }

    try {
        // Request permissions (local notifications work in Expo Go)
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            // Not an error — user may have denied. Local notifs also won't work.
            return null;
        }

        // Android notification channel setup
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Genel Bildirimler',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#a62932',
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('planner', {
                name: 'Planlayıcı Hatırlatıcıları',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 500, 200, 500],
                lightColor: '#a62932',
                sound: 'default',
            });
        }

        // Try to get remote push token — only works in production/dev builds,
        // NOT in Expo Go (fails with projectId or SDK error). We catch gracefully.
        try {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            const token = tokenData.data;
            // Save token to server for remote push notifications
            await saveTokenToServer(token);
            return token;
        } catch {
            // Expected in Expo Go — local notifications still work fine.
            // Remote push (briefs/messages) will work once app is in production build.
            console.log('Remote push token unavailable (Expo Go or missing projectId). Local notifications still active.');
            return null;
        }
    } catch (error) {
        console.error('Failed to set up notifications:', error);
        return null;
    }
}

/**
 * Save push token to server via API.
 */
async function saveTokenToServer(token: string): Promise<void> {
    try {
        await apiRequest('/api/mobile/push-token', {
            method: 'POST',
            body: JSON.stringify({
                token,
                platform: Platform.OS,
            }),
        });
    } catch (error) {
        console.error('Failed to save push token to server:', error);
    }
}

/**
 * Remove push token from server (call on logout).
 */
export async function removePushToken(): Promise<void> {
    try {
        // getExpoPushTokenAsync throws in Expo Go — handle gracefully
        const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
        if (tokenData?.data) {
            await apiRequest(`/api/mobile/push-token?token=${encodeURIComponent(tokenData.data)}`, {
                method: 'DELETE',
            });
        }
    } catch {
        // Ignore — token might not exist or we're in Expo Go
    }
}

/**
 * Schedule a local notification for a planner task.
 * Triggers 10 minutes before the task's dueTime.
 * Returns the notification identifier (for cancellation).
 */
export async function schedulePlannerReminder(
    taskId: string,
    title: string,
    dueDate: string, // YYYY-MM-DD
    dueTime: string  // HH:MM
): Promise<string | null> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return null;

        // Parse date and time
        const [year, month, day] = dueDate.split('-').map(Number);
        const [hour, minute] = dueTime.split(':').map(Number);

        // Create Date object for the due time
        const dueDateTime = new Date(year, month - 1, day, hour, minute, 0);

        // Subtract 10 minutes for reminder
        const reminderTime = new Date(dueDateTime.getTime() - 10 * 60 * 1000);

        // Don't schedule if the reminder time is in the past
        if (reminderTime <= new Date()) {
            return null;
        }

        // Cancel any existing notification for this task
        await cancelPlannerReminder(taskId);

        const identifier = await Notifications.scheduleNotificationAsync({
            identifier: `planner_${taskId}`,
            content: {
                title: '⏰ Yaklaşan Görev',
                body: `"${title}" görevi 10 dakika içinde bitiyor.`,
                data: { taskId, type: 'planner_reminder' },
                sound: 'default',
                categoryIdentifier: 'planner',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminderTime,
            },
        });

        return identifier;
    } catch (error) {
        console.error('Failed to schedule planner reminder:', error);
        return null;
    }
}

/**
 * Cancel a scheduled planner reminder.
 */
export async function cancelPlannerReminder(taskId: string): Promise<void> {
    try {
        await Notifications.cancelScheduledNotificationAsync(`planner_${taskId}`);
    } catch {
        // Ignore errors (notification might not exist)
    }
}

/**
 * Cancel all scheduled planner reminders.
 */
export async function cancelAllPlannerReminders(): Promise<void> {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const plannerNotifs = scheduled.filter(n => n.identifier.startsWith('planner_'));
        await Promise.all(plannerNotifs.map(n =>
            Notifications.cancelScheduledNotificationAsync(n.identifier)
        ));
    } catch (error) {
        console.error('Failed to cancel planner reminders:', error);
    }
}
