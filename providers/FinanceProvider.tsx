import { useEffect, useState, useMemo, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";

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

  const storage = mockStorage;

  const initializeWithMockData = useCallback(async () => {
    console.log('[FinanceProvider] Initializing with mock data for new user');
    const mockTransactionsWithUserId = MOCK_TRANSACTIONS.map(t => ({ ...t, userId: "mock-user-id" }));
    const mockGoalsWithUserId = MOCK_GOALS.map(g => ({ ...g, userId: "mock-user-id" }));
    
    setTransactions(mockTransactionsWithUserId);
    setGoals(mockGoalsWithUserId);
    setUserPoints(150); // Starting points
    setHideBalance(false);
    
    // Store the initial data
    await storage.setItem("transactions", JSON.stringify(mockTransactionsWithUserId));
    await storage.setItem("goals", JSON.stringify(mockGoalsWithUserId));
    await storage.setItem("userPoints", "150");
    await storage.setItem("hideBalance", "false");
  }, [storage]);

  const loadData = useCallback(async () => {
    try {
      console.log('[FinanceProvider] Loading finance data');
      const storedTransactions = await storage.getItem("transactions");
      const storedGoals = await storage.getItem("goals");
      const storedPoints = await storage.getItem("userPoints");
      const storedHideBalance = await storage.getItem("hideBalance");

      // Check if this is a new user (no stored data)
      const isNewUser = !storedTransactions && !storedGoals && !storedPoints;
      
      if (isNewUser) {
        console.log('[FinanceProvider] New user detected, initializing with mock data');
        await initializeWithMockData();
        return;
      }

      // Load transactions
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

      // Load goals
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

      // Load points
      if (storedPoints && storedPoints.trim()) {
        const points = parseInt(storedPoints);
        setUserPoints(isNaN(points) ? 0 : points);
      } else {
        setUserPoints(0);
      }

      // Load hide balance setting
      if (storedHideBalance && storedHideBalance.trim()) {
        try {
          const hideBalance = JSON.parse(storedHideBalance);
          setHideBalance(typeof hideBalance === 'boolean' ? hideBalance : false);
        } catch (parseError) {
          console.error('[FinanceProvider] JSON parse error for hideBalance:', parseError);
          setHideBalance(false);
        }
      } else {
        setHideBalance(false);
      }
    } catch (error) {
      console.error('[FinanceProvider] Error loading finance data:', error);
      // Fallback to empty state
      setTransactions([]);
      setGoals([]);
      setUserPoints(0);
      setHideBalance(false);
    }
  }, [storage, initializeWithMockData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      // Award points for adding transaction
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
      addTransaction,
      addGoal,
      getExpensesByCategory,
      toggleBalanceVisibility,
    ]
  );
});