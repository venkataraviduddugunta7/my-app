'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Building2, ArrowRight, Star, Activity, BarChart3, Shield, Zap } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { addToast } from '@/store/slices/uiSlice';
import { setCredentials, registerUser, clearError } from '@/store/slices/authSlice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

const features = [
  { icon: Activity, title: 'Occupancy Control', description: 'Track beds, rooms, and availability in one place.' },
  { icon: BarChart3, title: 'Collections View', description: 'Monitor rent status, dues, and monthly cash flow.' },
  { icon: Shield, title: 'Tenant Records', description: 'Keep profiles, IDs, and agreements organized.' },
  { icon: Zap, title: 'Operational Clarity', description: 'Run daily PG workflows with fewer manual steps.' },
];

const testimonials = [
  { name: 'Raj Patel', role: 'Property Owner', content: 'Daily operations are now structured and easy to monitor.', rating: 5 },
  { name: 'Priya Sharma', role: 'PG Manager', content: 'Collections and occupancy tracking became much easier.', rating: 5 },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;
const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;

const inputClassName = 'border-white/20 bg-white/10 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-cyan-300/30';

export default function AuthScreen({ initialMode = 'login' }) {
  const mode = initialMode === 'signup' ? 'signup' : 'login';

  const [loading, setLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'OWNER',
  });
  const [formErrors, setFormErrors] = useState({});

  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    dispatch(clearError());
    setFormErrors({});
  }, [dispatch, mode]);

  const canSubmit = useMemo(() => {
    if (mode === 'login') return !!loginData.email && !!loginData.password;
    return !!signupData.fullName && !!signupData.email && !!signupData.phone && !!signupData.password && !!signupData.confirmPassword;
  }, [mode, loginData, signupData]);

  const validateLogin = () => {
    const errors = {};

    if (!loginData.email) errors.email = 'Email is required';
    else if (!emailRegex.test(loginData.email)) errors.email = 'Enter a valid email address';

    if (!loginData.password) errors.password = 'Password is required';
    else if (loginData.password.length < 6) errors.password = 'Password must be at least 6 characters';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignup = () => {
    const errors = {};

    if (!signupData.fullName.trim()) errors.fullName = 'Full name is required';
    if (signupData.username && !usernameRegex.test(signupData.username)) {
      errors.username = 'Username should be 3-30 chars: letters, numbers, ., _, -';
    }

    if (!signupData.email) errors.email = 'Email is required';
    else if (!emailRegex.test(signupData.email)) errors.email = 'Enter a valid email address';

    if (!signupData.phone) errors.phone = 'Phone number is required';
    else if (!phoneRegex.test(signupData.phone)) errors.phone = 'Enter a valid phone number';

    if (!signupData.password) errors.password = 'Password is required';
    else if (signupData.password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (!signupData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (signupData.confirmPassword !== signupData.password) errors.confirmPassword = 'Passwords do not match';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field) => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, password: loginData.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      }

      dispatch(setCredentials(data.data));
      dispatch(addToast({ title: 'Login successful', description: 'Redirecting to dashboard', variant: 'success' }));
      setTimeout(() => router.push('/'), 300);
    } catch (err) {
      dispatch(addToast({ title: 'Login Failed', description: err.message || 'Please check credentials', variant: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;

    const { confirmPassword, ...payload } = signupData;
    setLoading(true);
    try {
      const result = await dispatch(registerUser(payload));
      if (registerUser.fulfilled.match(result)) {
        dispatch(addToast({ title: 'Account created', description: 'Redirecting to dashboard', variant: 'success' }));
        setTimeout(() => router.push('/'), 300);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_15%_15%,#263756_0%,#0b1223_42%,#05070e_100%)] text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className="pointer-events-none absolute left-[-70px] top-[-70px] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-90px] top-[22%] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[35%] h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:h-full lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:px-10 lg:py-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="order-1 flex"
        >
          <div className="w-full rounded-[28px] border border-white/15 bg-white/[0.08] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8 lg:h-[calc(100dvh-3rem)]">
            <div className="flex h-full flex-col">
              <div className="mb-6 shrink-0 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <Building2 className="h-7 w-7 text-cyan-300" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  {mode === 'login' ? 'Welcome back to MY PG' : 'Create your MY PG account'}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  {mode === 'login' ? 'Sign in to manage tenants, rooms, and collections.' : 'Register and start running your PG operations in one place.'}
                </p>
              </div>

              <div className="pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {error && <div className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</div>}

                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    <Input
                      type="email"
                      name="email"
                      label="Email Address"
                      labelClassName="text-slate-200"
                      value={loginData.email}
                      onChange={(e) => {
                        setLoginData((prev) => ({ ...prev, email: e.target.value }));
                        clearFieldError('email');
                      }}
                      placeholder="name@company.com"
                      icon={Mail}
                      required
                      premium
                      className={inputClassName}
                      error={formErrors.email}
                    />

                    <Input
                      type="password"
                      name="password"
                      label="Password"
                      labelClassName="text-slate-200"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData((prev) => ({ ...prev, password: e.target.value }));
                        clearFieldError('password');
                      }}
                      placeholder="Enter your password"
                      icon={Lock}
                      required
                      premium
                      className={inputClassName}
                      error={formErrors.password}
                    />

                    <Button type="submit" loading={loading || isLoading} disabled={!canSubmit} className="h-11 w-full justify-center text-sm font-semibold">
                      <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4" noValidate>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Input
                          type="text"
                          name="fullName"
                          label="Full Name"
                          labelClassName="text-slate-200"
                          value={signupData.fullName}
                          onChange={(e) => {
                            setSignupData((prev) => ({ ...prev, fullName: e.target.value }));
                            clearFieldError('fullName');
                          }}
                          placeholder="Your full name"
                          icon={User}
                          required
                          premium
                          className={inputClassName}
                          error={formErrors.fullName}
                        />
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="text"
                          name="username"
                          label="Username (optional)"
                          labelClassName="text-slate-200"
                          value={signupData.username}
                          onChange={(e) => {
                            setSignupData((prev) => ({ ...prev, username: e.target.value }));
                            clearFieldError('username');
                          }}
                          placeholder="username"
                          icon={User}
                          premium
                          className={inputClassName}
                          error={formErrors.username}
                        />
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="email"
                          name="email"
                          label="Email Address"
                          labelClassName="text-slate-200"
                          value={signupData.email}
                          onChange={(e) => {
                            setSignupData((prev) => ({ ...prev, email: e.target.value }));
                            clearFieldError('email');
                          }}
                          placeholder="name@company.com"
                          icon={Mail}
                          required
                          premium
                          className={inputClassName}
                          error={formErrors.email}
                        />
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="tel"
                          name="phone"
                          label="Phone Number"
                          labelClassName="text-slate-200"
                          value={signupData.phone}
                          onChange={(e) => {
                            setSignupData((prev) => ({ ...prev, phone: e.target.value }));
                            clearFieldError('phone');
                          }}
                          placeholder="+91 9876543210"
                          icon={Phone}
                          required
                          premium
                          className={inputClassName}
                          error={formErrors.phone}
                        />
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="password"
                          name="password"
                          label="Password"
                          labelClassName="text-slate-200"
                          value={signupData.password}
                          onChange={(e) => {
                            setSignupData((prev) => ({ ...prev, password: e.target.value }));
                            clearFieldError('password');
                          }}
                          placeholder="Create password"
                          icon={Lock}
                          required
                          premium
                          className={inputClassName}
                          error={formErrors.password}
                        />
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="password"
                          name="confirmPassword"
                          label="Confirm Password"
                          labelClassName="text-slate-200"
                          value={signupData.confirmPassword}
                          onChange={(e) => {
                            setSignupData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                            clearFieldError('confirmPassword');
                          }}
                          placeholder="Confirm password"
                          icon={Lock}
                          required
                          premium
                          className={inputClassName}
                          error={formErrors.confirmPassword}
                        />
                      </div>
                    </div>

                    <Button type="submit" loading={loading || isLoading} disabled={!canSubmit} className="h-11 w-full justify-center text-sm font-semibold">
                      <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                )}

                <div className="mt-6 text-center text-sm text-slate-300">
                  {mode === 'login' ? (
                    <>
                      New here?{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/signup')}
                        className="font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        Create account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.04 }}
          className="order-2 flex"
        >
          <div className="w-full rounded-[28px] border border-white/15 bg-white/[0.08] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8 lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto">
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Why MY PG fits this app</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Built for PG owners and managers to solve occupancy, tenant tracking, and monthly collection visibility from one dashboard.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur">
                      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-white">{feature.title}</p>
                      <p className="mt-1 text-xs text-slate-300">{feature.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur">
                <div className="mb-3 flex items-center gap-1">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-200">&quot;{testimonials[currentTestimonial].content}&quot;</p>
                <p className="mt-3 text-sm font-semibold text-white">{testimonials[currentTestimonial].name}</p>
                <p className="text-xs text-slate-400">{testimonials[currentTestimonial].role}</p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
