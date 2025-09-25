import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3
} from "lucide-react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useFinance } from "@/providers/FinanceProvider";
import { Colors } from "@/constants/colors";

const { width } = Dimensions.get("window");

type DailyPoint = { label: string; amount: number; pct: number };

function Sparkline({ data, color }: { data: DailyPoint[]; color: string }) {
  const w = width - 40 - 40;
  const h = 80;
  const padding = 4;
  const values = data.map((d) => d.amount);
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const range = Math.max(1, max - min);
  const stepX = data.length > 1 ? (w - padding * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = h - padding - ((d.amount - min) / range) * (h - padding * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const last = points[points.length - 1] ?? { x: 0, y: h - padding };

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Path d={pathD} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={last.x} cy={last.y} r={3.5} fill={color} />
    </Svg>
  );
}

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("day");
  const { transactions, getExpensesByCategory, monthlyIncome, monthlyExpenses } = useFinance();

  const expensesByCategory = getExpensesByCategory();
  const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

  const periods = [
    { key: "day" as const, label: "Day" },
    { key: "week" as const, label: "Week" },
    { key: "month" as const, label: "Month" },
    { key: "year" as const, label: "Year" },
  ];

  const categoryColors = {
    food: "#EF4444",
    transport: Colors.primary,
    shopping: "#8B5CF6",
    bills: "#F59E0B",
    entertainment: "#10B981",
    health: "#EF4444",
    education: "#6366F1",
    coffee: "#92400E",
  } as const;

  const dailySeries = useMemo<DailyPoint[]>(() => {
    const days = 7;
    const now = new Date();
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    transactions.forEach((t) => {
      const key = t.date.toISOString().slice(0, 10);
      if (t.type === "expense" && map[key] !== undefined) {
        map[key] += t.amount;
      }
    });
    const entries = Object.entries(map);
    const max = entries.reduce((m, [, v]) => Math.max(m, v), 0);
    return entries.map(([dateKey, amount]) => ({
      label: new Date(dateKey).toLocaleDateString(undefined, { weekday: "short" }),
      amount,
      pct: max > 0 ? amount / max : 0,
    }));
  }, [transactions]);

  const kpis = useMemo(() => {
    const avgDaily = dailySeries.length > 0 ? dailySeries.reduce((s, d) => s + d.amount, 0) / dailySeries.length : 0;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];
    return [
      { label: "Spend MTD", value: `$${monthlyExpenses.toLocaleString()}`, sub: "This month", color: Colors.primary },
      { label: "Avg Daily", value: `$${avgDaily.toFixed(0)}`, sub: "Last 7 days", color: "#10B981" },
      { label: "Top Category", value: topCategory ? `${topCategory[0]}` : "—", sub: topCategory ? `$${topCategory[1].toFixed(0)}` : "No data", color: "#F59E0B" },
      { label: "Savings Rate", value: `${savingsRate.toFixed(0)}%`, sub: "Income vs Spend", color: "#6366F1" },
    ];
  }, [dailySeries, monthlyExpenses, monthlyIncome, monthlyExpenses, expensesByCategory]);

  const renderPieChart = () => {
    const categories = Object.entries(expensesByCategory);
    const segments = categories.map(([category, amount]) => {
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      return {
        category,
        amount,
        percentage,
        color: (categoryColors as Record<string, string>)[category] ?? "#6B7280",
      } as {
        category: string;
        amount: number;
        percentage: number;
        color: string;
      };
    });

    return (
      <View style={styles.chartContainer}>
        <View style={styles.pieChartWrapper}>
          {segments.map((segment) => (
            <View key={segment.category} style={styles.chartSegment}>
              <View
                style={[
                  styles.segmentBar,
                  {
                    backgroundColor: segment.color,
                    width: `${segment.percentage}%`,
                  },
                ]}
              />
              <View style={styles.segmentInfo}>
                <Text style={styles.segmentCategory}>
                  {segment.category.charAt(0).toUpperCase() + segment.category.slice(1)}
                </Text>
                <Text style={styles.segmentAmount}>
                  ${segment.amount.toLocaleString()} ({segment.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDailyBarChart = () => {
    const barMaxHeight = 140;
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Expenses (Last 7 days)</Text>
        <View style={styles.barRow}>
          {dailySeries.map((d, idx) => (
            <View key={`${d.label}-${idx}`} style={styles.barItem}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: Math.max(6, d.pct * barMaxHeight) }]} />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
              <Text style={styles.barValue}>${d.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Reports</Text>
          <Text style={styles.heroSubtitle}>Track, compare and optimize your spending</Text>
        </LinearGradient>

        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              testID={`period-${period.key}`}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period.key && styles.periodTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>KPIs</Text>
            <BarChart3 color={Colors.primary} size={20} />
          </View>
          <View style={styles.kpiGrid}>
            {kpis.map((k, idx) => (
              <View key={`${k.label}-${idx}`} style={styles.kpiCard} testID={`kpi-${idx}`}>
                <Text style={styles.kpiLabel}>{k.label}</Text>
                <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                <Text style={styles.kpiSub}>{k.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Sparkline</Text>
            <Calendar color={Colors.primary} size={20} />
          </View>
          <View style={[styles.chartContainer, { alignItems: "center" }]}>
            {dailySeries.length > 1 ? (
              <Sparkline data={dailySeries} color={Colors.primary} />)
            : (
              <Text style={styles.emptyStateSubtext}>Not enough data</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Report</Text>
            <Calendar color={Colors.primary} size={20} />
          </View>
          {renderDailyBarChart()}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Breakdown</Text>
            <PieChart color="#6366F1" size={20} />
          </View>
          {totalExpenses > 0 ? (
            renderPieChart()
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No expenses recorded yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start adding transactions to see your spending breakdown
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === "income" ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {transaction.type === "income" ? (
                    <TrendingUp color="#FFFFFF" size={16} />
                  ) : (
                    <TrendingDown color="#FFFFFF" size={16} />
                  )}
                </View>
                <View>
                  <Text style={styles.transactionCategory}>
                    {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {transaction.date.toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === "income" ? "#10B981" : "#EF4444" },
                ]}
              >
                {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  hero: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#E5E7EB",
    fontSize: 13,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.ink,
  },
  periodSelector: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray500,
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryAmount: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  netIncomeCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  netIncomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  netIncomeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray500,
  },
  netIncomeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  netIncomeAmount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  netIncomeSubtext: {
    fontSize: 12,
    color: "#6B7280",
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
  chartTitle: {
    fontSize: 14,
    color: Colors.gray500,
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pieChartWrapper: {
    gap: 12,
  },
  chartSegment: {
    marginBottom: 12,
  },
  segmentBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  segmentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  segmentCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  segmentAmount: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: "500",
  },
  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  barItem: {
    flex: 1,
    alignItems: "center",
  },
  barTrack: {
    width: "100%",
    height: 160,
    backgroundColor: Colors.tintSoft,
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  barLabel: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.gray500,
  },
  barValue: {
    fontSize: 11,
    color: Colors.ink,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: "center",
  },
  transactionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: Colors.gray500,
  },
});