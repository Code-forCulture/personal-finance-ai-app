import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { useFinance } from "@/providers/FinanceProvider";
import { Crown, Sparkles, BarChart3, BrainCircuit, Trophy, Lightbulb, ShieldCheck, Lock, Send, MessageSquare } from "lucide-react-native";

import { useAuth } from "@/providers/AuthProvider";
import Svg, { Path } from "react-native-svg";
import { generateText, generateObject, useRorkAgent, createRorkTool } from "@rork/toolkit-sdk";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

interface UserChallenge {
  id: string;
  title: string;
  targetDays: number;
  targetSavings: number;
  active: boolean;
}

function Sparkline({ data, width, height, stroke }: { data: number[]; width: number; height: number; stroke: string }) {
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const range = Math.max(1, max - min);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  let d = "";
  data.forEach((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function KPIBar({ label, value, maxValue }: { label: string; value: number; maxValue: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, maxValue)) * 100));
  return (
    <View style={styles.kpiCard}>
      <BarChart3 color={Colors.primary} size={20} />
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{pct}%</Text>
      <View style={styles.kpiBarBg}>
        <View style={[styles.kpiBarFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

export default function PremiumScreen() {
  const { transactions, monthlyIncome, monthlyExpenses } = useFinance();
  const { user, purchasePremium } = useAuth();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [lessons, setLessons] = useState<LessonSuggestion[]>([]);
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [newChallengeTitle, setNewChallengeTitle] = useState<string>("");
  const [newChallengeDays, setNewChallengeDays] = useState<string>("7");
  const [newChallengeSavings, setNewChallengeSavings] = useState<string>("50");
  const [aiSuggesting, setAiSuggesting] = useState<boolean>(false);
  const [advisorInput, setAdvisorInput] = useState<string>("");

  const addChallengeFromTool = useCallback((input: { title: string; targetDays?: number; targetSavings?: number }) => {
    const days = typeof input.targetDays === "number" && input.targetDays > 0 ? input.targetDays : 7;
    const savings = typeof input.targetSavings === "number" && input.targetSavings >= 0 ? input.targetSavings : 25;
    const c: UserChallenge = { id: `c-ai-${Date.now()}`, title: input.title.slice(0, 80), targetDays: days, targetSavings: savings, active: true };
    setChallenges(prev => [c, ...prev]);
  }, []);

  const advisor = useRorkAgent({
    tools: {
      addChallenge: createRorkTool({
        description: "Create a savings challenge for the user",
        zodSchema: z.object({
          title: z.string().describe("Short challenge title"),
          targetDays: z.number().int().min(1).max(365).optional(),
          targetSavings: z.number().int().min(0).max(100000).optional(),
        }),
        execute: async (input) => {
          addChallengeFromTool(input);
          return "challenge-added";
        },
      }),
    },
  });

  const expenseSeries = useMemo(() => {
    const sorted = [...transactions]
      .filter(t => t.type === "expense")
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 14)
      .reverse();
    return sorted.map(t => t.amount);
  }, [transactions]);

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
      const schema = z.object({
        insights: z.array(z.object({
          title: z.string(),
          description: z.string(),
          severity: z.enum(["info", "warning", "success"]).optional(),
        })).min(1).max(5),
        lessons: z.array(z.object({
          title: z.string(),
          duration: z.string().optional(),
          challenge: z.string(),
        })).min(1).max(5),
      });

      const result = await generateObject<typeof schema>({
        messages: [
          { role: "assistant", content: "You are a helpful, concise finance coach. Output must strictly follow the JSON schema." },
          { role: "user", content: `Given this snapshot, produce 3 insights and 3 mini-lessons with actionable challenges, tailored to the data. Snapshot: ${JSON.stringify({
            monthlyIncome,
            monthlyExpenses,
            last20: transactions.slice(0, 20).map(t => ({ type: t.type, amount: t.amount, category: t.category, date: t.date.toISOString() })),
          })}` },
        ],
        schema,
      });

      const parsedInsights: Insight[] = (result.insights ?? []).slice(0, 3).map((it, idx) => ({
        id: `i-${Date.now()}-${idx}`,
        title: it.title.slice(0, 80),
        description: it.description.slice(0, 300),
        severity: it.severity ?? (it.description.toLowerCase().includes("overspend") ? "warning" : "info"),
      }));

      const parsedLessons: LessonSuggestion[] = (result.lessons ?? []).slice(0, 3).map((ls, idx) => ({
        id: `l-${Date.now()}-${idx}`,
        title: ls.title.slice(0, 80),
        duration: ls.duration ?? "10-15 min",
        challenge: ls.challenge.slice(0, 300),
      }));

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
      if (Platform.OS !== 'web') {
        Alert.alert("AI Error", "Failed to generate insights. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [transactions, monthlyIncome, monthlyExpenses]);

  const suggestAIChallenges = useCallback(async () => {
    try {
      setAiSuggesting(true);
      const text = await generateText({
        messages: [
          { role: "assistant", content: "You are a concise personal finance coach." },
          { role: "user", content: `Given my recent expenses ${JSON.stringify(expenseSeries)}, suggest 3 short, trackable savings challenges with title and target days and estimated savings in dollars.` },
        ],
      });
      const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean).slice(0, 6);
      const parsed: UserChallenge[] = [];
      lines.forEach((l, i) => {
        const title = l.replace(/^[-*\d.\)\s]+/, "").slice(0, 60);
        const daysMatch = l.match(/(\d{1,3})\s*day/i);
        const saveMatch = l.match(/\$?\s*(\d{1,5})/);
        const targetDays = daysMatch?.[1] ? parseInt(daysMatch[1]!, 10) : 7;
        const targetSavings = saveMatch?.[1] ? parseInt(saveMatch[1]!, 10) : 25;
        parsed.push({ id: `c-ai-${Date.now()}-${i}`, title, targetDays, targetSavings, active: false });
      });
      if (parsed.length > 0) setChallenges(prev => [...prev, ...parsed]);
    } catch (e) {
      if (Platform.OS !== 'web') {
        Alert.alert("AI Error", "Couldn't suggest challenges right now.");
      }
    } finally {
      setAiSuggesting(false);
    }
  }, [expenseSeries]);

  const addCustomChallenge = useCallback(() => {
    const title = newChallengeTitle.trim();
    const daysNum = parseInt(newChallengeDays || "0", 10);
    const savingsNum = parseInt(newChallengeSavings || "0", 10);
    if (!title || daysNum <= 0 || savingsNum < 0) {
      Alert.alert("Invalid", "Provide a title, days (>0), and savings amount.");
      return;
    }
    const c: UserChallenge = { id: `c-${Date.now()}`, title, targetDays: daysNum, targetSavings: savingsNum, active: true };
    setChallenges(prev => [c, ...prev]);
    setNewChallengeTitle("");
    setNewChallengeDays("7");
    setNewChallengeSavings("50");
  }, [newChallengeTitle, newChallengeDays, newChallengeSavings]);

  const insets = useSafeAreaInsets();

  if (!user?.isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={[Colors.primary, Colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, styles.heroLockedOffset]}> 
          <View style={styles.heroBadge}>
            <Lock color="#FFFFFF" size={18} />
            <Text style={styles.heroBadgeText}>Premium Locked</Text>
          </View>
          <Text style={styles.heroTitle}>Unlock AI insights & advanced reports</Text>
          <Text style={styles.heroSubtitle}>Get KPI dashboards, sparklines, personalized lessons and challenges.</Text>
          <TouchableOpacity testID="unlock-premium" accessibilityRole="button" onPress={purchasePremium} style={styles.ctaButton}>
            <ShieldCheck color="#FFFFFF" size={18} />
            <Text style={styles.ctaText}>Unlock Premium</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <KPIBar label="Expense Rate" value={monthlyExpenses} maxValue={Math.max(1, monthlyIncome)} />
          <View style={styles.kpiCard}>
            <Trophy color={Colors.primary} size={20} />
            <Text style={styles.kpiLabel}>Last 5 Net</Text>
            <Text style={styles.kpiValue}>{(simpleTrends.lastFiveIncomeTotal - simpleTrends.lastFiveExpenseTotal).toLocaleString()}</Text>
            <View style={styles.sparkWrapper} testID="sparkline-wrapper">
              <Sparkline data={expenseSeries.length ? expenseSeries : [0]} width={140} height={40} stroke={Colors.primaryLight} />
            </View>
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
                <TouchableOpacity style={styles.startBtn} testID={`start-${l.id}`} onPress={() => {
                  const created: UserChallenge = { id: `c-from-lesson-${l.id}`, title: l.title, targetDays: 7, targetSavings: 25, active: true };
                  setChallenges(prev => [created, ...prev]);
                }}>
                  <Text style={styles.startBtnText}>Add Challenge</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Challenges</Text>
            <TouchableOpacity onPress={suggestAIChallenges} disabled={aiSuggesting} testID="ai-suggest-challenges" style={[styles.ctaButton, aiSuggesting && styles.ctaButtonDisabled]}>
              <Sparkles color="#FFFFFF" size={16} />
              <Text style={styles.ctaText}>{aiSuggesting ? "Suggesting..." : "AI Suggest"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.challengeForm}>
            <TextInput
              testID="challenge-title-input"
              placeholder="Challenge title"
              placeholderTextColor={Colors.gray500}
              value={newChallengeTitle}
              onChangeText={setNewChallengeTitle}
              style={styles.input}
            />
            <View style={styles.row}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Days</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={newChallengeDays}
                  onChangeText={setNewChallengeDays}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Target $</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={newChallengeSavings}
                  onChangeText={setNewChallengeSavings}
                  style={styles.input}
                />
              </View>
            </View>
            <TouchableOpacity testID="add-challenge" onPress={addCustomChallenge} style={[styles.ctaButton, { alignSelf: "stretch" }]}>
              <Text style={styles.ctaText}>Add Challenge</Text>
            </TouchableOpacity>
          </View>

          {challenges.length === 0 ? (
            <Text style={styles.muted}>No challenges yet. Create one or ask AI.</Text>
          ) : (
            challenges.map((c) => (
              <View key={c.id} style={styles.challengeCard}>
                <Text style={styles.challengeTitle}>{c.title}</Text>
                <Text style={styles.challengeMeta}>{c.targetDays} days • Save ${c.targetSavings}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Advisor</Text>
            <MessageSquare color={Colors.primary} size={18} />
          </View>
          <View style={styles.chatBox}>
            {advisor.messages.map((m) => (
              <View key={m.id} style={styles.chatMessage} testID={`msg-${m.id}`}>
                <Text style={styles.chatRole}>{m.role}</Text>
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return <Text key={`${m.id}-${i}`} style={styles.chatText}>{part.text}</Text>;
                  }
                  if (part.type === "tool") {
                    const state = part.state;
                    if (state === "input-streaming" || state === "input-available") {
                      return <Text key={`${m.id}-${i}`} style={styles.chatTool}>Calling {part.toolName}...</Text>;
                    }
                    if (state === "output-available") {
                      return <Text key={`${m.id}-${i}`} style={styles.chatTool}>Done: {JSON.stringify(part.output)}</Text>;
                    }
                    if (state === "output-error") {
                      return <Text key={`${m.id}-${i}`} style={styles.chatError}>Error: {part.errorText}</Text>;
                    }
                  }
                  return null;
                })}
              </View>
            ))}
            {advisor.error ? <Text style={styles.chatError}>Error: {String(advisor.error)}</Text> : null}
          </View>
          <View style={styles.chatInputRow}>
            <TextInput
              testID="advisor-input"
              placeholder="Ask the AI to review your spending or create a challenge..."
              placeholderTextColor={Colors.gray500}
              value={advisorInput}
              onChangeText={setAdvisorInput}
              style={[styles.input, styles.chatInput]}
            />
            <TouchableOpacity
              testID="advisor-send"
              style={styles.sendButton}
              onPress={() => {
                const msg = advisorInput.trim();
                if (!msg) return;
                setAdvisorInput("");
                advisor.sendMessage(`Context: income ${monthlyIncome}, expenses ${monthlyExpenses}. Recent: ${transactions.slice(0,10).map(t=>`${t.type} $${t.amount} ${t.category}`).join("; ")}.\n\nUser: ${msg}`);
              }}
            >
              <Send color="#FFFFFF" size={16} />
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
  scroll: {
    paddingBottom: 32,
  },
  hero: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  heroLockedOffset: {
    marginTop: 24,
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
  kpiBarBg: {
    marginTop: 6,
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 6,
    overflow: "hidden",
  },
  kpiBarFill: {
    height: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
  },
  sparkWrapper: {
    marginTop: 8,
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
  challengeForm: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  input: {
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: Colors.ink,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    color: Colors.gray500,
    fontSize: 12,
    marginBottom: 6,
  },
  challengeCard: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  challengeTitle: {
    color: Colors.ink,
    fontWeight: "700",
    marginBottom: 4,
  },
  challengeMeta: {
    color: Colors.gray500,
  },
  chatBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    maxHeight: 260,
    gap: 8,
  },
  chatMessage: {
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    padding: 8,
  },
  chatRole: {
    fontSize: 11,
    color: Colors.gray500,
    marginBottom: 4,
    fontWeight: "700",
  },
  chatText: {
    color: Colors.ink,
    fontSize: 13,
  },
  chatTool: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 4,
  },
  chatError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  chatInput: {
    flex: 1,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});