import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/lib/notifications';
import { isAuthenticated } from './src/lib/auth';

// ── Error Boundary — beyaz ekran yerine hata mesajı göster ──────────────────
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }
    render() {
        if (this.state.hasError) {
            return (
                <View style={ebStyles.container}>
                    <Text style={ebStyles.emoji}>⚠️</Text>
                    <Text style={ebStyles.title}>Bir hata oluştu</Text>
                    <Text style={ebStyles.msg}>{this.state.error?.message}</Text>
                    <TouchableOpacity
                        style={ebStyles.btn}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={ebStyles.btnTxt}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}
const ebStyles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f3e9', padding: 32 },
    emoji: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
    msg: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
    btn: { backgroundColor: '#a62932', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
    btnTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

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
        <ErrorBoundary>
            <StatusBar style="dark" />
            <AppNavigator onAuthenticated={() => {
                registerForPushNotifications().catch(console.error);
            }} />
        </ErrorBoundary>
    );
}
