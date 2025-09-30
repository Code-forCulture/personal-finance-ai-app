import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  Eye,
  EyeOff,
  Settings,
  Brain,
  BarChart3
} from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useFinance } from "@/providers/FinanceProvider";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    balance, 
    monthlyIncome, 
    monthlyExpenses, 
    goals, 
    userPoints,
    hideBalance,
    toggleBalanceVisibility 
  } = useFinance();

  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{user?.displayName || "User"}</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            testID="dashboard-settings-button"
            onPress={() => router.push("/settings")}
          >
            <Settings color={Colors.gray500} size={24} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity onPress={toggleBalanceVisibility}>
              {hideBalance ? (
                <EyeOff color="#FFFFFF" size={20} />
              ) : (
                <Eye color="#FFFFFF" size={20} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {hideBalance ? "••••••" : `$${balance.toLocaleString()}`}
          </Text>
          <View style={styles.balanceFooter}>
            <View style={styles.balanceItem}>
              <TrendingUp color="#10B981" size={16} />
              <Text style={styles.balanceItemText}>
                +${monthlyIncome.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <TrendingDown color="#EF4444" size={16} />
              <Text style={styles.balanceItemText}>
                -${monthlyExpenses.toLocaleString()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Target color="#6366F1" size={20} />
            </View>
            <Text style={styles.statValue}>{savingsRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Savings Rate</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award color="#F59E0B" size={20} />
            </View>
            <Text style={styles.statValue}>{userPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Goals</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {goals.slice(0, 2).map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalAmount}>
                  ${goal.progress.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(goal.progress / goal.targetAmount) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.goalProgress}>
                {((goal.progress / goal.targetAmount) * 100).toFixed(1)}% complete
              </Text>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <TouchableOpacity 
            style={styles.insightCard}
            onPress={() => router.push("/(tabs)/learning")}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.insightGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Brain color="#FFFFFF" size={24} />
            </LinearGradient>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>
                You&apos;re spending 23% more on dining out this month
              </Text>
              <Text style={styles.insightSubtitle}>
                Tap to learn money-saving cooking tips
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/add-transaction")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#EF4444" }]}>
                <TrendingDown color="#FFFFFF" size={20} />
              </View>
              <Text style={styles.actionText}>Add Expense</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/add-transaction")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#10B981" }]}>
                <TrendingUp color="#FFFFFF" size={20} />
              </View>
              <Text style={styles.actionText}>Add Income</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/reports")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#6366F1" }]}>
                <BarChart3 color="#FFFFFF" size={20} />
              </View>
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.gray500,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.ink,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.9,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balanceItemText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.ink,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  goalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.ink,
    flex: 1,
  },
  goalAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  goalProgress: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: "500",
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 4,
  },
  insightSubtitle: {
    fontSize: 12,
    color: Colors.gray500,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.ink,
    textAlign: "center",
  },
});