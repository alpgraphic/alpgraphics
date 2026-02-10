import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminAccountsScreen from '../screens/AdminAccountsScreen';
import AdminBriefsScreen from '../screens/AdminBriefsScreen';
import AdminFinanceScreen from '../screens/AdminFinanceScreen';

export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    AdminDashboard: undefined;
    AdminAccounts: undefined;
    AdminBriefs: undefined;
    AdminFinance: undefined;
    BriefForm: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {/* Auth */}
                <Stack.Screen name="Login" component={LoginScreen} />

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

