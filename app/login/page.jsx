"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Zap,
  Star,
  Building2,
  Users,
  BarChart3,
  CheckCircle,
  Sparkles,
  Activity,
} from "lucide-react";
import { setCredentials } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { addToast } from "@/store/slices/uiSlice";
import { setSelectedProperty } from "@/store/slices/propertySlice";

const features = [
  {
    icon: Activity,
    title: "Real-time Updates",
    description: "Live dashboard with instant notifications",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Comprehensive insights and forecasting",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with JWT authentication",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance with caching",
  },
];

const testimonials = [
  {
    name: "Raj Patel",
    role: "Property Owner",
    content:
      "This system transformed how I manage my 50+ bed PG. The real-time updates are game-changing!",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "PG Manager",
    content:
      "The analytics help me make data-driven decisions. Revenue increased by 30% in 3 months.",
    rating: 5,
  },
];

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, error } = useSelector((state) => state.auth);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      dispatch(
        addToast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "warning",
        })
      );
      return;
    }

    setLoading(true);

    try {
      // Check if demo mode is enabled
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';
      
      if (isDemoMode) {
        // Demo login - accept any credentials for demonstration
        const demoUser = {
          user: {
            id: "demo-user-" + Date.now(),
            email: formData.email,
            fullName: formData.email
              .split("@")[0]
              .replace(/[^a-zA-Z]/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            role: "OWNER",
          },
          token: "demo-token-" + Date.now(),
        };

        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", demoUser.token);
          localStorage.setItem("auth_user", JSON.stringify(demoUser.user));
        }

        // Update Redux state directly without API call
        dispatch(setCredentials(demoUser));

        dispatch(
          addToast({
            title: "Demo Mode Active! 🎉",
            description: "Logged in with demo data for testing",
            variant: "success",
          })
        );

        // Small delay for better UX, then navigate
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        // Real API login
        const response = await fetch('http://localhost:9000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        }

        // Update Redux state
        dispatch(setCredentials(data));

        dispatch(
          addToast({
            title: "Welcome Back! 🎉",
            description: "Successfully logged into PG Manager Pro",
            variant: "success",
          })
        );

        // Small delay for better UX, then navigate
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (error) {
      dispatch(
        addToast({
          title: "Login Failed",
          description: error.message || "Please check your credentials",
          variant: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow">
                <Building2 className="h-8 w-8" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your{" "}
              <span className="font-semibold gradient-text">
                PG Manager Pro
              </span>{" "}
              account
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon={Mail}
              required
              premium
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              icon={Lock}
              required
              premium
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={!formData.email || !formData.password}
              className="w-full h-12 text-base font-semibold"
            >
              {loading ? (
                <span>Signing you in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.form>

          {/* Demo Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">
                Development Mode
              </span>
            </div>
            <p className="text-xs text-purple-700 mb-2">
              Toggle between real API and demo mode for testing:
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  // Enable demo mode
                  localStorage.setItem('demo_mode', 'true');
                  window.location.reload();
                }}
                className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              >
                Enable Demo Mode
              </button>
              <button
                onClick={() => {
                  // Disable demo mode
                  localStorage.removeItem('demo_mode');
                  window.location.reload();
                }}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Use Real API
              </button>
            </div>
          </motion.div>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Sign up for free
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Features Showcase */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />

        <div className="relative flex flex-col justify-center p-12 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              World-Class PG Management
            </h2>
            <p className="text-xl text-white/90">
              Experience the future of property management with our
              enterprise-grade platform
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-6 mb-12"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-white/80">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6"
          >
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-1 mb-3">
                {[...Array(testimonials[currentTestimonial].rating)].map(
                  (_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  )
                )}
              </div>
              <blockquote className="text-white/90 mb-4">
                &quot;{testimonials[currentTestimonial].content}&quot;
              </blockquote>
              <div>
                <p className="font-semibold">
                  {testimonials[currentTestimonial].name}
                </p>
                <p className="text-sm text-white/70">
                  {testimonials[currentTestimonial].role}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="grid grid-cols-3 gap-6 mt-8"
          >
            {[
              { label: "Properties", value: "500+" },
              { label: "Happy Tenants", value: "10k+" },
              { label: "Success Rate", value: "99.9%" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-20 left-20 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"
        />
      </div>
    </div>
  );
}
