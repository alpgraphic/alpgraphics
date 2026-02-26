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
import AdminMessagesScreen from '../screens/AdminMessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import PlannerScreen from '../screens/PlannerScreen';
import BriefFormScreen from '../screens/BriefFormScreen';
import GameScreen from '../screens/GameScreen';
import ChromaDashScreen from '../screens/ChromaDashScreen';
import ProjectMilestonesScreen from '../screens/ProjectMilestonesScreen';

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
    AdminMessages: undefined;
    Chat: { accountId: string; companyName?: string; accountName?: string };
    Planner: undefined;
    BriefForm: { briefId?: string; isReadOnly?: boolean } | undefined;
    Game: undefined;
    ChromaDash: undefined;
    ProjectMilestones: { projectId: string; projectTitle: string };
};

type Props = {
    onAuthenticated?: () => void;
    navigationRef?: React.MutableRefObject<any>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
}

export default function AppNavigator({ onAuthenticated, navigationRef: externalNavRef }: Props) {
    const [isReady, setIsReady] = useState(false);
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Welcome');
    const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authenticated = await isAuthenticated();
                if (authenticated) {
                    // Start Biometric Authentication
                    const { isBiometricAvailable, authenticateWithBiometric } = await import('../lib/auth');
                    const hasBiometric = await isBiometricAvailable();

                    let biometricSuccess = true;
                    if (hasBiometric) {
                        biometricSuccess = await authenticateWithBiometric('Uygulamaya giriş için kimliğinizi doğrulayın');
                    }

                    if (biometricSuccess) {
                        const userData = await getUserData();
                        if (userData?.role === 'admin') {
                            setInitialRoute('AdminDashboard');
                        } else if (userData?.role) {
                            setInitialRoute('Dashboard');
                        }
                        // Trigger push notification registration
                        onAuthenticated?.();
                    } else {
                        // User cancelled or biometric failed -> Revert to Login Screen
                        setInitialRoute('Login');
                    }
                }
            } catch {
                // Default to Welcome on any error
                setInitialRoute('Welcome');
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

        return () => setSessionExpiredHandler(() => { });
    }, []);

    if (!isReady) return <LoadingScreen />;

    return (
        <NavigationContainer
            ref={(ref) => {
                (navigationRef as any).current = ref;
                if (externalNavRef) externalNavRef.current = ref;
            }}
        >
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
                <Stack.Screen name="AdminMessages" component={AdminMessagesScreen} />
                <Stack.Screen name="Planner" component={PlannerScreen} />

                {/* Gizli Oyunlar 🎨 */}
                <Stack.Screen
                    name="Game"
                    component={GameScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="ChromaDash"
                    component={ChromaDashScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />

                {/* Client Milestone View */}
                <Stack.Screen
                    name="ProjectMilestones"
                    component={ProjectMilestonesScreen}
                    options={{ animation: 'slide_from_right' }}
                />

                {/* Shared Screens */}
                <Stack.Screen
                    name="BriefForm"
                    component={BriefFormScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{ animation: 'slide_from_right' }}
                />
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
