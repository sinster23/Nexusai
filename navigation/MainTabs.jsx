import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Animated, Dimensions } from "react-native";
import { useNavigationState } from "@react-navigation/native";
import HomeStack from "../navigation/HomeStack";
import ExploreScreen from "../screens/ExploreScreen";
import AccountScreen from "../screens/AccountScreen";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

// Custom Tab Bar Component with sliding indicator
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const [slideAnim] = React.useState(new Animated.Value(0));
  const tabWidth = width / state.routes.length;

  // Get the current navigation state to check for nested screens
  const navigationState = useNavigationState(state => state);
  
  // Check if we're on a screen that should hide the tab bar
const shouldHideTabBar = React.useMemo(() => {
  const currentRoute = navigationState?.routes[navigationState.index];
  if (currentRoute?.name === 'Home' && currentRoute?.state) {
    // Check if we're on StoryDetails or StoryPlay screen within HomeStack
    const homeStackState = currentRoute.state;
    const currentHomeScreen = homeStackState?.routes[homeStackState.index];
    return currentHomeScreen?.name === 'StoryDetails' || currentHomeScreen?.name === 'StoryPlay' ||  currentHomeScreen?.name === 'CategoryStories';
  }
  return false;
}, [navigationState]);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [state.index, tabWidth]);

  // Don't render the tab bar if it should be hidden
  if (shouldHideTabBar) {
    return null;
  }

  return (
    <BlurView
      intensity={50}
      tint="dark"
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(17, 17, 17, 0.5)",
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.1)",
        paddingBottom: Math.min(insets.bottom, 30),
        paddingHorizontal: 25,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Sliding indicator */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: tabWidth,
          height: 3,
          backgroundColor: "#FFBF00",
          borderRadius: 2,
          transform: [{ translateX: slideAnim }],
        }}
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Icon mapping
        let iconName;
        if (route.name === "Home") iconName = "home-outline";
        else if (route.name === "Explore") iconName = "search-outline";
        else if (route.name === "Account") iconName = "person-outline";

        return (
          <Animated.View
            key={route.key}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
            }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    scale: isFocused ? 1.1 : 1,
                  },
                ],
                opacity: isFocused ? 1 : 0.7,
              }}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? "#FFBF00" : "#ccc"}
                onPress={onPress}
                onLongPress={onLongPress}
                style={{
                  textAlign: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                }}
              />
            </Animated.View>
          </Animated.View>
        );
      })}
    </BlurView>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;