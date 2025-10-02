import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Brain,
  BookOpen,
  Target,
  Award,
  Clock,
  Lightbulb,
  CheckCircle,
  Play,
  Lock,
  ShieldCheck,
  Plus,
  CalendarDays,
  Tag,
} from "lucide-react-native";
import { useFinance } from "@/providers/FinanceProvider";
import { useChallenges } from "@/providers/ChallengesProvider";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { z } from "zod";
import { useRouter } from "expo-router";
import { apiFetch } from "@/lib/api";

interface LessonStep { title: string; detail: string; timeMinutes: number; }
interface LessonChecklistItem { id: string; text: string; done: boolean; }
interface LessonQuiz { question: string; options: string[]; answerIndex: number; explanation: string; }
interface LessonResource { title: string; url: string; }

interface Lesson {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  completed: boolean;
  points: number;
  content: string;
  objectives?: string[];
  steps?: LessonStep[];
  checklist?: LessonChecklistItem[];
  quiz?: LessonQuiz[];
  resources?: LessonResource[];
}

const FALLBACK_LESSONS: Lesson[] = [
  {
    id: "l1",
    title: "Smart Grocery Shopping",
    description: "Reduce food expenses without losing quality",
    durationMinutes: 7,
    difficulty: "Beginner",
    category: "Food & Dining",
    completed: false,
    points: 60,
    content: "Plan meals, use a list, compare unit prices, and buy store brands.",
    objectives: [
      "Cut grocery costs by 10–15%",
      "Reduce impulse buys",
      "Optimize pantry rotation",
    ],
    steps: [
      { title: "Plan 3 dinners", detail: "Pick budget-friendly recipes using overlapping ingredients.", timeMinutes: 10 },
      { title: "Build a list", detail: "Sort by store aisle; add only what recipes need.", timeMinutes: 5 },
      { title: "Compare unit prices", detail: "Check per-oz labels; pick store brands when equal.", timeMinutes: 5 },
    ],
    checklist: [
      { id: "c1", text: "Inventory pantry & fridge", done: false },
      { id: "c2", text: "Create recipe-led list", done: false },
      { id: "c3", text: "Avoid snack aisle detours", done: false },
    ],
    quiz: [
      { question: "What matters most for savings?", options: ["Brand name", "Unit price", "Package color", "Shelf height"], answerIndex: 1, explanation: "Unit price normalizes quantity across sizes and brands." }
    ],
    resources: [
      { title: "USDA Food Planning Budget", url: "https://www.fns.usda.gov/cnpp/usda-food-plans" },
    ],
  },
  {
    id: "l2",
    title: "Emergency Fund 101",
    description: "Create a 3–6 month safety net",
    durationMinutes: 10,
    difficulty: "Intermediate",
    category: "Savings",
    completed: false,
    points: 90,
    content: "Automate a weekly transfer. Park funds in a high-yield savings account.",
    objectives: ["Calculate target fund", "Automate contributions", "Choose HYSA"],
    steps: [
      { title: "Find your target", detail: "Monthly essentials × 3–6.", timeMinutes: 5 },
      { title: "Open HYSA", detail: "Prefer FDIC/NCUA and no monthly fees.", timeMinutes: 10 },
      { title: "Automate", detail: "Weekly transfer on payday.", timeMinutes: 3 },
    ],
    checklist: [
      { id: "c4", text: "List essential expenses", done: false },
      { id: "c5", text: "Pick HYSA provider", done: false },
    ],
    quiz: [
      { question: "Where should EF live?", options: ["Checking", "HYSA", "Brokerage", "Crypto"], answerIndex: 1, explanation: "HYSA keeps liquidity and fair yield." }
    ],
    resources: [
      { title: "What is HYSA?", url: "https://www.investopedia.com/terms/h/high-yield-savings-account.asp" },
    ],
  },
  {
    id: "l3",
    title: "Investment Basics",
    description: "Stocks, bonds, and diversification",
    durationMinutes: 14,
    difficulty: "Advanced",
    category: "Investing",
    completed: false,
    points: 140,
    content: "Start with low-cost index funds, rebalance yearly, and avoid timing the market.",
    objectives: ["Understand risk/return", "Use index funds", "Avoid concentration"],
    steps: [
      { title: "Define risk profile", detail: "Horizon, volatility tolerance.", timeMinutes: 6 },
      { title: "Pick core index funds", detail: "Domestic + international + bonds.", timeMinutes: 6 },
    ],
    checklist: [
      { id: "c6", text: "Enable auto-invest", done: false },
      { id: "c7", text: "Set rebalance reminder", done: false },
    ],
    resources: [
      { title: "Bogleheads Philosophy", url: "https://www.bogleheads.org/wiki/Bogleheads_investing_philosophy" },
    ],
  },
];

function ChallengesTab() {
  const { challenges, addChallenge, completeChallenge, updateProgress, suggestChallengesFromAI, loadingSuggest } = useChallenges();
  const [title, setTitle] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [duration, setDuration] = useState<string>("7");

  const canCreate = useMemo(() => title.trim().length > 0, [title]);

  const onCreate = async () => {
    const t = title.trim();
    const amt = Math.max(1, Math.floor(Number(targetAmount)) || 1);
    const cat = category.trim() || undefined;
    const dur = Math.max(1, Math.floor(Number(duration)) || 7);
    if (!t) return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + dur);
    await addChallenge({ title: t, description: undefined, targetAmount: amt, category: cat, period, startDate: start, endDate: end });
    setTitle("");
    setTargetAmount("");
    setCategory("");
    setDuration("7");
  };

  return (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={["#111827", "#0B1220"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.creatorGradient}
      >
        <Text style={styles.creatorTitle}>Create a Challenge</Text>
        <View style={styles.creatorRow}>
          <View style={styles.inputIconWrap}>
            <Target color={Colors.gray500} size={16} />
            <TextInput
              testID="challenge-title"
              style={styles.inputClear}
              placeholder="Title (e.g., No Takeout Week)"
              placeholderTextColor={Colors.gray500}
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>
        <View style={styles.creatorRowSplit}>
          <View style={[styles.inputIconWrap, styles.inputHalf]}>
            <Award color={Colors.gray500} size={16} />
            <TextInput
              testID="challenge-target"
              style={styles.inputClear}
              placeholder="Target (e.g., 5)"
              placeholderTextColor={Colors.gray500}
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />
          </View>
          <View style={[styles.inputIconWrap, styles.inputHalf]}>
            <Tag color={Colors.gray500} size={16} />
            <TextInput
              testID="challenge-category"
              style={styles.inputClear}
              placeholder="Category (optional)"
              placeholderTextColor={Colors.gray500}
              value={category}
              onChangeText={setCategory}
            />
          </View>
        </View>
        <View style={styles.creatorRowSplit}>
          <View style={styles.segmentGroup}>
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                testID={`period-${p}`}
                style={[styles.segment, period === p && styles.segmentActive]}
                onPress={() => {
                  if (p === "daily" || p === "weekly" || p === "monthly") {
                    setPeriod(p);
                  }
                }}
              >
                <Text style={[styles.segmentText, period === p && styles.segmentTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.inputIconWrap, styles.inputHalf]}>
            <CalendarDays color={Colors.gray500} size={16} />
            <TextInput
              testID="challenge-duration"
              style={styles.inputClear}
              placeholder="Days"
              placeholderTextColor={Colors.gray500}
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />
          </View>
        </View>
        <View style={styles.creatorActions}>
          <TouchableOpacity
            testID="create-challenge"
            style={[styles.ctaPrimary, !canCreate && styles.ctaDisabled]}
            onPress={onCreate}
            disabled={!canCreate}
          >
            <Plus color={Colors.white} size={16} />
            <Text style={styles.ctaPrimaryText}>Add Challenge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="ai-suggest"
            style={styles.ctaGhost}
            onPress={suggestChallengesFromAI}
            disabled={loadingSuggest}
          >
            <Brain color={Colors.white} size={16} />
            <Text style={styles.ctaGhostText}>{loadingSuggest ? "Suggesting..." : "AI Suggest"}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {challenges.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No challenges yet</Text>
          <Text style={styles.emptySubtitle}>Create one above or let AI suggest based on your spending.</Text>
        </View>
      )}

      {challenges.map((challenge) => {
        const total = Math.max(1, challenge.targetAmount);
        const pctNum = Math.min(100, Math.max(0, (challenge.progress / total) * 100));
        const pct = `${pctNum}%` as const;
        const now = new Date();
        const end = new Date(challenge.endDate);
        const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return (
          <View key={challenge.id} style={styles.challengeCardModern}>
            <View style={styles.challengeTopRow}>
              <View style={styles.badgeRow}>
                <View style={styles.badgeSoft}>
                  <Target color={Colors.primary} size={14} />
                  <Text style={styles.badgeSoftText}>{challenge.period}</Text>
                </View>
                {challenge.category ? (
                  <View style={styles.badgeSoftAlt}>
                    <Tag color={Colors.gray600} size={12} />
                    <Text style={styles.badgeSoftAltText}>{challenge.category}</Text>
                  </View>
                ) : null}
              </View>
              {challenge.completed ? (
                <View style={styles.completedBadge}>
                  <CheckCircle color="#10B981" size={16} />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              ) : (
                <View style={styles.daysLeft}>
                  <CalendarDays color={Colors.gray600} size={14} />
                  <Text style={styles.daysLeftText}>{daysLeft}d left</Text>
                </View>
              )}
            </View>

            <Text style={styles.challengeTitleModern}>{challenge.title}</Text>
            {!!challenge.description && (
              <Text style={styles.challengeDescModern}>{challenge.description}</Text>
            )}

            <View style={styles.progressWrapModern}>
              <View style={styles.progressTrackModern}>
                <LinearGradient
                  colors={["#60A5FA", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFillModern, { width: pct }]}
                />
              </View>
              <Text style={styles.progressTextModern}>
                {Math.round(challenge.progress)}/{Math.round(total)}
              </Text>
            </View>

            {!challenge.completed ? (
              <View style={styles.actionsRowModern}>
                <TouchableOpacity
                  testID={`progress-${challenge.id}`}
                  style={styles.actionLight}
                  onPress={() => updateProgress(challenge.id, Math.min(total, challenge.progress + 1))}
                >
                  <Plus color={Colors.primary} size={16} />
                  <Text style={styles.actionLightText}>+1 Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`complete-${challenge.id}`}
                  style={styles.actionSuccess}
                  onPress={() => completeChallenge(challenge.id)}
                >
                  <CheckCircle color={Colors.white} size={16} />
                  <Text style={styles.actionSuccessText}>Mark Done</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default function LearningScreen() {
  const [selectedTab, setSelectedTab] = useState<"lessons" | "challenges" | "ai">("lessons");
  const { userPoints, monthlyExpenses, getExpensesByCategory } = useFinance();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState<boolean>(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState<boolean>(false);
  const [sheetTab, setSheetTab] = useState<"Overview" | "Steps" | "Checklist" | "Quiz" | "Resources">("Overview");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [checkStates, setCheckStates] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const router = useRouter();

  const generateAIInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const expensesByCategory = getExpensesByCategory();
      const topCategory = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)[0];

      const messages = [
        {
          role: "system" as const,
          content:
            "You are a personal finance advisor. Provide a brief, actionable tip based on the user's spending data. Keep it under 100 words and focus on practical advice.",
        },
        {
          role: "user" as const,
          content: `My monthly expenses are ${monthlyExpenses}. My highest spending category is ${topCategory?.[0] || "unknown"} at ${topCategory?.[1] || 0}. Give me a personalized money-saving tip.`,
        },
      ];

      const response = await apiFetch("/openai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, model: "gpt-4o-mini" }),
      });

      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const text = data?.choices?.[0]?.message?.content ?? "";
      setAiInsight(text);
    } catch {
      if (Platform.OS === "web") {
        console.error("Failed to generate AI insight. Please try again.");
      } else {
        Alert.alert("Error", "Failed to generate AI insight. Please try again.");
      }
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const generateLessonsFromAI = useCallback(async () => {
    try {
      setIsGeneratingLessons(true);
      const byCategory = getExpensesByCategory();
      const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

      const schema = z.object({
        lessons: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string(),
              content: z.string(),
              durationMinutes: z.number().min(3).max(30),
              difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
              category: z.string(),
              points: z.number().min(20).max(300),
              objectives: z.array(z.string()).optional(),
              steps: z
                .array(
                  z.object({
                    title: z.string(),
                    detail: z.string(),
                    timeMinutes: z.number().min(1).max(30),
                  })
                )
                .optional(),
              checklist: z
                .array(
                  z.object({
                    id: z.string(),
                    text: z.string(),
                    done: z.boolean().optional(),
                  })
                )
                .optional(),
              quiz: z
                .array(
                  z.object({
                    question: z.string(),
                    options: z.array(z.string()).min(2),
                    answerIndex: z.number().int().nonnegative(),
                    explanation: z.string(),
                  })
                )
                .optional(),
              resources: z
                .array(
                  z.object({
                    title: z.string(),
                    url: z.string(),
                  })
                )
                .optional(),
            })
          )
          .min(3)
          .max(6),
      });

      const userPrompt = [
        { role: "system" as const, content: "Return strict JSON with a lessons array only. Lessons must be actionable and personalized. Include objectives, steps with timeMinutes, checklist, a short quiz, and resources when relevant." },
        { role: "user" as const, content: `Create financial lessons tailored to my spending. Input: ${JSON.stringify({ monthlyExpenses, topCategory: top?.[0] ?? "unknown", topAmount: top?.[1] ?? 0, byCategory })}` },
      ];

      const response = await apiFetch("/openai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: userPrompt, model: "gpt-4o-mini", response_format: "json_object" }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.log("[Learning] OpenAI proxy error", detail);
        setLessons(FALLBACK_LESSONS);
        return;
      }

      const data = (await response.json()) as { choices?: { message?: { content?: string } }[]; error?: unknown };
      const content = data?.choices?.[0]?.message?.content ?? "";

      if (!content) {
        console.log("[Learning] Empty AI content, using fallback");
        setLessons(FALLBACK_LESSONS);
        return;
      }

      let json: unknown;
      try {
        json = JSON.parse(content);
      } catch (e) {
        console.log("[Learning] Failed to parse AI JSON", e);
        setLessons(FALLBACK_LESSONS);
        return;
      }

      const parsed = schema.safeParse(json);

      if (!parsed.success) {
        console.log("[Learning] AI JSON invalid, fallback", parsed.error?.flatten?.());
        setLessons(FALLBACK_LESSONS);
        return;
      }

      const created: Lesson[] = parsed.data.lessons.map((l, li) => ({
        ...l,
        completed: false,
        objectives: l.objectives ?? [],
        steps: l.steps ?? [],
        checklist: (l.checklist ?? []).map((item, idx) => ({
          id: item.id ?? `${l.id}-chk-${idx}`,
          text: item.text,
          done: item.done ?? false,
        })),
        quiz: l.quiz ?? [],
        resources: l.resources ?? [],
        id: l.id || `lesson-${li}`,
      }));
      setLessons(created);
      console.log("[Learning] AI lessons generated", created.length);
    } catch (e) {
      console.error("[Learning] generateLessonsFromAI error", e);
      setLessons(FALLBACK_LESSONS);
    } finally {
      setIsGeneratingLessons(false);
    }
  }, [getExpensesByCategory, monthlyExpenses]);

  useEffect(() => {
    if (lessons.length === 0) {
      void generateLessonsFromAI();
    }
  }, [lessons.length, generateLessonsFromAI]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedLessonId((prev) => (prev === id ? null : id));
  }, []);

  const markLessonCompleted = useCallback((id: string) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, completed: true } : l)));
  }, []);

  const renderLessons = () => (
    <View style={styles.tabContent}>
      <View style={styles.lessonsHeaderRow}>
        <Text style={styles.lessonsHeaderTitle}>Personalized Lessons</Text>
        <TouchableOpacity
          testID="regen-lessons"
          style={[styles.generateButton, isGeneratingLessons && { opacity: 0.7 }]}
          disabled={isGeneratingLessons}
          onPress={generateLessonsFromAI}
        >
          <Lightbulb color="#8B5CF6" size={20} />
          <Text style={styles.generateButtonText}>{isGeneratingLessons ? "Refreshing..." : "Regenerate"}</Text>
        </TouchableOpacity>
      </View>

      {lessons.map((lesson) => {
        const isExpanded = expandedLessonId === lesson.id;
        return (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            activeOpacity={0.9}
            onPress={() => toggleExpand(lesson.id)}
            testID={`lesson-${lesson.id}`}
          >
            <View style={styles.lessonHeader}>
              <View style={styles.lessonIcon}>
                <BookOpen color={Colors.primary} size={20} />
              </View>
              <View style={styles.lessonBadge}>
                <Text style={styles.lessonBadgeText}>{lesson.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.lessonDescription}>{lesson.description}</Text>

            {isExpanded ? (
              <View>
                {Array.isArray(lesson.objectives) && lesson.objectives?.length ? (
                  <View style={styles.mb8}>
                    <Text style={styles.sectionLabel}>Objectives</Text>
                    {lesson.objectives.map((o, idx) => (
                      <Text key={`${lesson.id}-obj-${idx}`} style={styles.objectiveText}>• {o}</Text>
                    ))}
                  </View>
                ) : null}
                <Text style={styles.lessonContent}>{lesson.content}</Text>
              </View>
            ) : null}

            <View style={styles.lessonFooter}>
              <View style={styles.lessonMeta}>
                <Clock color={Colors.gray500} size={14} />
                <Text style={styles.lessonMetaText}>{lesson.durationMinutes} min</Text>
                <Award color="#F59E0B" size={14} />
                <Text style={styles.lessonMetaText}>{lesson.points} pts</Text>
              </View>

              {lesson.completed ? (
                <View style={styles.completedBadge}>
                  <CheckCircle color="#10B981" size={16} />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => {
                    setActiveLessonId(lesson.id);
                    setSheetTab("Overview");
                  }}
                  testID={`start-${lesson.id}`}
                >
                  <Play color={Colors.white} size={14} />
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderAI = () => (
    <View style={styles.tabContent}>
      <View style={styles.aiCard}>
        <LinearGradient
          colors={["#8B5CF6", "#7C3AED"]}
          style={styles.aiGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Brain color={Colors.white} size={32} />
          <Text style={styles.aiTitle}>AI Financial Advisor</Text>
          <Text style={styles.aiSubtitle}>
            Get personalized insights based on your spending patterns
          </Text>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateAIInsight}
            disabled={isGeneratingInsight}
          >
            <Lightbulb color="#8B5CF6" size={20} />
            <Text style={styles.generateButtonText}>
              {isGeneratingInsight ? "Generating..." : "Generate Insight"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {aiInsight ? (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Lightbulb color="#F59E0B" size={20} />
            <Text style={styles.insightTitle}>Your Personalized Tip</Text>
          </View>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderLockedChallenges = () => (
    <View style={styles.tabContent}>
      <View style={styles.lockedHero} testID="locked-premium-learning">
        <View style={styles.lockBadge}>
          <Lock color="#FFFFFF" size={18} />
          <Text style={styles.lockBadgeText}>Premium Only</Text>
        </View>
        <Text style={styles.lockTitle}>Challenges require Premium</Text>
        <Text style={styles.lockSubtitle}>
          Unlock personalized challenges and AI goals tailored to your spending.
        </Text>
        <TouchableOpacity
          testID="go-premium"
          onPress={() => router.push("/premium")}
          style={styles.lockCta}
          accessibilityRole={Platform.OS === "web" ? undefined : ("button" as const)}
        >
          <ShieldCheck color="#FFFFFF" size={18} />
          <Text style={styles.lockCtaText}>Go to Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning Hub</Text>
        <View style={styles.pointsContainer}>
          <Award color="#F59E0B" size={20} />
          <Text style={styles.pointsText}>{userPoints} points</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          testID="tab-lessons"
          style={[styles.tab, selectedTab === "lessons" && styles.tabActive]}
          onPress={() => setSelectedTab("lessons")}
        >
          <BookOpen
            color={selectedTab === "lessons" ? Colors.white : Colors.gray500}
            size={18}
          />
          <Text style={[styles.tabText, selectedTab === "lessons" && styles.tabTextActive]}>Lessons</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-challenges"
          style={[styles.tab, selectedTab === "challenges" && styles.tabActive]}
          onPress={() => setSelectedTab("challenges")}
        >
          <Target
            color={selectedTab === "challenges" ? Colors.white : Colors.gray500}
            size={18}
          />
          <Text style={[styles.tabText, selectedTab === "challenges" && styles.tabTextActive]}>Challenges</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-ai"
          style={[styles.tab, selectedTab === "ai" && styles.tabActive]}
          onPress={() => setSelectedTab("ai")}
        >
          <Brain color={selectedTab === "ai" ? Colors.white : Colors.gray500} size={18} />
          <Text style={[styles.tabText, selectedTab === "ai" && styles.tabTextActive]}>AI Advisor</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {selectedTab === "lessons" && renderLessons()}
        {selectedTab === "challenges" && (user?.isPremium ? <ChallengesTab /> : renderLockedChallenges())}
        {selectedTab === "ai" && renderAI()}
      </ScrollView>

      {activeLessonId ? (
        <View style={styles.sheetBackdrop} testID="lesson-sheet">
          <View style={styles.sheet}>
            {(() => {
              const lesson = lessons.find((l) => l.id === activeLessonId);
              if (!lesson) return null;

              const quizKeyBase = `quiz-${lesson.id}` as const;

              return (
                <View>
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{lesson.title}</Text>
                    <TouchableOpacity onPress={() => setActiveLessonId(null)} testID="close-lesson">
                      <Text style={styles.sheetClose}>Close</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sheetTabsBar} contentContainerStyle={styles.sheetTabsBarContent}>
                    {(["Overview", "Steps", "Checklist", "Quiz", "Resources"] as const).map((t) => (
                      <TouchableOpacity key={t} onPress={() => setSheetTab(t)} style={[styles.tabPill, sheetTab === t && styles.tabPillActive]} testID={`sheet-tab-${t.toLowerCase()}`}>
                        <Text style={[styles.tabPillText, sheetTab === t && styles.tabPillTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {sheetTab === "Overview" ? (
                    <View>
                      <Text style={styles.lessonDescription}>{lesson.description}</Text>
                      {Array.isArray(lesson.objectives) && lesson.objectives?.length ? (
                        <View style={styles.mb10}>
                          <Text style={styles.sectionLabel}>Objectives</Text>
                          {lesson.objectives.map((o, idx) => (
                            <Text key={`${lesson.id}-ov-obj-${idx}`} style={styles.objectiveText}>• {o}</Text>
                          ))}
                        </View>
                      ) : null}
                      <Text style={styles.lessonContent}>{lesson.content}</Text>
                    </View>
                  ) : null}

                  {sheetTab === "Steps" ? (
                    <View>
                      {Array.isArray(lesson.steps) && lesson.steps?.length ? (
                        <View style={styles.gap8}>
                          {lesson.steps.map((s, idx) => (
                            <View key={`${lesson.id}-step-${idx}`} style={styles.stepCard}>
                              <View style={styles.rowBetweenMb6}>
                                <Text style={styles.stepTitle}>{idx + 1}. {s.title}</Text>
                                <View style={styles.rowCenterGap6}>
                                  <Clock color={Colors.gray500} size={12} />
                                  <Text style={styles.stepTime}>{s.timeMinutes} min</Text>
                                </View>
                              </View>
                              <Text style={styles.stepDetail}>{s.detail}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.muted}>No steps for this lesson.</Text>
                      )}
                    </View>
                  ) : null}

                  {sheetTab === "Checklist" ? (
                    <View>
                      {Array.isArray(lesson.checklist) && lesson.checklist?.length ? (
                        <View style={styles.gap8}>
                          {lesson.checklist.map((c) => {
                            const current = checkStates[c.id] ?? c.done ?? false;
                            return (
                              <TouchableOpacity
                                key={c.id}
                                style={[styles.checkItem, current && styles.checkItemDone]}
                                onPress={() => setCheckStates((prev) => ({ ...prev, [c.id]: !current }))}
                                testID={`check-${c.id}`}
                              >
                                <CheckCircle color={current ? "#10B981" : Colors.gray400} size={18} />
                                <Text style={[styles.checkText, current && styles.checkTextDone]}>{c.text}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={styles.muted}>No checklist items.</Text>
                      )}
                    </View>
                  ) : null}

                  {sheetTab === "Quiz" ? (
                    <View>
                      {Array.isArray(lesson.quiz) && lesson.quiz?.length ? (
                        <View style={styles.gap16}>
                          {lesson.quiz.map((q, qIdx) => {
                            const qKey = `${quizKeyBase}-${qIdx}`;
                            const selected = quizAnswers[qKey] ?? null;
                            return (
                              <View key={qKey} style={styles.quizCard}>
                                <Text style={styles.quizQuestion}>{qIdx + 1}. {q.question}</Text>
                                <View style={styles.gap8}>
                                  {q.options.map((opt, oIdx) => {
                                    const active = selected === oIdx;
                                    return (
                                      <TouchableOpacity
                                        key={`${qKey}-opt-${oIdx}`}
                                        style={[styles.quizOption, active && styles.quizOptionActive]}
                                        onPress={() => setQuizAnswers((prev) => ({ ...prev, [qKey]: oIdx }))}
                                        testID={`${qKey}-opt-${oIdx}`}
                                      >
                                        <Text style={[styles.quizOptionText, active && styles.quizOptionTextActive]}>{opt}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                                {selected !== null ? (
                                  <Text style={selected === q.answerIndex ? styles.quizCorrect : styles.quizWrong}>
                                    {selected === q.answerIndex ? "Correct" : "Try again"}
                                  </Text>
                                ) : null}
                                {selected !== null ? (
                                  <Text style={styles.quizExplain}>{q.explanation}</Text>
                                ) : null}
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={styles.muted}>No quiz for this lesson.</Text>
                      )}
                    </View>
                  ) : null}

                  {sheetTab === "Resources" ? (
                    <View>
                      {Array.isArray(lesson.resources) && lesson.resources?.length ? (
                        <View style={styles.gap8}>
                          {lesson.resources.map((r, idx) => (
                            <View key={`${lesson.id}-res-${idx}`} style={styles.resourceItem}>
                              <Text style={styles.resourceTitle}>{r.title}</Text>
                              <Text style={styles.resourceLink} numberOfLines={1}>{r.url}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.muted}>No resources attached.</Text>
                      )}
                    </View>
                  ) : null}

                  <View style={[styles.lessonFooter, styles.mt16]}>
                    <View style={styles.lessonMeta}>
                      <Clock color={Colors.gray500} size={14} />
                      <Text style={styles.lessonMetaText}>{lesson.durationMinutes} min</Text>
                      <Award color="#F59E0B" size={14} />
                      <Text style={styles.lessonMetaText}>{lesson.points} pts</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => {
                        markLessonCompleted(lesson.id);
                        setActiveLessonId(null);
                      }}
                      testID="complete-lesson"
                    >
                      <CheckCircle color={Colors.white} size={14} />
                      <Text style={styles.startButtonText}>Mark Complete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      ) : null}
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.ink,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.tintSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray500,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  lessonCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lessonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.tintSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  lessonBadge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lessonBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.gray500,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 14,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonContent: {
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 20,
    backgroundColor: Colors.gray100,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gray600,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  objectiveText: {
    fontSize: 13,
    color: Colors.gray700,
    marginBottom: 4,
  },
  lessonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lessonMetaText: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: "500",
    marginRight: 8,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  startButtonText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: "600",
  },
  creatorGradient: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  creatorTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  creatorRow: {
    marginBottom: 10,
  },
  creatorRowSplit: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
    marginBottom: 10,
  },
  inputIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inputClear: {
    flex: 1,
    color: Colors.white,
    padding: 0,
  },
  inputHalf: {
    flex: 1,
  },
  segmentGroup: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: Colors.white,
  },
  segmentText: {
    color: "#E5E7EB",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: Colors.ink,
  },
  creatorActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaPrimaryText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  ctaGhost: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  ctaGhostText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.ink,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.gray600,
  },
  challengeCardModern: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  badgeSoft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.tintSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeSoftText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },
  badgeSoftAlt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeSoftAltText: {
    color: Colors.gray700,
    fontWeight: "700",
    fontSize: 12,
  },
  daysLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  daysLeftText: {
    color: Colors.gray700,
    fontWeight: "700",
    fontSize: 12,
  },
  challengeTitleModern: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.ink,
    marginBottom: 6,
  },
  challengeDescModern: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 12,
  },
  progressWrapModern: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  progressTrackModern: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFillModern: {
    height: "100%",
    borderRadius: 999,
  },
  progressTextModern: {
    width: 72,
    textAlign: "right",
    color: Colors.gray700,
    fontWeight: "700",
  },
  actionsRowModern: {
    flexDirection: "row",
    gap: 10,
  },
  actionLight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.gray100,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionLightText: {
    color: Colors.primary,
    fontWeight: "800",
  },
  actionSuccess: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionSuccessText: {
    color: Colors.white,
    fontWeight: "800",
  },
  aiCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  lessonsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  lessonsHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.ink,
  },
  aiGradient: {
    padding: 24,
    alignItems: "center",
  },
  aiTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  aiSubtitle: {
    color: Colors.white,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 20,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedHero: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: Colors.primary,
  },
  lockBadge: {
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
  lockBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  lockTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  lockSubtitle: {
    color: "#E5E7EB",
    fontSize: 14,
    marginBottom: 14,
  },
  lockCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  lockCtaText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.ink,
  },
  insightText: {
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 20,
  },
  sheetBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: 520,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  gap8: { gap: 8 },
  gap16: { gap: 16 },
  rowBetweenMb6: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowCenterGap6: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mt16: { marginTop: 16 },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.ink,
  },
  sheetClose: {
    color: Colors.primary,
    fontWeight: "700",
  },
  sheetTabsBar: {
    marginBottom: 12,
  },
  sheetTabsBarContent: {
    flexDirection: "row",
    gap: 8,
  },
  tabPill: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
  },
  tabPillText: {
    color: Colors.gray700,
    fontWeight: "700",
    fontSize: 12,
  },
  tabPillTextActive: {
    color: Colors.white,
  },
  stepCard: {
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 12,
  },
  stepTitle: {
    color: Colors.ink,
    fontWeight: "800",
  },
  stepTime: {
    color: Colors.gray600,
    fontWeight: "700",
    fontSize: 12,
  },
  stepDetail: {
    color: Colors.gray700,
    fontSize: 13,
  },
  muted: {
    color: Colors.gray600,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.gray100,
    padding: 12,
    borderRadius: 12,
  },
  checkItemDone: {
    backgroundColor: "#ECFDF5",
  },
  checkText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  checkTextDone: {
    color: "#065F46",
  },
  quizCard: {
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 12,
  },
  quizQuestion: {
    color: Colors.ink,
    fontWeight: "800",
    marginBottom: 8,
  },
  quizOption: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quizOptionActive: {
    backgroundColor: Colors.primary,
  },
  quizOptionText: {
    color: Colors.ink,
    fontWeight: "600",
  },
  quizOptionTextActive: {
    color: Colors.white,
  },
  quizCorrect: {
    color: "#065F46",
    fontWeight: "800",
    marginTop: 8,
  },
  quizWrong: {
    color: "#991B1B",
    fontWeight: "800",
    marginTop: 8,
  },
  quizExplain: {
    color: Colors.gray700,
    marginTop: 4,
  },
  resourceItem: {
    backgroundColor: Colors.gray100,
    padding: 12,
    borderRadius: 12,
  },
  resourceTitle: {
    color: Colors.ink,
    fontWeight: "800",
  },
  resourceLink: {
    color: Colors.primary,
  },
});
