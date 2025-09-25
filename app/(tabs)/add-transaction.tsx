import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { router } from "expo-router";
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
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
    } catch (error) {
      Alert.alert("Error", "Failed to add transaction. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Transaction</Text>
        </View>

        {/* Transaction Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
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

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <TouchableOpacity
                  key={category.id}
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

        {/* Date Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <View style={styles.inputContainer}>
            <Calendar color={Colors.gray500} size={20} />
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Notes Input */}
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

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            Add {transactionType === "expense" ? "Expense" : "Income"}
          </Text>
        </TouchableOpacity>
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
});