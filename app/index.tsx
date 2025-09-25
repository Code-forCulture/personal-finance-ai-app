import { useEffect } from "react";
import { router, Redirect } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('[IndexScreen] Auth state changed:', { user: !!user, isLoading });
    if (!isLoading) {
      if (user) {
        console.log('[IndexScreen] User authenticated, redirecting to home');
        router.replace("/(tabs)/home");
      } else {
        console.log('[IndexScreen] No user, redirecting to onboarding');
        router.replace("/onboarding");
      }
    }
  }, [user, isLoading]);

  if (!isLoading && user) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!isLoading && !user) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
});