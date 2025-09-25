import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Default to current origin for web, localhost for development
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // For mobile development, use localhost
  return 'http://localhost:8081';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          // Check if response is ok and has JSON content type
          if (!response.ok) {
            console.warn(`tRPC request failed: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            console.warn('tRPC response is not JSON:', contentType);
            throw new Error('Invalid response format');
          }
          
          return response;
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.error('tRPC request timeout');
              throw new Error('Request timeout');
            }
            console.error('tRPC fetch error:', error.message);
          }
          throw error;
        }
      },
    }),
  ],
});