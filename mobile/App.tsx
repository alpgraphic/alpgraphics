import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/lib/notifications';
import { isAuthenticated } from './src/lib/auth';

export default function App() {
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        // Register for push notifications if user is already logged in
        isAuthenticated().then((authenticated) => {
            if (authenticated) {
                registerForPushNotifications().catch(console.error);
            }
        });

        // Listen for incoming notifications while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification.request.content.title);
        });

        // Listen for user tapping a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data as Record<string, any>;
            console.log('Notification tapped:', data?.type);
            // Navigation handling could be added here via a ref to navigationRef
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    return (
        <>
            <StatusBar style="dark" />
            <AppNavigator onAuthenticated={() => {
                registerForPushNotifications().catch(console.error);
            }} />
        </>
    );
}
