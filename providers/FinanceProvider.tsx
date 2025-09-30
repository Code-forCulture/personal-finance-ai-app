import { useEffect, useState, useMemo, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { ensureSupabaseReady, fetchGoalsForCurrentDevice, fetchTransactionsForCurrentDevice, isSupabaseConfigured, upsertGoal, upsertTransaction } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  notes?: string;
  date: Date;
  userId: string;
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  progress: number;
  deadline: Date;
  userId: string;
}



const MOCK_TRANSACTIONS: Omit<Transaction, "userId">[] = [
  {
    id: "1",
    type: "expense",
    amount: 45.50,
    category: "food",
    notes: "Lunch at restaurant",
    date: new Date(2024, 11, 15),
  },
  {
    id: "2",
    type: "income",
    amount: 3500,
    category: "salary",
    notes: "Monthly salary",
    date: new Date(2024, 11, 1),
  },
  {
    id: "3",
    type: "expense",
    amount: 120,
    category: "transport",
    notes: "Gas and parking",
    date: new Date(2024, 11, 14),
  },
  {
    id: "4",
    type: "expense",
    amount: 25,
    category: "coffee",
    notes: "Coffee shop",
    date: new Date(2024, 11, 13),
  },
  {
    id: "5",
    type: "expense",
    amount: 200,
    category: "shopping",
    notes: "Clothes shopping",
    date: new Date(2024, 11, 12),
  },
];

const MOCK_GOALS: Omit<Goal, "userId">[] = [
  {
    id: "1",
    title: "Emergency Fund",
    targetAmount: 10000,
    progress: 6500,
    deadline: new Date(2025, 5, 1),
  },
  {
    id: "2",
    title: "Vacation Fund",
    targetAmount: 3000,
    progress: 1200,
    deadline: new Date(2025, 6, 15),
  },
];

// Mock storage for demo purposes
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

export const [FinanceProvider, useFinance] = createContextHook(() => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [hideBalance, setHideBalance] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const { user } = useAuth();
  const storage = mockStorage;

  const clearAllFinanceData = useCallback(async () => {
    console.log('[FinanceProvider] Clearing all finance data for authenticated user session');
    setTransactions([]);
    setGoals([]);
    setUserPoints(0);
    setHideBalance(false);
    await Promise.all([
      storage.setItem("transactions", JSON.stringify([])),
      storage.setItem("goals", JSON.stringify([])),
      storage.setItem("userPoints", "0"),
      storage.setItem("hideBalance", JSON.stringify(false)),
    ]);
  }, [storage]);

  const initializeWithMockData = useCallback(async () => {
    console.log('[FinanceProvider] Initializing with mock data for new user');
    const mockTransactionsWithUserId = MOCK_TRANSACTIONS.map(t => ({ ...t, userId: "mock-user-id" }));
    const mockGoalsWithUserId = MOCK_GOALS.map(g => ({ ...g, userId: "mock-user-id" }));
    
    setTransactions(mockTransactionsWithUserId);
    setGoals(mockGoalsWithUserId);
    setUserPoints(150);
    setHideBalance(false);
    
    await storage.setItem("transactions", JSON.stringify(mockTransactionsWithUserId));
    await storage.setItem("goals", JSON.stringify(mockGoalsWithUserId));
    await storage.setItem("userPoints", "150");
    await storage.setItem("hideBalance", "false");
  }, [storage]);

  const loadData = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      console.log('[FinanceProvider] Loading finance data', { isAuthenticated: !!user });

      const storedTransactions = await storage.getItem("transactions");
      const storedGoals = await storage.getItem("goals");
      const storedPoints = await storage.getItem("userPoints");
      const storedHideBalance = await storage.getItem("hideBalance");

      const supaReady = await ensureSupabaseReady();
      if (supaReady.configured && !supaReady.error) {
        try {
          const [remoteTx, remoteGoals] = await Promise.all([
            fetchTransactionsForCurrentDevice(),
            fetchGoalsForCurrentDevice(),
          ]);
          if (remoteTx.length > 0) {
            const txMapped: Transaction[] = remoteTx.map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              category: t.category,
              notes: t.notes ?? undefined,
              date: new Date(t.date),
              userId: t.user_id,
            }));
            setTransactions(txMapped);
            await storage.setItem("transactions", JSON.stringify(txMapped));
            console.log('[FinanceProvider] Synced transactions from Supabase:', txMapped.length);
          }
          if (remoteGoals.length > 0) {
            const goalsMapped: Goal[] = remoteGoals.map((g) => ({
              id: g.id,
              title: g.title,
              targetAmount: g.target_amount,
              progress: g.progress,
              deadline: new Date(g.deadline),
              userId: g.user_id,
            }));
            setGoals(goalsMapped);
            await storage.setItem("goals", JSON.stringify(goalsMapped));
            console.log('[FinanceProvider] Synced goals from Supabase:', goalsMapped.length);
          }
        } catch (e) {
          console.warn('[FinanceProvider] Supabase sync failed, falling back to local', e);
        }
      } else if (supaReady.error) {
        console.warn('[FinanceProvider] Supabase reachable but reported error:', supaReady.error);
      }

      const isNewUser = !storedTransactions && !storedGoals && !storedPoints;
      if (isNewUser) {
        if (user) {
          console.log('[FinanceProvider] New authenticated user detected, initializing with ZERO data');
          await clearAllFinanceData();
          // do not return; continue to set empty state below
        } else {
          console.log('[FinanceProvider] New guest detected, initializing with mock data');
          await initializeWithMockData();
          return;
        }
      }

      if (storedTransactions && storedTransactions.trim()) {
        try {
          const parsedTransactions = JSON.parse(storedTransactions);
          if (Array.isArray(parsedTransactions)) {
            const transactionsWithDates = parsedTransactions.map((t: any) => ({
              ...t,
              date: new Date(t.date),
            }));
            setTransactions(transactionsWithDates);
            console.log('[FinanceProvider] Loaded transactions:', transactionsWithDates.length);
          } else {
            console.warn('[FinanceProvider] Stored transactions is not an array');
            setTransactions([]);
          }
        } catch (parseError) {
          console.error('[FinanceProvider] JSON parse error for transactions:', parseError);
          setTransactions([]);
          await storage.setItem("transactions", JSON.stringify([]));
        }
      } else {
        setTransactions([]);
      }

      if (storedGoals && storedGoals.trim()) {
        try {
          const parsedGoals = JSON.parse(storedGoals);
          if (Array.isArray(parsedGoals)) {
            const goalsWithDates = parsedGoals.map((g: any) => ({
              ...g,
              deadline: new Date(g.deadline),
            }));
            setGoals(goalsWithDates);
            console.log('[FinanceProvider] Loaded goals:', goalsWithDates.length);
          } else {
            console.warn('[FinanceProvider] Stored goals is not an array');
            setGoals([]);
          }
        } catch (parseError) {
          console.error('[FinanceProvider] JSON parse error for goals:', parseError);
          setGoals([]);
          await storage.setItem("goals", JSON.stringify([]));
        }
      } else {
        setGoals([]);
      }

      if (storedPoints && storedPoints.trim()) {
        const points = parseInt(storedPoints);
        setUserPoints(isNaN(points) ? 0 : points);
      } else {
        setUserPoints(0);
      }

      if (storedHideBalance && storedHideBalance.trim()) {
        try {
          const hb = JSON.parse(storedHideBalance);
          setHideBalance(typeof hb === 'boolean' ? hb : false);
        } catch (parseError) {
          console.error('[FinanceProvider] JSON parse error for hideBalance:', parseError);
          setHideBalance(false);
        }
      } else {
        setHideBalance(false);
      }
    } catch (error) {
      console.error('[FinanceProvider] Error loading finance data:', error);
      setTransactions([]);
      setGoals([]);
      setUserPoints(0);
      setHideBalance(false);
    } finally {
      setIsHydrated(true);
    }
  }, [storage, initializeWithMockData, clearAllFinanceData, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user) {
      console.log('[FinanceProvider] Auth state changed to logged-in, ensuring zeroed data');
      void clearAllFinanceData();
    }
  }, [user, clearAllFinanceData]);

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, "id" | "userId">) => {
    try {
      const newTransaction: Transaction = {
        ...transactionData,
        id: Date.now().toString(),
        userId: "mock-user-id",
      };

      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      await storage.setItem("transactions", JSON.stringify(updatedTransactions));

      try {
        if (isSupabaseConfigured) {
          await upsertTransaction({
            id: newTransaction.id,
            type: newTransaction.type,
            amount: newTransaction.amount,
            category: newTransaction.category,
            notes: newTransaction.notes ?? null,
            date: newTransaction.date.toISOString(),
          });
        }
      } catch (e) {
        console.warn('[FinanceProvider] Failed to sync transaction to Supabase', e);
      }

      const newPoints = userPoints + 10;
      setUserPoints(newPoints);
      await storage.setItem("userPoints", newPoints.toString());
    } catch {
      console.error("Error adding transaction");
      throw new Error("Failed to add transaction");
    }
  }, [transactions, userPoints, storage]);

  const addGoal = useCallback(async (goalData: Omit<Goal, "id" | "userId">) => {
    try {
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        userId: "mock-user-id",
      };

      const updatedGoals = [...goals, newGoal];
      setGoals(updatedGoals);
      await storage.setItem("goals", JSON.stringify(updatedGoals));

      try {
        if (isSupabaseConfigured) {
          await upsertGoal({
            id: newGoal.id,
            title: newGoal.title,
            target_amount: newGoal.targetAmount,
            progress: newGoal.progress,
            deadline: newGoal.deadline.toISOString(),
          });
        }
      } catch (e) {
        console.warn('[FinanceProvider] Failed to sync goal to Supabase', e);
      }
    } catch {
      console.error("Error adding goal");
      throw new Error("Failed to add goal");
    }
  }, [goals, storage]);

  const getExpensesByCategory = useCallback(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return categoryTotals;
  }, [transactions]);

  const toggleBalanceVisibility = useCallback(async () => {
    const newHideBalance = !hideBalance;
    setHideBalance(newHideBalance);
    await storage.setItem("hideBalance", JSON.stringify(newHideBalance));
  }, [hideBalance, storage]);

  // Calculate totals
  const monthlyIncome = useMemo(() => 
    transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const monthlyExpenses = useMemo(() => 
    transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const balance = useMemo(() => monthlyIncome - monthlyExpenses, [monthlyIncome, monthlyExpenses]);

  return useMemo(
    () => ({
      transactions,
      goals,
      balance,
      monthlyIncome,
      monthlyExpenses,
      userPoints,
      hideBalance,
      isHydrated,
      addTransaction,
      addGoal,
      getExpensesByCategory,
      toggleBalanceVisibility,
    }),
    [
      transactions,
      goals,
      balance,
      monthlyIncome,
      monthlyExpenses,
      userPoints,
      hideBalance,
      isHydrated,
      addTransaction,
      addGoal,
      getExpensesByCategory,
      toggleBalanceVisibility,
    ]
  );
});