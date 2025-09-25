import { useEffect, useState, useMemo, useCallback } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import createContextHook from "@nkzw/create-context-hook";

// Complete the auth session on web
WebBrowser.maybeCompleteAuthSession();

/*
  GOOGLE AUTH SETUP INSTRUCTIONS:
  
  1. Go to Google Cloud Console (https://console.cloud.google.com/)
  2. Create a new project or select existing one
  3. Enable Google+ API
  4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
  5. Create credentials for:
     - Web application (for web)
     - iOS application (for iOS)
     - Android application (for Android)
  6. Replace the placeholder client IDs below with your actual ones
  7. For mobile apps, add your bundle identifier (iOS) and package name (Android)
  8. For web, add your domain to authorized origins
  9. Uncomment the real implementation in signInWithGoogle function
*/

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'email' | 'google' | 'apple';
  createdAt: Date;
  isPremium: boolean;
}

// Google OAuth configuration
// Replace these with your actual Google OAuth client IDs from Google Cloud Console
const GOOGLE_CLIENT_ID = Platform.select({
  web: "YOUR_GOOGLE_WEB_CLIENT_ID.googleusercontent.com",
  ios: "YOUR_GOOGLE_IOS_CLIENT_ID.googleusercontent.com", 
  android: "YOUR_GOOGLE_ANDROID_CLIENT_ID.googleusercontent.com",
  default: "YOUR_GOOGLE_CLIENT_ID.googleusercontent.com",
});

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};



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

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storage = mockStorage;

  const loadUser = useCallback(async () => {
    try {
      const userData = await storage.getItem("user");
      console.log('[AuthProvider] Loading user data:', userData);
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('[AuthProvider] Parsed user:', parsedUser);
          setUser({
            ...parsedUser,
            createdAt: new Date(parsedUser.createdAt),
            isPremium: Boolean(parsedUser.isPremium),
          });
        } catch (parseError) {
          console.error('[AuthProvider] JSON parse error:', parseError);
          // Clear corrupted data
          await storage.removeItem("user");
        }
      }
    } catch (error) {
      console.error('[AuthProvider] Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);



  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('[AuthProvider] Signing in user:', email);
      
      // Simple validation for demo
      if (!email.includes('@') || password.length < 3) {
        throw new Error("Invalid email or password");
      }
      
      // Mock authentication - in real app, this would call Firebase Auth
      const mockUser: User = {
        id: "mock-user-id",
        email,
        displayName: email.split("@")[0],
        provider: 'email',
        createdAt: new Date(),
        isPremium: false,
      };

      const userJson = JSON.stringify(mockUser);
      console.log('[AuthProvider] Storing user JSON:', userJson);
      await storage.setItem("user", userJson);
      setUser(mockUser);
      console.log('[AuthProvider] Sign in successful');
    } catch (error) {
      console.error('[AuthProvider] Sign in error:', error);
      throw error;
    }
  }, [storage]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      console.log('[AuthProvider] Signing up user:', email, displayName);
      
      // Simple validation for demo
      if (!email.includes('@') || password.length < 6 || !displayName.trim()) {
        throw new Error("Please provide valid email, password (6+ chars), and name");
      }
      
      // Mock registration - in real app, this would call Firebase Auth
      const mockUser: User = {
        id: "mock-user-id",
        email,
        displayName,
        provider: 'email',
        createdAt: new Date(),
        isPremium: false,
      };

      const userJson = JSON.stringify(mockUser);
      console.log('[AuthProvider] Storing user JSON:', userJson);
      await storage.setItem("user", userJson);
      setUser(mockUser);
      console.log('[AuthProvider] Sign up successful');
    } catch (error) {
      console.error('[AuthProvider] Sign up error:', error);
      throw error;
    }
  }, [storage]);

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('[AuthProvider] Google sign in started');
      // For demo purposes, we'll simulate Google Auth
      // In production, uncomment the real implementation below
      
      // Mock Google user for demo
      const mockGoogleUser: User = {
        id: "google-mock-user-id",
        email: "demo@gmail.com",
        displayName: "Demo User",
        photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        provider: 'google',
        createdAt: new Date(),
        isPremium: false,
      };

      const userJson = JSON.stringify(mockGoogleUser);
      console.log('[AuthProvider] Storing Google user JSON:', userJson);
      await storage.setItem("user", userJson);
      setUser(mockGoogleUser);
      console.log('[AuthProvider] Google sign in successful');
      
      /* Real Google Auth implementation (uncomment for production):
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'myapp',
        useProxy: true,
      });

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID!,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
        additionalParameters: {},
        extraParams: {
          access_type: 'offline',
        },
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CLIENT_ID!,
            code: result.params.code,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
            redirectUri,
          },
          discovery
        );

        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResult.accessToken}`
        );
        const userInfo = await userInfoResponse.json();

        const googleUser: User = {
          id: userInfo.id,
          email: userInfo.email,
          displayName: userInfo.name,
          photoURL: userInfo.picture,
          provider: 'google',
          createdAt: new Date(),
        };

        await storage.setItem("user", JSON.stringify(googleUser));
        setUser(googleUser);
      } else {
        throw new Error('Google sign-in was cancelled');
      }
      */
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw new Error('Google sign-in failed');
    }
  }, [storage]);

  const purchasePremium = useCallback(async () => {
    try {
      if (!user) throw new Error('Not authenticated');
      const upgraded = { ...user, isPremium: true } as User;
      await storage.setItem("user", JSON.stringify(upgraded));
      setUser(upgraded);
      console.log('[AuthProvider] Premium purchased');
    } catch (e) {
      console.error('[AuthProvider] purchasePremium error:', e);
      throw new Error('Failed to activate Premium');
    }
  }, [user, storage]);

  const signOut = useCallback(async () => {
    try {
      await storage.removeItem("user");
      setUser(null);
    } catch {
      console.error("Error signing out");
    }
  }, [storage]);

  return useMemo(
    () => ({ user, isLoading, signIn, signUp, signInWithGoogle, signOut, purchasePremium, storage }),
    [user, isLoading, signIn, signUp, signInWithGoogle, signOut, purchasePremium, storage]
  );
});