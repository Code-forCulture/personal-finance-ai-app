import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useFinance } from "@/providers/FinanceProvider";
import { z } from "zod";
import { generateObject } from "@rork/toolkit-sdk";

export type ChallengePeriod = "daily" | "weekly" | "monthly";

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  category?: string;
  period: ChallengePeriod;
  startDate: Date;
  endDate: Date;
  progress: number;
  completed: boolean;
  aiSuggested: boolean;
  createdAt: Date;
}

const mockStorage = {
  data: {} as Record<string, string>,
  async getItem(key: string): Promise<string | null> {
    return this.data[key] || null;
  },
  async setItem(key: string, value: string): Promise<void> {
    this.data[key] = value;
  },
  async removeItem(key: string): Promise<void> {
    delete this.data[key];
  },
};

export const [ChallengesProvider, useChallenges] = createContextHook(() => {
  const { transactions } = useFinance();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const storage = mockStorage;

  const load = useCallback(async () => {
    try {
      const raw = await storage.getItem("challenges");
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw) as unknown as Challenge[];
        const normalized = parsed.map((c) => ({
          ...c,
          startDate: new Date((c as unknown as { startDate: string }).startDate),
          endDate: new Date((c as unknown as { endDate: string }).endDate),
          createdAt: new Date((c as unknown as { createdAt: string }).createdAt),
        }));
        setChallenges(normalized);
      } else {
        setChallenges([]);
      }
    } catch (e) {
      console.error("[ChallengesProvider] load error", e);
      setChallenges([]);
    } finally {
      setIsHydrated(true);
    }
  }, [storage]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async (next: Challenge[]) => {
    setChallenges(next);
    await storage.setItem("challenges", JSON.stringify(next));
  }, [storage]);

  const addChallenge = useCallback(async (input: Omit<Challenge, "id" | "createdAt" | "progress" | "completed" | "aiSuggested"> & { aiSuggested?: boolean }) => {
    const item: Challenge = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
      progress: 0,
      completed: false,
      aiSuggested: Boolean(input.aiSuggested),
    };
    const next = [item, ...challenges];
    await persist(next);
    return item;
  }, [challenges, persist]);

  const updateProgress = useCallback(async (id: string, progress: number) => {
    const next = challenges.map((c) => c.id === id ? { ...c, progress, completed: progress >= c.targetAmount } : c);
    await persist(next);
  }, [challenges, persist]);

  const completeChallenge = useCallback(async (id: string) => {
    const next = challenges.map((c) => c.id === id ? { ...c, progress: c.targetAmount, completed: true } : c);
    await persist(next);
  }, [challenges, persist]);

  const removeChallenge = useCallback(async (id: string) => {
    const next = challenges.filter((c) => c.id !== id);
    await persist(next);
  }, [challenges, persist]);

  const suggestChallengesFromAI = useCallback(async () => {
    try {
      setLoadingSuggest(true);
      const recent = transactions
        .filter((t) => t.type === "expense")
        .slice(0, 50)
        .map((t) => ({ amount: t.amount, category: t.category, date: t.date.toISOString() }));

      const schema = z.object({
        challenges: z.array(z.object({
          title: z.string(),
          description: z.string().optional(),
          targetAmount: z.number().min(1),
          category: z.string().optional(),
          period: z.enum(["daily", "weekly", "monthly"]),
          durationDays: z.number().min(1).max(90),
        })).min(1).max(5),
      });

      const result = await generateObject({
        messages: [
          { role: "user", content: [
            { type: "text", text: "Given recent spending, propose concrete money-saving challenges." },
            { type: "text", text: JSON.stringify({ recent }) },
          ] },
        ],
        schema,
      });

      const now = new Date();
      const created: Challenge[] = (result as { challenges: { title: string; description?: string; targetAmount: number; category?: string; period: ChallengePeriod; durationDays: number; }[] }).challenges.map((r) => {
        const start = new Date(now);
        const end = new Date(now);
        end.setDate(end.getDate() + r.durationDays);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: r.title,
          description: r.description,
          targetAmount: r.targetAmount,
          category: r.category,
          period: r.period,
          startDate: start,
          endDate: end,
          progress: 0,
          completed: false,
          aiSuggested: true,
          createdAt: new Date(),
        } as Challenge;
      });

      const next = [...created, ...challenges];
      await persist(next);
      return created;
    } catch (e) {
      console.error("[ChallengesProvider] suggest error", e);
      throw new Error("Failed to generate AI challenges");
    } finally {
      setLoadingSuggest(false);
    }
  }, [transactions, challenges, persist]);

  return useMemo(() => ({
    challenges,
    isHydrated,
    loadingSuggest,
    addChallenge,
    updateProgress,
    completeChallenge,
    removeChallenge,
    suggestChallengesFromAI,
  }), [
    challenges,
    isHydrated,
    loadingSuggest,
    addChallenge,
    updateProgress,
    completeChallenge,
    removeChallenge,
    suggestChallengesFromAI,
  ]);
});
