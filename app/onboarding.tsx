import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronRight, ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from "react-native-svg";

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  gradient: readonly [string, string, string, string];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: "Track Your Finances",
    subtitle: "Smart Money Management",
    description: "Easily track your income and expenses with our intuitive interface. Get a clear picture of your financial health.",
    image: "https://r2-pub.rork.com/generated-images/1f0d6f3f-da33-47e8-8430-83dd7d160d55.png",
    gradient: ["#FF6B9D", "#C371F5", "#4FACFE", "#00F2FE"] as const,
  },
  {
    id: 2,
    title: "AI-Powered Insights",
    subtitle: "Learn & Improve",
    description: "Get personalized financial advice and mini-lessons based on your spending patterns. Make smarter money decisions.",
    image: "https://r2-pub.rork.com/generated-images/ad515274-9f3d-4f11-92bf-4ecf00afe0d8.png",
    gradient: ["#A8EDEA", "#FED6E3", "#FFD1FF", "#C1FBA4"] as const,
  },
  {
    id: 3,
    title: "Achieve Your Goals",
    subtitle: "Gamified Experience",
    description: "Set financial goals, complete challenges, and earn rewards. Make saving money fun and engaging.",
    image: "https://r2-pub.rork.com/generated-images/47ffe1dd-3839-463f-b72a-70c20546279a.png",
    gradient: ["#FFA8E2", "#A8D8FF", "#FFE5A8", "#D4A8FF"] as const,
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { width } = useWindowDimensions();

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.replace("/(auth)/login");
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skip = () => {
    router.replace("/(auth)/login");
  };

  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradient}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <SvgLinearGradient id="holographic" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={slide.gradient[0]} stopOpacity="1" />
              <Stop offset="33%" stopColor={slide.gradient[1]} stopOpacity="1" />
              <Stop offset="66%" stopColor={slide.gradient[2]} stopOpacity="1" />
              <Stop offset="100%" stopColor={slide.gradient[3]} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#holographic)" />
        </Svg>
        
        <View style={styles.stripesOverlay}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.stripe,
                {
                  left: i * 60 - 200,
                  opacity: 0.1,
                },
              ]}
            />
          ))}
        </View>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={skip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: slide.image }} style={styles.image} />
          </View>

          <View style={[styles.textContainer, { maxWidth: width - 40 }]}>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  index === currentSlide && styles.activeDot,
                ]}
              />
            ))}
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            {currentSlide > 0 && (
              <TouchableOpacity onPress={prevSlide} style={styles.navButton}>
                <ChevronLeft color="#FFFFFF" size={24} />
              </TouchableOpacity>
            )}

            <View style={styles.spacer} />

            <TouchableOpacity onPress={nextSlide} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>
                {currentSlide === SLIDES.length - 1 ? "Get Started" : "Next"}
              </Text>
              <ChevronRight color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: "relative" as const,
  },
  stripesOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden" as const,
  },
  stripe: {
    position: "absolute" as const,
    width: 40,
    height: "200%" as const,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
    top: -100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  image: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  textContainer: {
    alignItems: "center",
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.9,
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeDot: {
    width: 24,
    backgroundColor: "#FFFFFF",
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});