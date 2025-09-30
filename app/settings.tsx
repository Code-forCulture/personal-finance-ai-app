import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { Shield, User, Crown, LifeBuoy, ExternalLink } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "Profile" | "Privacy" | "Upgrade" | "Support";

import type { FunctionComponent } from "react";

type IconCmp = FunctionComponent<{ color: string; size: number }>;

function TabButton({
  Icon,
  label,
  isActive,
  onPress,
  testID,
}: {
  Icon: IconCmp;
  label: string;
  isActive: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      testID={testID}
    >
      <View style={styles.tabIcon}><Icon color={isActive ? Colors.primary : Colors.gray500} size={18} /></View>
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ProfileSettings = React.memo(function ProfileSettings() {
  const { user } = useAuth();
  const [name, setName] = useState<string>(user?.displayName ?? "");
  const [email, setEmail] = useState<string>(user?.email ?? "");

  const onSave = useCallback(() => {
    console.log("[Settings] Save profile", { name, email });
    Alert.alert("Saved", "Your profile has been updated.");
  }, [name, email]);

  return (
    <ScrollView contentContainerStyle={styles.sectionBody} showsVerticalScrollIndicator={false}>
      <Text style={styles.inputLabel}>Full name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        style={styles.input}
        autoCapitalize="words"
        testID="settings-profile-name"
      />
      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        testID="settings-profile-email"
      />
      <TouchableOpacity onPress={onSave} style={styles.primaryButton} testID="settings-profile-save">
        <Text style={styles.primaryButtonText}>Save changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
});

const PrivacySettings = React.memo(function PrivacySettings() {
  const [showBalances, setShowBalances] = useState<boolean>(true);
  const [twoFA, setTwoFA] = useState<boolean>(false);

  const toggle = useCallback((set: (v: boolean) => void, v: boolean) => set(!v), []);

  return (
    <View style={styles.sectionBody}>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleTitle}>Show balances by default</Text>
        <TouchableOpacity
          onPress={() => toggle(setShowBalances, showBalances)}
          style={[styles.switch, showBalances && styles.switchActive]}
          testID="settings-privacy-balance-toggle"
        >
          <View style={[styles.knob, showBalances && styles.knobOn]} />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleTitle}>Two-factor authentication</Text>
        <TouchableOpacity
          onPress={() => toggle(setTwoFA, twoFA)}
          style={[styles.switch, twoFA && styles.switchActive]}
          testID="settings-privacy-2fa-toggle"
        >
          <View style={[styles.knob, twoFA && styles.knobOn]} />
        </TouchableOpacity>
      </View>

      <Text style={styles.helperText}>Manage privacy and security preferences.</Text>
    </View>
  );
});

const UpgradePremium = React.memo(function UpgradePremium() {
  const checkoutUrl = (process.env["EXPO_PUBLIC_STRIPE_CHECKOUT_URL"] as string | undefined) ??
    "https://buy.stripe.com/test_4gw9C42tN4mH2fK5km";

  const openCheckout = useCallback(async () => {
    try {
      console.log("[Stripe] Opening checkout", checkoutUrl);
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (!supported) {
        Alert.alert("Unavailable", "Cannot open payment link on this device.");
        return;
      }
      await Linking.openURL(checkoutUrl);
    } catch (e) {
      console.error("[Stripe] Checkout open error", e);
      Alert.alert("Error", "Failed to open Stripe Checkout. Please try again.");
    }
  }, [checkoutUrl]);

  return (
    <View style={styles.sectionBody}>
      <Text style={styles.headerTitle}>Go Premium</Text>
      <Text style={styles.helperText}>
        Unlock personalized AI coaching, advanced reports, and priority support.
      </Text>
      <TouchableOpacity onPress={openCheckout} style={styles.premiumButton} testID="settings-upgrade-button">
        <Crown color="#111827" size={18} />
        <Text style={styles.premiumButtonText}>Upgrade with Stripe</Text>
        <ExternalLink color="#111827" size={18} />
      </TouchableOpacity>
      <Text style={styles.disclaimer}>
        Payments are processed securely by Stripe. You will be redirected to a checkout page.
      </Text>
    </View>
  );
});

const HelpSupport = React.memo(function HelpSupport() {
  const faqs = useMemo(
    () => [
      { q: "How do I add transactions?", a: "Use the Add tab and select income or expense." },
      { q: "How do I upgrade?", a: "Open Settings → Upgrade and tap Upgrade with Stripe." },
      { q: "How is my data stored?", a: "We store only what is needed and never sell your data." },
    ],
    []
  );

  const openMail = useCallback(async () => {
    const url = "mailto:support@example.com?subject=Help%20with%20My%20Finance%20App";
    try {
      console.log("[Support] Opening mail");
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unavailable", "Mail app not available on this device.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.error("[Support] Mail open error", e);
      Alert.alert("Error", "Failed to open mail app.");
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.sectionBody} showsVerticalScrollIndicator={false}>
      {faqs.map((f, idx) => (
        <View key={`faq-${idx}`} style={styles.faqCard}>
          <Text style={styles.faqQ}>{f.q}</Text>
          <Text style={styles.faqA}>{f.a}</Text>
        </View>
      ))}

      <TouchableOpacity onPress={openMail} style={styles.primaryButton} testID="settings-support-contact">
        <Text style={styles.primaryButtonText}>Contact support</Text>
      </TouchableOpacity>
    </ScrollView>
  );
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<TabKey>("Profile");

  const renderBody = useMemo(() => {
    switch (active) {
      case "Profile":
        return <ProfileSettings />;
      case "Privacy":
        return <PrivacySettings />;
      case "Upgrade":
        return <UpgradePremium />;
      case "Support":
        return <HelpSupport />;
      default:
        return null;
    }
  }, [active]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ title: "Settings" }} />

      <View style={styles.tabsRow}>
        <TabButton
          Icon={User}
          label="Profile"
          isActive={active === "Profile"}
          onPress={() => setActive("Profile")}
          testID="settings-tab-profile"
        />
        <TabButton
          Icon={Shield}
          label="Privacy"
          isActive={active === "Privacy"}
          onPress={() => setActive("Privacy")}
          testID="settings-tab-privacy"
        />
        <TabButton
          Icon={Crown}
          label="Upgrade"
          isActive={active === "Upgrade"}
          onPress={() => setActive("Upgrade")}
          testID="settings-tab-upgrade"
        />
        <TabButton
          Icon={LifeBuoy}
          label="Support"
          isActive={active === "Support"}
          onPress={() => setActive("Support")}
          testID="settings-tab-support"
        />
      </View>

      <View style={styles.body}>{renderBody}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "#EEF2FF",
  },
  tabIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 13,
    color: Colors.gray500,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionBody: {
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.ink,
    fontWeight: "800",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 10 }) as number,
    fontSize: 16,
    color: Colors.ink,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  toggleTitle: {
    fontSize: 15,
    color: Colors.ink,
    fontWeight: "600",
    flex: 1,
    paddingRight: 12,
  },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    padding: 4,
  },
  switchActive: {
    backgroundColor: "#C7D2FE",
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  knobOn: {
    alignSelf: "flex-end",
  },
  helperText: {
    fontSize: 13,
    color: Colors.gray500,
  },
  premiumButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  premiumButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 8,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    gap: 6,
  },
  faqQ: {
    fontSize: 14,
    color: Colors.ink,
    fontWeight: "700",
  },
  faqA: {
    fontSize: 13,
    color: Colors.gray500,
  },
});
