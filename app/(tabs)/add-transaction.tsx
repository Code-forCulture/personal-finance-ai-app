import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Coffee,
  Gamepad2,
  Heart,
  GraduationCap,
  Calendar,
  DollarSign
} from "lucide-react-native";
import { useFinance } from "@/providers/FinanceProvider";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";

const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: Utensils, color: "#EF4444" },
  { id: "transport", name: "Transportation", icon: Car, color: "#3B82F6" },
  { id: "shopping", name: "Shopping", icon: ShoppingCart, color: "#8B5CF6" },
  { id: "bills", name: "Bills & Utilities", icon: Home, color: "#F59E0B" },
  { id: "entertainment", name: "Entertainment", icon: Gamepad2, color: "#10B981" },
  { id: "health", name: "Healthcare", icon: Heart, color: "#EF4444" },
  { id: "education", name: "Education", icon: GraduationCap, color: "#6366F1" },
  { id: "coffee", name: "Coffee & Drinks", icon: Coffee, color: "#92400E" },
];

const INCOME_CATEGORIES = [
  { id: "salary", name: "Salary", icon: DollarSign, color: "#10B981" },
  { id: "freelance", name: "Freelance", icon: DollarSign, color: "#3B82F6" },
  { id: "investment", name: "Investment", icon: TrendingUp, color: "#8B5CF6" },
  { id: "other", name: "Other Income", icon: DollarSign, color: "#6B7280" },
];

export default function AddTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType: "income" | "expense" = (params?.type === "income" || params?.type === "expense")
    ? (params.type as "income" | "expense")
    : "expense";

  const [transactionType, setTransactionType] = useState<"expense" | "income">(initialType);
  const [amount, setAmount] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [day, setDay] = useState<number>(now.getDate());
  const date = useMemo(() => {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }, [year, month, day]);

  useEffect(() => {
    if (params?.type === "income" || params?.type === "expense") {
      setTransactionType(params.type as "income" | "expense");
      setSelectedCategory("");
      console.log("[AddTransaction] Type preselected from params:", params.type);
    }
  }, [params?.type]);

  const { addTransaction } = useFinance();

  const categories = transactionType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      await addTransaction({
        type: transactionType,
        amount: numericAmount,
        category: selectedCategory,
        notes,
        date: new Date(date),
      });

      Alert.alert(
        "Success", 
        `${transactionType === "expense" ? "Expense" : "Income"} added successfully!`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Error", "Failed to add transaction. Please try again.");
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }] }>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Transaction</Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            testID="toggle-expense"
            style={[
              styles.toggleButton,
              transactionType === "expense" && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setTransactionType("expense");
              setSelectedCategory("");
            }}
          >
            <TrendingDown 
              color={transactionType === "expense" ? Colors.white : Colors.gray500} 
              size={20} 
            />
            <Text
              style={[
                styles.toggleText,
                transactionType === "expense" && styles.toggleTextActive,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            testID="toggle-income"
            style={[
              styles.toggleButton,
              transactionType === "income" && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setTransactionType("income");
              setSelectedCategory("");
            }}
          >
            <TrendingUp 
              color={transactionType === "income" ? Colors.white : Colors.gray500} 
              size={20} 
            />
            <Text
              style={[
                styles.toggleText,
                transactionType === "income" && styles.toggleTextActive,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              testID="amount-input"
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <TouchableOpacity
                  key={category.id}
                  testID={`category-${category.id}`}
                  style={[
                    styles.categoryCard,
                    isSelected && { 
                      backgroundColor: category.color,
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <IconComponent
                    color={isSelected ? Colors.white : category.color}
                    size={24}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && { color: Colors.white },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date - Scrolling Pickers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <View style={styles.datePickersRow}>
            <DateWheel
              testID="year-picker"
              data={getYears(now.getFullYear())}
              value={year}
              onChange={setYear}
              renderItem={(v) => <Text style={styles.wheelText}>{v}</Text>}
              width={72}
            />
            <DateWheel
              testID="month-picker"
              data={MONTHS}
              value={month}
              onChange={setMonth}
              renderItem={(v) => <Text style={styles.wheelText}>{MONTH_LABELS[v - 1]}</Text>}
              width={112}
            />
            <DateWheel
              testID="day-picker"
              data={getDaysInMonth(year, month)}
              value={day}
              onChange={setDay}
              renderItem={(v) => <Text style={styles.wheelText}>{String(v).padStart(2, '0')}</Text>}
              width={64}
            />
          </View>
          <View style={styles.chosenDateRow}>
            <Calendar color={Colors.gray500} size={16} />
            <Text style={styles.chosenDateText}>{date}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note..."
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity testID="submit-transaction" style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            Add {transactionType === "expense" ? "Expense" : "Income"}
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.ink,
  },
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray500,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.gray500,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.ink,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.ink,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.ink,
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  wheel: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  wheelItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
  },
  chosenDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  chosenDateText: {
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: Colors.ink,
    textAlignVertical: "top",
    minHeight: 80,
  },
  submitButton: {
    marginHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.white,
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
});

// Helpers and DateWheel component
const MONTHS: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_LABELS: string[] = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
];
function getYears(current: number): number[] {
  const start = current - 10;
  const end = current + 10;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
function getDaysInMonth(year: number, month: number): number[] {
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => i + 1);
}

interface DateWheelProps<T extends number> {
  data: T[];
  value: T;
  onChange: (val: T) => void;
  renderItem: (val: T) => React.ReactNode;
  width: number;
  testID?: string;
}

function DateWheel<T extends number>({ data, value, onChange, renderItem, width, testID }: DateWheelProps<T>) {
  const itemHeight = 44;
  const svRef = useRef<ScrollView | null>(null);

  const initialIndex = useMemo(() => {
    const idx = data.findIndex((d) => d === value);
    return idx >= 0 ? idx : 0;
  }, [data, value]);

  useEffect(() => {
    if (svRef.current) {
      svRef.current.scrollTo({ y: initialIndex * itemHeight, animated: false });
    }
  }, [initialIndex]);

  const onMomentumEnd = useCallback((e: any) => {
    const y = e?.nativeEvent?.contentOffset?.y ?? 0;
    const idx = Math.round(y / itemHeight);
    const bounded = Math.min(Math.max(idx, 0), data.length - 1);
    const selected = data[bounded];
    if (selected !== value) onChange(selected);
    if (svRef.current) {
      svRef.current.scrollTo({ y: bounded * itemHeight, animated: true });
    }
  }, [data, onChange, value]);

  return (
    <View style={[styles.wheel, { width }]} testID={testID}>
      <View style={styles.selectionOverlay} pointerEvents="none" />
      <ScrollView
        ref={svRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate={"fast"}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: 0 }}
      >
        {data.map((d) => (
          <View key={String(d)} style={[styles.wheelItem, { height: itemHeight }]}> 
            {renderItem(d)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
