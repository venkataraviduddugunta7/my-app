'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { initializeAuth, getUserProfile } from '@/store/slices/authSlice';
import { Loader2, Building } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Initialize auth from localStorage
    dispatch(initializeAuth());
    // Skip API call for demo mode
    // if (token && !token.startsWith('demo-')) {
    //   dispatch(getUserProfile());
    // }
  }, [dispatch]);

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking authentication
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-900">Loading...</span>
          </div>
          <p className="text-gray-600">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return isAuthenticated ? children : null;
} 