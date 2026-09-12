import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

import DashboardScreen from "../screens/DashboardScreen";
import FarmerListScreen from "../screens/farmers/FarmerListScreen";
import FarmerFormScreen from "../screens/farmers/FarmerFormScreen";
import FarmerDetailsScreen from "../screens/farmers/FarmerDetailsScreen";
import PlantationListScreen from "../screens/plantations/PlantationListScreen";
import PlantationFormScreen from "../screens/plantations/PlantationFormScreen";
import PlantationDetailsScreen from "../screens/plantations/PlantationDetailsScreen";

const AuthStack = createNativeStackNavigator();
const FarmerStack = createNativeStackNavigator();
const PlantationStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function FarmerNavigator() {
  return (
    <FarmerStack.Navigator>
      <FarmerStack.Screen name="FarmerList" component={FarmerListScreen} options={{ title: "Farmers" }} />
      <FarmerStack.Screen name="FarmerForm" component={FarmerFormScreen} options={{ title: "Farmer" }} />
      <FarmerStack.Screen name="FarmerDetails" component={FarmerDetailsScreen} options={{ title: "Farmer Details" }} />
      <FarmerStack.Screen name="PlantationForm" component={PlantationFormScreen} options={{ title: "Plantation" }} />
      <FarmerStack.Screen name="PlantationDetails" component={PlantationDetailsScreen} options={{ title: "Plantation Details" }} />
    </FarmerStack.Navigator>
  );
}

function PlantationNavigator() {
  return (
    <PlantationStack.Navigator>
      <PlantationStack.Screen name="PlantationList" component={PlantationListScreen} options={{ title: "Plantations" }} />
      <PlantationStack.Screen name="PlantationForm" component={PlantationFormScreen} options={{ title: "Plantation" }} />
      <PlantationStack.Screen name="PlantationDetails" component={PlantationDetailsScreen} options={{ title: "Plantation Details" }} />
    </PlantationStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ tabBarActiveTintColor: "#2f6d3c" }}>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Farmers" component={FarmerNavigator} options={{ headerShown: false }} />
      <Tabs.Screen name="Plantations" component={PlantationNavigator} options={{ headerShown: false }} />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2f6d3c" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
