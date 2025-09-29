import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import * as SystemUI from 'expo-system-ui';
import LoginScreen from './navigation/LoginScreen';
import MainTabs from './navigation/MainTabs';
import StoryDetailsScreen from './screens/StoryDetails';
import StoryPlayScreen from './screens/StoryPlayScreen';
import CreateScenarioScreen from './screens/CreateScenario';
import PromotionPage from './screens/PromotionScreen';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#000000');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null; // splash screen placeholder

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <RootStack.Screen name="MainTabs" component={MainTabs} />
              <RootStack.Screen name="StoryDetails" component={StoryDetailsScreen} />
              <RootStack.Screen name="StoryPlay" component={StoryPlayScreen} />
              <RootStack.Screen name="CreateScenario" component={CreateScenarioScreen} />
              <RootStack.Screen name="Promotion" component={PromotionPage} />
            </>
          ) : (
            <RootStack.Screen name="Login" component={LoginScreen} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
