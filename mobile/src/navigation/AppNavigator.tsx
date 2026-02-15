import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import TwoFactorScreen from '../screens/TwoFactorScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminAccountsScreen from '../screens/AdminAccountsScreen';
import AdminBriefsScreen from '../screens/AdminBriefsScreen';
import AdminFinanceScreen from '../screens/AdminFinanceScreen';

import { isAuthenticated, getUserData } from '../lib/auth';
import { COLORS } from '../lib/constants';

export type RootStackParamList = {
    Login: undefined;
    TwoFactor: { adminId: string };
    Dashboard: undefined;
    AdminDashboard: undefined;
    AdminAccounts: undefined;
    AdminBriefs: undefined;
    AdminFinance: undefined;
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
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authenticated = await isAuthenticated();
                if (authenticated) {
                    const userData = await getUserData();
                    if (userData?.role === 'admin') {
                        setInitialRoute('AdminDashboard');
                    } else {
                        setInitialRoute('Dashboard');
                    }
                }
            } catch {
                // Default to Login on any error
            }
            setIsReady(true);
        };
        checkAuth();
    }, []);

    if (!isReady) return <LoadingScreen />;

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
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
