import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import TwoFactorScreen from '../screens/TwoFactorScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminAccountsScreen from '../screens/AdminAccountsScreen';
import AdminBriefsScreen from '../screens/AdminBriefsScreen';
import AdminFinanceScreen from '../screens/AdminFinanceScreen';
import AdminProposalsScreen from '../screens/AdminProposalsScreen';
import AdminProjectsScreen from '../screens/AdminProjectsScreen';

import { isAuthenticated, getUserData, setSessionExpiredHandler, logout } from '../lib/auth';
import { COLORS } from '../lib/constants';

export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    TwoFactor: { adminId: string };
    Dashboard: undefined;
    AdminDashboard: undefined;
    AdminAccounts: undefined;
    AdminBriefs: undefined;
    AdminFinance: undefined;
    AdminProposals: undefined;
    AdminProjects: undefined;
    BriefForm: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
}

export default function AppNavigator() {
    const [isReady, setIsReady] = useState(false);
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Welcome');
    const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authenticated = await isAuthenticated();
                if (authenticated) {
                    const userData = await getUserData();
                    if (userData?.role === 'admin') {
                        setInitialRoute('AdminDashboard');
                    } else if (userData?.role) {
                        setInitialRoute('Dashboard');
                    }
                    // If authenticated, skip Welcome and Login
                }
            } catch {
                // Default to Welcome on any error
            }
            setIsReady(true);
        };
        checkAuth();
    }, []);

    // Handle session expiry — redirect to login
    useEffect(() => {
        setSessionExpiredHandler(() => {
            Alert.alert(
                'Oturum Suresi Doldu',
                'Lutfen tekrar giris yapin.',
                [{
                    text: 'Tamam',
                    onPress: async () => {
                        await logout();
                        if (navigationRef.current) {
                            navigationRef.current.reset({
                                index: 0,
                                routes: [{ name: 'Welcome' }],
                            });
                        }
                    },
                }]
            );
        });

        return () => setSessionExpiredHandler(() => {});
    }, []);

    if (!isReady) return <LoadingScreen />;

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {/* Welcome / Splash */}
                <Stack.Screen
                    name="Welcome"
                    component={WelcomeScreen}
                    options={{ animation: 'fade' }}
                />

                {/* Auth */}
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen
                    name="TwoFactor"
                    component={TwoFactorScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />

                {/* Client Screens */}
                <Stack.Screen name="Dashboard" component={DashboardScreen} />

                {/* Admin Screens */}
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="AdminAccounts" component={AdminAccountsScreen} />
                <Stack.Screen name="AdminBriefs" component={AdminBriefsScreen} />
                <Stack.Screen name="AdminFinance" component={AdminFinanceScreen} />
                <Stack.Screen name="AdminProposals" component={AdminProposalsScreen} />
                <Stack.Screen name="AdminProjects" component={AdminProjectsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});
