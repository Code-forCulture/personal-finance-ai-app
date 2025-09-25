import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Users,
  Trophy,
  TrendingUp,
  Heart,
  MessageCircle,
  Share,
  Award,
  Target,
  Crown
} from "lucide-react-native";
import { Colors } from "@/constants/colors";

interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  content: string;
  achievement?: {
    type: "goal" | "challenge" | "streak";
    title: string;
    description: string;
  };
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
}

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  rank: number;
  streak: number;
}

const POSTS: Post[] = [
  {
    id: "1",
    user: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      level: 12,
    },
    content: "Just completed my first month of tracking expenses! Saved $300 by cooking at home more often. 🎉",
    achievement: {
      type: "goal",
      title: "First Month Complete",
      description: "Successfully tracked expenses for 30 days",
    },
    likes: 24,
    comments: 8,
    timeAgo: "2h ago",
    liked: false,
  },
  {
    id: "2",
    user: {
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      level: 8,
    },
    content: "Pro tip: Use the 24-hour rule before making any non-essential purchase over $50. It's saved me from so many impulse buys!",
    likes: 45,
    comments: 12,
    timeAgo: "4h ago",
    liked: true,
  },
  {
    id: "3",
    user: {
      name: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      level: 15,
    },
    content: "Reached my emergency fund goal of $5,000! 💪 Started with $0 six months ago. Consistency is key!",
    achievement: {
      type: "goal",
      title: "Emergency Fund Goal",
      description: "Saved $5,000 for emergencies",
    },
    likes: 67,
    comments: 23,
    timeAgo: "6h ago",
    liked: false,
  },
];

const LEADERBOARD: LeaderboardUser[] = [
  {
    id: "1",
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    points: 2450,
    rank: 1,
    streak: 45,
  },
  {
    id: "2",
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    points: 2380,
    rank: 2,
    streak: 38,
  },
  {
    id: "3",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    points: 2290,
    rank: 3,
    streak: 42,
  },
  {
    id: "4",
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    points: 2150,
    rank: 4,
    streak: 28,
  },
  {
    id: "5",
    name: "You",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
    points: 1890,
    rank: 5,
    streak: 15,
  },
];

export default function CommunityScreen() {
  const [selectedTab, setSelectedTab] = useState<"feed" | "leaderboard">("feed");
  const [posts, setPosts] = useState(POSTS);

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const renderFeed = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          {/* User Header */}
          <View style={styles.postHeader}>
            <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>{post.user.name}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv.{post.user.level}</Text>
                </View>
              </View>
              <Text style={styles.timeAgo}>{post.timeAgo}</Text>
            </View>
          </View>

          {/* Achievement Badge */}
          {post.achievement && (
            <View style={styles.achievementContainer}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.achievementBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Trophy color={Colors.white} size={16} />
                <Text style={styles.achievementTitle}>{post.achievement.title}</Text>
              </LinearGradient>
              <Text style={styles.achievementDescription}>
                {post.achievement.description}
              </Text>
            </View>
          )}

          {/* Post Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(post.id)}
            >
              <Heart
                color={post.liked ? "#EF4444" : Colors.gray500}
                size={20}
                fill={post.liked ? "#EF4444" : "none"}
              />
              <Text style={[
                styles.actionText,
                post.liked && { color: "#EF4444" }
              ]}>
                {post.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle color={Colors.gray500} size={20} />
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Share color={Colors.gray500} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>This Month's Champions</Text>
        <Text style={styles.leaderboardSubtitle}>
          Compete with others and climb the ranks!
        </Text>
      </View>

      {LEADERBOARD.map((user, index) => (
        <View
          key={user.id}
          style={[
            styles.leaderboardItem,
            user.name === "You" && styles.currentUserItem,
          ]}
        >
          <View style={styles.rankContainer}>
            {user.rank <= 3 ? (
              <View style={[
                styles.medalContainer,
                user.rank === 1 && { backgroundColor: "#F59E0B" },
                user.rank === 2 && { backgroundColor: "#9CA3AF" },
                user.rank === 3 && { backgroundColor: "#92400E" },
              ]}>
                <Crown color={Colors.white} size={16} />
              </View>
            ) : (
              <Text style={styles.rankNumber}>{user.rank}</Text>
            )}
          </View>

          <Image source={{ uri: user.avatar }} style={styles.leaderboardAvatar} />

          <View style={styles.leaderboardUserInfo}>
            <Text style={[
              styles.leaderboardUserName,
              user.name === "You" && { fontWeight: "bold", color: Colors.primary }
            ]}>
              {user.name}
            </Text>
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <Award color="#F59E0B" size={14} />
                <Text style={styles.statText}>{user.points} pts</Text>
              </View>
              <View style={styles.statItem}>
                <Target color="#10B981" size={14} />
                <Text style={styles.statText}>{user.streak} day streak</Text>
              </View>
            </View>
          </View>

          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{user.points}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.communityStats}>
          <Users color={Colors.primary} size={20} />
          <Text style={styles.statsText}>2.4k members</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "feed" && styles.tabActive]}
          onPress={() => setSelectedTab("feed")}
        >
          <TrendingUp color={selectedTab === "feed" ? Colors.white : Colors.gray500} size={18} />
          <Text style={[
            styles.tabText,
            selectedTab === "feed" && styles.tabTextActive
          ]}>
            Feed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === "leaderboard" && styles.tabActive]}
          onPress={() => setSelectedTab("leaderboard")}
        >
          <Trophy color={selectedTab === "leaderboard" ? Colors.white : Colors.gray500} size={18} />
          <Text style={[
            styles.tabText,
            selectedTab === "leaderboard" && styles.tabTextActive
          ]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedTab === "feed" && renderFeed()}
      {selectedTab === "leaderboard" && renderLeaderboard()}
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
  communityStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.tintSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statsText: {
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
    flex: 1,
    paddingHorizontal: 20,
  },
  postCard: {
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
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  levelBadge: {
    backgroundColor: Colors.tintSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  achievementContainer: {
    marginBottom: 12,
  },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },
  achievementDescription: {
    fontSize: 12,
    color: Colors.gray500,
    fontStyle: "italic",
  },
  postContent: {
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 20,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: Colors.gray500,
    fontWeight: "500",
  },
  leaderboardHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: "center",
  },
  leaderboardItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.tintSoft,
  },
  rankContainer: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  medalContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.gray500,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  leaderboardUserInfo: {
    flex: 1,
  },
  leaderboardUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 4,
  },
  userStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: "500",
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
});