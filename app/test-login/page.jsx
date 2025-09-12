"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { setSelectedProperty } from "@/store/slices/propertySlice";
import { addToast } from "@/store/slices/uiSlice";
import { Button } from "@/components/ui/Button";

export default function TestLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleTestLogin = () => {
    setLoading(true);

    // Create demo user
    const demoUser = {
      user: {
        id: "demo-user-" + Date.now(),
        email: "demo@pgmanager.com",
        fullName: "Demo User",
        role: "OWNER",
      },
      token: "demo-token-" + Date.now(),
    };

    // Store in localStorage
    localStorage.setItem("auth_token", demoUser.token);
    localStorage.setItem("auth_user", JSON.stringify(demoUser.user));

    // Update Redux state
    dispatch(setCredentials(demoUser));

    // Set demo property
    const demoProperty = {
      id: "demo-property-1",
      name: "Sunrise PG",
      address: "123 Main Street, City",
      totalBeds: 24,
      occupiedBeds: 21,
    };

    dispatch(setSelectedProperty(demoProperty));

    dispatch(
      addToast({
        title: "Welcome! 🎉",
        description: "Successfully logged in with demo account",
        variant: "success",
      })
    );

    // Navigate to dashboard
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  const clearAuth = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("selectedPropertyId");
    dispatch(
      addToast({
        title: "Cleared",
        description: "Authentication data cleared",
        variant: "info",
      })
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Test Login Page</h1>
        <p className="text-gray-600 mb-6">
          This page bypasses all API calls and logs you in directly with demo data.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={handleTestLogin}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Logging in..." : "Login with Demo Account"}
          </Button>
          
          <Button
            onClick={clearAuth}
            variant="outline"
            className="w-full"
          >
            Clear Authentication Data
          </Button>
          
          <Button
            onClick={() => router.push("/login")}
            variant="ghost"
            className="w-full"
          >
            Go to Regular Login
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This test page directly sets authentication without any API calls.
            Use this to verify the dashboard and other features work correctly.
          </p>
        </div>
      </div>
    </div>
  );
}
