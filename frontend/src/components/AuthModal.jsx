import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, loginUser, signUpUser, resetPassword, authFormKey = 0 } = useApp();
  
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [localKey, setLocalKey] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
