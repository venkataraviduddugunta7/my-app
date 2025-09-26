'use client';

import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from '@/store';
import { initializeAuth } from '@/store/slices/authSlice';

function AuthInitializer({ children }) {
  useEffect(() => {
    // Initialize auth state from localStorage on app start
    store.dispatch(initializeAuth());
  }, []);

  return children;
}

export function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
} 