import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { useFinance } from "@/providers/FinanceProvider";
import { Crown, Sparkles, BarChart3, BrainCircuit, Trophy, Lightbulb } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Insight {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "success";
}

interface LessonSuggestion {
  id: string;
  title: string;
  duration: string;
  challenge: string;
}

export default function PremiumScreen() {
  const { transactions, monthlyIncome, monthlyExpenses } = useFinance();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [lessons, setLessons] = useState<LessonSuggestion[]>([]);

  const expenseRate = useMemo(() => {
    const totalIncome = monthlyIncome || 0;
    const totalExpense = monthlyExpenses || 0;
    return totalIncome > 0 ? Math.min(1, totalExpense / totalIncome) : 0;
  }, [monthlyIncome, monthlyExpenses]);

  const simpleTrends = useMemo(() => {
    const last5 = transactions.slice(0, 5);
    const expenses = last5.filter(t => t.type === "expense");
    const incomes = last5.filter(t => t.type === "income");
    return {
      lastFiveExpenseTotal: expenses.reduce((s, t) => s + t.amount, 0),
      lastFiveIncomeTotal: incomes.reduce((s, t) => s + t.amount, 0),
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    };
  }, [transactions]);

  const generateAI = useCallback(async () => {
    try {
      setIsGenerating(true);
      console.log("[Premium] Generating AI insights with transaction snapshot", {
        count: transactions.length,
        monthlyIncome,
        monthlyExpenses,
      });

      const payload = {
        messages: [
          {
            role: "system",
            content:
              "You are a helpful finance coach. Analyze spending patterns from JSON and reply with a concise plan: 3 insights and 3 mini-lessons with short challenges. Keep it actionable and friendly.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Here is my snapshot: ${JSON.stringify({
                monthlyIncome,
                monthlyExpenses,
                last10: transactions.slice(0, 10).map(t => ({
                  type: t.type,
                  amount: t.amount,
                  category: t.category,
                  date: t.date.toISOString(),
                }))
              })}` },
            ],
          },
        ],
      };

      const res = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`AI request failed: ${res.status}`);
      }
      const data = (await res.json()) as { completion: string };
      const text = data.completion ?? "";
      console.log("[Premium] AI raw completion:", text);

      // Very light parser with validation
      const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
      const parsedInsights: Insight[] = [];
      const parsedLessons: LessonSuggestion[] = [];

      lines.forEach((raw, idx) => {
        if (!raw || raw.trim().length === 0) return;
        const line = raw.trim().slice(0, 300);
        const isLesson = /lesson|challenge/i.test(line);
        if (!isLesson && parsedInsights.length < 3) {
          parsedInsights.push({
            id: `i-${idx}`,
            title: line.replace(/^[-*\d.\)\s]+/, "").slice(0, 60),
            description: line,
            severity: line.toLowerCase().includes("high") || line.toLowerCase().includes("overspend") ? "warning" : "info",
          });
        } else if (isLesson && parsedLessons.length < 3) {
          parsedLessons.push({
            id: `l-${idx}`,
            title: line.replace(/^[-*\d.\)\s]+/, "").slice(0, 60),
            duration: "10-15 min",
            challenge: line,
          });
        }
      });

      if (parsedInsights.length === 0) {
        parsedInsights.push({ id: "fallback-i1", title: "Track recurring expenses", description: "Set category caps and review weekly.", severity: "info" });
      }
      if (parsedLessons.length === 0) {
        parsedLessons.push({ id: "fallback-l1", title: "No-spend challenge (48h)", duration: "15 min setup", challenge: "Avoid discretionary purchases for 2 days." });
      }

      setInsights(parsedInsights);
      setLessons(parsedLessons);
    } catch (e: any) {
      console.error("[Premium] AI generation error", e?.message);
      setInsights([
        { id: "e1", title: "AI unavailable", description: "Please try again later.", severity: "warning" },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [transactions, monthlyIncome, monthlyExpenses]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Crown color="#FFFFFF" size={18} />
            <Text style={styles.heroBadgeText}>Premium</Text>
          </View>
          <Text style={styles.heroTitle}>Smarter insights, faster progress</Text>
          <Text style={styles.heroSubtitle}>AI-powered reports, lessons, and challenges tailored to your spending.</Text>
          <TouchableOpacity
            testID="generate-ai-button"
            accessibilityRole="button"
            onPress={generateAI}
            disabled={isGenerating}
            style={[styles.ctaButton, isGenerating && styles.ctaButtonDisabled]}
          >
            <Sparkles color="#FFFFFF" size={18} />
            <Text style={styles.ctaText}>{isGenerating ? "Generating..." : "Generate AI Insights"}</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.cardsRow}>
          <View style={styles.kpiCard}>
            <BarChart3 color={Colors.primary} size={20} />
            <Text style={styles.kpiLabel}>Expense Rate</Text>
            <Text style={[styles.kpiValue, expenseRate > 0.8 ? styles.dangerText : styles.successText]}>{Math.round(expenseRate * 100)}%</Text>
          </View>
          <View style={styles.kpiCard}>
            <Trophy color={Colors.primary} size={20} />
            <Text style={styles.kpiLabel}>Last 5 Net</Text>
            <Text style={styles.kpiValue}>{(simpleTrends.lastFiveIncomeTotal - simpleTrends.lastFiveExpenseTotal).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <Sparkles color={Colors.primary} size={18} />
          </View>
          {insights.length === 0 ? (
            <Text style={styles.muted}>Tap Generate to get personalized insights.</Text>
          ) : (
            insights.map((i) => (
              <View key={i.id} style={styles.insightCard}>
                <View style={[styles.severityDot, i.severity === "warning" ? styles.dotWarning : i.severity === "success" ? styles.dotSuccess : styles.dotInfo]} />
                <View style={styles.flex1}>
                  <Text style={styles.insightTitle}>{i.title}</Text>
                  <Text style={styles.insightDesc}>{i.description}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mini-lessons & Challenges</Text>
            <Lightbulb color={Colors.primary} size={18} />
          </View>
          {lessons.length === 0 ? (
            <Text style={styles.muted}>Generate to unlock your tailored learning path.</Text>
          ) : (
            lessons.map((l) => (
              <View key={l.id} style={styles.lessonCard}>
                <BrainCircuit color={Colors.primary} size={18} />
                <View style={styles.flex1}>
                  <Text style={styles.lessonTitle}>{l.title}</Text>
                  <Text style={styles.lessonMeta}>{l.duration}</Text>
                  <Text style={styles.lessonChallenge}>{l.challenge}</Text>
                </View>
                <TouchableOpacity style={styles.startBtn} testID={`start-${l.id}`}>
                  <Text style={styles.startBtnText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
  scroll: {
    paddingBottom: 32,
  },
  hero: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
    gap: 6,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "#E5E7EB",
    fontSize: 14,
    marginBottom: 14,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiLabel: {
    color: Colors.gray500,
    fontWeight: "600",
    fontSize: 12,
  },
  kpiValue: {
    color: Colors.ink,
    fontWeight: "800",
    fontSize: 18,
  },
  dangerText: {
    color: "#EF4444",
  },
  successText: {
    color: "#10B981",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.ink,
  },
  muted: {
    color: Colors.gray500,
  },
  insightCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    marginTop: 6,
  },
  dotWarning: { backgroundColor: "#F59E0B" },
  dotSuccess: { backgroundColor: "#10B981" },
  dotInfo: { backgroundColor: Colors.primaryLight },
  insightTitle: {
    color: Colors.ink,
    fontWeight: "700",
    marginBottom: 4,
  },
  insightDesc: {
    color: Colors.gray500,
    fontSize: 13,
  },
  flex1: {
    flex: 1,
  },
  lessonCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  lessonTitle: {
    color: Colors.ink,
    fontWeight: "700",
  },
  lessonMeta: {
    color: Colors.gray500,
    fontSize: 12,
    marginBottom: 4,
  },
  lessonChallenge: {
    color: Colors.ink,
    fontSize: 13,
  },
  startBtn: {
    backgroundColor: Colors.tintSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "center",
  },
  startBtnText: {
    color: Colors.primary,
    fontWeight: "700",
  },
});