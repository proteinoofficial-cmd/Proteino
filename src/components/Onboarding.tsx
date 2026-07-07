import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Flame, 
  ShieldCheck, 
  User, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronLeft,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import mascotImg from '../assets/images/mascot_illustration_1783093311674.jpg';
import proteinoLogo from '../assets/images/proteino_logo_1783248797173.jpg';

interface OnboardingProps {
  onRegister: (name: string, phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onLogin: (phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onResetPassword: (phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

export default function Onboarding({ onRegister, onLogin, onResetPassword }: OnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'register' | 'login' | 'forgot'>('welcome');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(window.location.origin)}`);
      if (!res.ok) throw new Error('Failed to get authentication URL');
      const { url } = await res.json();
      
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'Google Sign-In',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );
      
      if (!popup) {
        setError('Popup blocked! Please allow popups to continue with Google.');
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError('Could not initialize Google sign-in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    if (phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!pass.trim()) {
      setError('Please create a password');
      return;
    }
    if (pass.trim().length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }
    if (pass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const res = await onRegister(name.trim(), phone.trim(), pass.trim());
    setIsLoading(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!phone.trim()) {
      setError('Please enter your registered mobile number');
      return;
    }
    if (phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!pass.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    const res = await onLogin(phone.trim(), pass.trim());
    setIsLoading(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setSuccessMsg('');

    if (!phone.trim()) {
      setError('Please enter your registered mobile number');
      return;
    }
    if (phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!pass.trim()) {
      setError('Please enter a new password');
      return;
    }
    if (pass.trim().length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }
    if (pass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const res = await onResetPassword(phone.trim(), pass.trim());
    setIsLoading(false);
    if (res.success) {
      setSuccessMsg('Password changed successfully! Please log in with your new password.');
      setStep('login');
      setPass('');
      setConfirmPass('');
    } else {
      setError(res.error || 'Failed to change password. Make sure the number is registered.');
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-screen bg-[#FAF9F6] p-6 select-none overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col justify-between h-full flex-grow"
          >
            {/* Top Section: Logo & Branding */}
            <div className="flex flex-col items-center mt-6 text-center">
              {/* Custom Brand Logo */}
              <div className="relative mb-4 w-32 h-32 rounded-3xl overflow-hidden shadow-lg border-2 border-brand-green/20 bg-[#0F1E36]">
                <img 
                  src={proteinoLogo} 
                  alt="Proteino Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <motion.span 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="absolute -top-1 -right-1 text-base animate-bounce"
                >
                  ✨
                </motion.span>
              </div>

              {/* Brand Typography */}
              <h1 className="text-4xl font-extrabold tracking-wider text-brand-green font-display italic">
                PROTEINO
              </h1>
              <p className="mt-2 text-base font-semibold text-brand-navy/60">
                Healthy meals. Delivered to you.
              </p>
            </div>

            {/* Middle Section: Mascot/Illustration */}
            <div className="my-auto flex flex-col items-center justify-center p-4">
              <div className="relative max-w-[280px] aspect-square rounded-3xl overflow-hidden shadow-sm border border-brand-navy/5 bg-white p-2">
                <img 
                  src={mascotImg} 
                  alt="Proteino Fitness Mascot" 
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                {/* Floating badges */}
                <div className="absolute top-4 -left-2 bg-[#FAF9F6] border border-brand-green/30 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-brand-green fill-brand-green" />
                  <span className="text-[10px] font-bold text-brand-navy">High Protein</span>
                </div>
                <div className="absolute bottom-4 -right-2 bg-[#FAF9F6] border border-brand-green/30 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                  <span className="text-[10px] font-bold text-brand-navy">100% Clean</span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Actions */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={() => { setStep('register'); setError(''); }}
                id="btn-get-started"
                className="group relative flex items-center justify-center gap-2 w-full py-4 bg-brand-green hover:bg-brand-green-hover text-white font-bold text-lg rounded-2xl shadow-md active:scale-95 transition-all duration-200 cursor-pointer border-0"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="flex items-center my-1">
                <div className="flex-grow h-px bg-brand-navy/10"></div>
                <span className="px-3 text-[10px] font-black text-brand-navy/30 uppercase tracking-widest">or</span>
                <div className="flex-grow h-px bg-brand-navy/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-sm rounded-2xl shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center mt-1">
                <p className="text-sm text-brand-navy/60 font-medium">
                  Already have an account?{' '}
                  <button 
                    onClick={() => { setStep('login'); setError(''); }} 
                    className="text-brand-green hover:underline font-bold focus:outline-none cursor-pointer bg-transparent border-none p-0"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full flex-grow justify-between"
          >
            {/* Top Navigation */}
            <div>
              <button
                onClick={() => { setStep('welcome'); setError(''); }}
                className="flex items-center gap-1 text-xs font-bold text-brand-navy/50 hover:text-brand-navy mt-4 bg-transparent border-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="mt-6">
                <h2 className="text-2xl font-black text-brand-navy tracking-tight">Create Account</h2>
                <p className="text-xs font-semibold text-brand-navy/50 mt-1">
                  Enter your details to calculate customized fitness macros.
                </p>
              </div>
            </div>

            {/* Form Fields Section */}
            <form onSubmit={handleRegisterSubmit} className="my-auto flex flex-col gap-4 py-4">
              
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold rounded-2xl p-3 flex items-center gap-2"
                >
                  <span className="text-sm">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Full Name</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <User className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Mobile Number</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Phone className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Password</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Lock className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="Create a password"
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-brand-navy/40 hover:text-brand-navy focus:outline-none bg-transparent border-none cursor-pointer p-0 ml-1.5"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Confirm Password</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Lock className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type={showConfirmPass ? 'text' : 'password'} 
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Confirm your password"
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="text-brand-navy/40 hover:text-brand-navy focus:outline-none bg-transparent border-none cursor-pointer p-0 ml-1.5"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-complete-register"
                disabled={isLoading}
                className="group relative flex items-center justify-center gap-2 w-full py-4 mt-2 bg-brand-green hover:bg-brand-green-hover text-white font-bold text-lg rounded-2xl shadow-md active:scale-95 transition-all duration-200 cursor-pointer border-0 disabled:opacity-70"
              >
                <span>{isLoading ? 'Processing...' : 'Register & Calculate Goals'}</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>

              <div className="flex items-center my-1">
                <div className="flex-grow h-px bg-brand-navy/10"></div>
                <span className="px-3 text-[10px] font-black text-brand-navy/30 uppercase tracking-widest">or</span>
                <div className="flex-grow h-px bg-brand-navy/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-sm rounded-2xl shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Sign up with Google</span>
              </button>
            </form>

            {/* Bottom Toggle */}
            <div className="mb-6 text-center flex flex-col gap-2.5">
              <p className="text-sm text-brand-navy/60 font-medium">
                Already have an account?{' '}
                <button 
                  onClick={() => { setStep('login'); setError(''); }} 
                  className="text-brand-green hover:underline font-bold focus:outline-none cursor-pointer bg-transparent border-none p-0"
                >
                  Log in
                </button>
              </p>
              <p className="text-[10px] text-brand-navy/40 font-semibold px-4">
                By registering, you agree to our terms of strict high-protein meal preps & fitness routines.
              </p>
            </div>
          </motion.div>
        )}

        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full flex-grow justify-between"
          >
            {/* Top Navigation */}
            <div>
              <button
                onClick={() => { setStep('welcome'); setError(''); setSuccessMsg(''); }}
                className="flex items-center gap-1 text-xs font-bold text-brand-navy/50 hover:text-brand-navy mt-4 bg-transparent border-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="mt-6">
                <h2 className="text-2xl font-black text-brand-navy tracking-tight">Welcome Back</h2>
                <p className="text-xs font-semibold text-brand-navy/50 mt-1">
                  Log in to retrieve your high-protein diet goals.
                </p>
              </div>
            </div>

            {/* Form Fields Section */}
            <form onSubmit={handleLoginSubmit} className="my-auto flex flex-col gap-4 py-4">
              
              {/* Success Message */}
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 text-green-700 border border-green-100 text-xs font-semibold rounded-2xl p-3 flex items-center gap-2"
                >
                  <span className="text-sm">✅</span>
                  <span>{successMsg}</span>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold rounded-2xl p-3 flex items-center gap-2"
                >
                  <span className="text-sm">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Mobile Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Mobile Number</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Phone className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Password</label>
                  <button
                    type="button"
                    onClick={() => { setStep('forgot'); setError(''); setSuccessMsg(''); }}
                    className="text-[10px] font-bold text-brand-green hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Lock className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-brand-navy/40 hover:text-brand-navy focus:outline-none bg-transparent border-none cursor-pointer p-0 ml-1.5"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-complete-login"
                disabled={isLoading}
                className="group relative flex items-center justify-center gap-2 w-full py-4 mt-2 bg-brand-green hover:bg-brand-green-hover text-white font-bold text-lg rounded-2xl shadow-md active:scale-95 transition-all duration-200 cursor-pointer border-0 disabled:opacity-70"
              >
                <span>{isLoading ? 'Verifying...' : 'Log In & Proceed'}</span>
                <LogIn className="w-5 h-5" />
              </button>

              <div className="flex items-center my-1">
                <div className="flex-grow h-px bg-brand-navy/10"></div>
                <span className="px-3 text-[10px] font-black text-brand-navy/30 uppercase tracking-widest">or</span>
                <div className="flex-grow h-px bg-brand-navy/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-sm rounded-2xl shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </form>

            {/* Bottom Toggle */}
            <div className="mb-6 text-center flex flex-col gap-2.5">
              <p className="text-sm text-brand-navy/60 font-medium">
                Don't have an account?{' '}
                <button 
                  onClick={() => { setStep('register'); setError(''); setSuccessMsg(''); }} 
                  className="text-brand-green hover:underline font-bold focus:outline-none cursor-pointer bg-transparent border-none p-0"
                >
                  Register
                </button>
              </p>
              <p className="text-[10px] text-brand-navy/40 font-semibold px-4">
                Retrieve your personalized health targets instantly using your phone number.
              </p>
            </div>
          </motion.div>
        )}

        {step === 'forgot' && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full flex-grow justify-between"
          >
            {/* Top Navigation */}
            <div>
              <button
                onClick={() => { setStep('login'); setError(''); setSuccessMsg(''); }}
                className="flex items-center gap-1 text-xs font-bold text-brand-navy/50 hover:text-brand-navy mt-4 bg-transparent border-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Log In</span>
              </button>

              <div className="mt-6">
                <h2 className="text-2xl font-black text-brand-navy tracking-tight">Reset Password</h2>
                <p className="text-xs font-semibold text-brand-navy/50 mt-1">
                  Enter your registered mobile number and choose a new password.
                </p>
              </div>
            </div>

            {/* Form Fields Section */}
            <form onSubmit={handleForgotPasswordSubmit} className="my-auto flex flex-col gap-4 py-4">
              
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold rounded-2xl p-3 flex items-center gap-2"
                >
                  <span className="text-sm">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Mobile Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Registered Mobile Number</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Phone className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">New Password</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Lock className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="Enter new password"
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-brand-navy/40 hover:text-brand-navy focus:outline-none bg-transparent border-none cursor-pointer p-0 ml-1.5"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Confirm New Password</label>
                <div className="flex items-center bg-white border border-brand-navy/5 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-brand-green/30 transition-all">
                  <Lock className="w-4 h-4 text-brand-navy/30 mr-2.5" />
                  <input 
                    type={showConfirmPass ? 'text' : 'password'} 
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none placeholder:text-brand-navy/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="text-brand-navy/40 hover:text-brand-navy focus:outline-none bg-transparent border-none cursor-pointer p-0 ml-1.5"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-complete-forgot"
                disabled={isLoading}
                className="group relative flex items-center justify-center gap-2 w-full py-4 mt-2 bg-brand-green hover:bg-brand-green-hover text-white font-bold text-lg rounded-2xl shadow-md active:scale-95 transition-all duration-200 cursor-pointer border-0 disabled:opacity-70"
              >
                <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </form>

            {/* Bottom Toggle */}
            <div className="mb-6 text-center flex flex-col gap-2.5">
              <p className="text-sm text-brand-navy/60 font-medium">
                Remembered your password?{' '}
                <button 
                  onClick={() => { setStep('login'); setError(''); setSuccessMsg(''); }} 
                  className="text-brand-green hover:underline font-bold focus:outline-none cursor-pointer bg-transparent border-none p-0"
                >
                  Log in
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
