import { Tabs } from "expo-router";
import { Home, PlusCircle, BarChart3, Brain, Crown } from "lucide-react-native";
import React from "react";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";

export default function TabLayout() {
  const { user } = useAuth();
  const isPremium = Boolean(user?.isPremium);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.gray100,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => <Brain color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: "Premium",
          tabBarIcon: ({ color, size }) => <Crown color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}