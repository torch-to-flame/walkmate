import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * Hook that redirects to the main app if the user is already signed in
 * Useful for auth screens (signin, signup) to prevent showing them to authenticated users
 */
export const useRedirectIfSignedIn = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we've finished loading the auth state and have a user
    if (!loading && user) {
      console.log('User already signed in, redirecting to main app');
      router.replace('/(tabs)');
    }
  }, [user, loading, router]);

  return { isSignedIn: !!user, isLoading: loading };
};
