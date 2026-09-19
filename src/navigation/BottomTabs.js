import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import CoreScreen from '../screens/CoreScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import TasksScreen from '../screens/TasksScreen';
import NotesScreen from '../screens/NotesScreen';
import DrawerScreen from '../screens/DrawerScreen';
import FinanceScreen from '../screens/FinanceScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Core: 'sync-circle-outline',
  Schedule: 'calendar-outline',
  Drawer: 'chatbubble-ellipses-outline',
  Tasks: 'checkmark-done-outline',
  Finance: 'cash-outline',
  Notes: 'document-text-outline',
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentCyan,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardDark,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Core" component={CoreScreen} options={{ title: 'Núcleo' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Horario' }} />
      <Tab.Screen name="Drawer" component={DrawerScreen} options={{ title: 'Rem' }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: 'Tareas' }} />
      <Tab.Screen name="Finance" component={FinanceScreen} options={{ title: 'Finanzas' }} />
      <Tab.Screen name="Notes" component={NotesScreen} options={{ title: 'Notas' }} />
    </Tab.Navigator>
  );
}
