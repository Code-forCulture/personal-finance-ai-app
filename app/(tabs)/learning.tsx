import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Brain,
  BookOpen,
  Target,
  Award,
  Clock,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Play
} from "lucide-react-native";
import { useFinance } from "@/providers/FinanceProvider";
import { useChallenges } from "@/providers/ChallengesProvider";
import { Colors } from "@/constants/colors";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  completed: boolean;
  points: number;
}


const LESSONS: Lesson[] = [
  {
    id: "1",
    title: "Smart Grocery Shopping",
    description: "Learn how to reduce food expenses without compromising quality",
    duration: "5 min",
    difficulty: "Beginner",
    category: "Food & Dining",
    completed: false,
    points: 50,
  },
  {
    id: "2",
    title: "Building an Emergency Fund",
    description: "Step-by-step guide to creating financial security",
    duration: "8 min",
    difficulty: "Intermediate",
    category: "Savings",
    completed: true,
    points: 100,
  },
  {
    id: "3",
    title: "Investment Basics",
    description: "Understanding stocks, bonds, and diversification",
    duration: "12 min",
    difficulty: "Advanced",
    category: "Investing",
    completed: false,
    points: 150,
  },
];


export default function LearningScreen() {
  const [selectedTab, setSelectedTab] = useState<"lessons" | "challenges" | "ai">("lessons");
  const { userPoints, monthlyExpenses, getExpensesByCategory } = useFinance();
  const { challenges, addChallenge, completeChallenge, updateProgress, suggestChallengesFromAI, loadingSuggest } = useChallenges();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const generateAIInsight = async () => {
    setIsGeneratingInsight(true);
    
    try {
      const expensesByCategory = getExpensesByCategory();
      const topCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)[0];
      
      const messages = [
        {
          role: "system" as const,
          content: "You are a personal finance advisor. Provide a brief, actionable tip based on the user's spending data. Keep it under 100 words and focus on practical advice."
        },
        {
          role: "user" as const,
          content: `My monthly expenses are $${monthlyExpenses}. My highest spending category is ${topCategory?.[0] || "unknown"} at $${topCategory?.[1] || 0}. Give me a personalized money-saving tip.`
        }
      ];

      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      const data = await response.json();
      setAiInsight(data.completion);
    } catch (error) {
      Alert.alert("Error", "Failed to generate AI insight. Please try again.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const renderLessons = () => (
    <View style={styles.tabContent}>
      {LESSONS.map((lesson) => (
        <TouchableOpacity key={lesson.id} style={styles.lessonCard}>
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
          
          <View style={styles.lessonFooter}>
            <View style={styles.lessonMeta}>
              <Clock color={Colors.gray500} size={14} />
              <Text style={styles.lessonMetaText}>{lesson.duration}</Text>
              <Award color="#F59E0B" size={14} />
              <Text style={styles.lessonMetaText}>{lesson.points} pts</Text>
            </View>
            
            {lesson.completed ? (
              <View style={styles.completedBadge}>
                <CheckCircle color="#10B981" size={16} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.startButton}>
                <Play color={Colors.white} size={14} />
                <Text style={styles.startButtonText}>Start</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChallenges = () => {
    const [title, setTitle] = useState<string>("");
    const [targetAmount, setTargetAmount] = useState<string>("");
    const [category, setCategory] = useState<string>("");
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
    const [duration, setDuration] = useState<string>("7");

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
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Create Challenge</Text>
          <TextInput
            testID="challenge-title"
            style={styles.input}
            placeholder="Title (e.g., No Takeout Week)"
            placeholderTextColor={Colors.gray500}
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.rowGap}>
            <TextInput
              testID="challenge-target"
              style={[styles.input, styles.inputHalf]}
              placeholder="Target (e.g., 5)"
              placeholderTextColor={Colors.gray500}
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />
            <TextInput
              testID="challenge-category"
              style={[styles.input, styles.inputHalf]}
              placeholder="Category (optional)"
              placeholderTextColor={Colors.gray500}
              value={category}
              onChangeText={setCategory}
            />
          </View>
          <View style={styles.rowGap}>
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                testID={`period-${p}`}
                style={[styles.pill, period === p && styles.pillActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.pillText, period === p && styles.pillTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              testID="challenge-duration"
              style={[styles.input, styles.inputHalf]}
              placeholder="Days"
              placeholderTextColor={Colors.gray500}
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />
          </View>
          <View style={styles.challengeActionsRow}>
            <TouchableOpacity testID="create-challenge" style={styles.startButton} onPress={onCreate}>
              <Target color={Colors.white} size={14} />
              <Text style={styles.startButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="ai-suggest"
              style={[styles.startButton, { backgroundColor: "#8B5CF6" }]}
              onPress={suggestChallengesFromAI}
              disabled={loadingSuggest}
            >
              <Brain color={Colors.white} size={14} />
              <Text style={styles.startButtonText}>{loadingSuggest ? "Suggesting..." : "AI Suggest"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {challenges.length === 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>No challenges yet. Create one or let AI suggest.</Text>
          </View>
        )}

        {challenges.map((challenge) => {
          const total = Math.max(1, challenge.targetAmount);
          const pct = Math.min(100, Math.max(0, (challenge.progress / total) * 100));
          return (
            <View key={challenge.id} style={styles.challengeCard}>
              <LinearGradient
                colors={challenge.completed ? ["#10B981", "#059669"] : ["#3B82F6", "#2563EB"]}
                style={styles.challengeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.challengeHeader}>
                  <Target color={Colors.white} size={24} />
                  <Text style={styles.challengeReward}>{challenge.period.toUpperCase()}</Text>
                </View>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                {!!challenge.description && (
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                )}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(challenge.progress)}/{Math.round(total)}
                  </Text>
                </View>
                <View style={styles.actionsRow}>
                  {!challenge.completed ? (
                    <>
                      <TouchableOpacity
                        testID={`progress-${challenge.id}`}
                        style={styles.challengeButton}
                        onPress={() => updateProgress(challenge.id, Math.min(total, challenge.progress + 1))}
                      >
                        <Text style={styles.challengeButtonText}>+1 Progress</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`complete-${challenge.id}`}
                        style={[styles.challengeButton, { backgroundColor: "#10B981" }]}
                        onPress={() => completeChallenge(challenge.id)}
                      >
                        <Text style={[styles.challengeButtonText, { color: Colors.white }]}>Mark Done</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={[styles.completedBadge, { backgroundColor: "transparent" }]}>
                      <CheckCircle color="#10B981" size={16} />
                      <Text style={[styles.completedText, { color: Colors.white }]}>Completed</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </View>
    );
  };

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
      
      {aiInsight && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Lightbulb color="#F59E0B" size={20} />
            <Text style={styles.insightTitle}>Your Personalized Tip</Text>
          </View>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning Hub</Text>
        <View style={styles.pointsContainer}>
          <Award color="#F59E0B" size={20} />
          <Text style={styles.pointsText}>{userPoints} points</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "lessons" && styles.tabActive]}
          onPress={() => setSelectedTab("lessons")}
        >
          <BookOpen color={selectedTab === "lessons" ? Colors.white : Colors.gray500} size={18} />
          <Text style={[styles.tabText, selectedTab === "lessons" && styles.tabTextActive]}>Lessons</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === "challenges" && styles.tabActive]}
          onPress={() => setSelectedTab("challenges")}
        >
          <Target color={selectedTab === "challenges" ? Colors.white : Colors.gray500} size={18} />
          <Text style={[styles.tabText, selectedTab === "challenges" && styles.tabTextActive]}>Challenges</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === "ai" && styles.tabActive]}
          onPress={() => setSelectedTab("ai")}
        >
          <Brain color={selectedTab === "ai" ? Colors.white : Colors.gray500} size={18} />
          <Text style={[styles.tabText, selectedTab === "ai" && styles.tabTextActive]}>AI Advisor</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {selectedTab === "lessons" && renderLessons()}
        {selectedTab === "challenges" && renderChallenges()}
        {selectedTab === "ai" && renderAI()}
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 16,
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
  challengeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  challengeGradient: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  challengeReward: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  challengeTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  challengeDescription: {
    color: Colors.white,
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.white,
    borderRadius: 4,
  },
  progressText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "500",
  },
  challengeButton: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  challengeButtonInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  challengeButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.ink,
  },
  challengeActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  createCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.ink,
    borderWidth: 0,
    marginBottom: 10,
  },
  rowGap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  inputHalf: {
    flex: 1,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    color: Colors.gray500,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pillTextActive: {
    color: Colors.white,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  aiCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
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
});