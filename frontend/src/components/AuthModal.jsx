import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, loginUser, signUpUser, loginWithGoogle, resetPassword, authFormKey = 0 } = useApp();
  
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [localKey, setLocalKey] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
    setLoading(false);
    setGoogleLoading(false);
    setLocalKey((prev) => prev + 1);
  };

  // Hard reset form state whenever modal open status or global authFormKey changes
  useEffect(() => {
    if (isAuthModalOpen) {
      resetForm();
      // Short timer override to ensure any asynchronous browser autofill attempt is cleared
      const timer = setTimeout(() => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setView('login');
      resetForm();
    }
  }, [isAuthModalOpen, authFormKey]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleSwitchView = (newView) => {
    resetForm();
    setView(newView);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || 'Google authentication failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (view === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your passwords.');
      return;
    }

    setLoading(true);

    try {
      if (view === 'login') {
        await loginUser(email, password);
        resetForm();
        handleClose();
      } else if (view === 'signup') {
        await signUpUser(name, email, password);
        resetForm();
        setSuccessMsg('Account created successfully! If email verification is enabled on your project, please check your inbox.');
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else if (view === 'forgot') {
        await resetPassword(email);
        setSuccessMsg(`Password reset instructions have been sent to ${email}.`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'An authentication error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentFormKey = `auth-form-${authFormKey}-${localKey}-${view}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl border border-surface-container overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-surface-container-low px-6 py-5 border-b border-surface-container flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif text-xl font-bold text-on-surface">
              {view === 'login' && 'Welcome to Ambience Inn'}
              {view === 'signup' && 'Create Your Account'}
              {view === 'forgot' && 'Reset Password'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
              Access your reservations and direct member privileges
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {(view === 'login' || view === 'signup') && (
            <div className="mb-5">
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-semibold text-xs rounded-xl border border-surface-container shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {googleLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-surface-container w-full"></div>
                <span className="bg-surface-container-lowest px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 absolute">
                  OR
                </span>
              </div>
            </div>
          )}

          <form
            key={currentFormKey}
            autoComplete="off"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {view === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Name *
                </label>
                <input
                  key={`name-${currentFormKey}`}
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. Sarthak Andhale"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Email Address *
              </label>
              <input
                key={`email-${currentFormKey}`}
                type="email"
                required
                autoComplete="off"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {view !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Password *
                  </label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchView('forgot')}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    key={`password-${currentFormKey}`}
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Confirm Password *
                </label>
                <input
                  key={`confirm-${currentFormKey}`}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-all shadow-md mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>
                  {view === 'login' && 'SIGN IN'}
                  {view === 'signup' && 'CREATE ACCOUNT'}
                  {view === 'forgot' && 'SEND RESET LINK'}
                </span>
              )}
            </button>
          </form>

          {/* View Toggle Footers */}
          <div className="mt-6 text-center text-xs text-on-surface-variant font-medium border-t border-surface-container pt-4">
            {view === 'login' && (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('signup')}
                  className="text-primary font-bold hover:underline"
                >
                  Sign Up
                </button>
              </p>
            )}
            {view === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('login')}
                  className="text-primary font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
            {view === 'forgot' && (
              <button
                type="button"
                onClick={() => handleSwitchView('login')}
                className="text-primary font-bold hover:underline"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
