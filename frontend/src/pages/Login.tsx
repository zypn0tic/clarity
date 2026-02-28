import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const hasGoogleClientId = Boolean((import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim());

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSuccess = async (credentialResponse: any) => {
    try {
      await login(credentialResponse.credential);
      toast.success('Welcome to Clarity!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm"
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg shadow-primary-200 dark:shadow-primary-900/30 mb-4">
            <span className="text-white font-bold text-3xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clarity</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Your personal expense tracker. Understand where your money goes.
          </p>
        </div>

        {/* Login Card */}
        <div className="card text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Get Started
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Sign in with your Google account to start tracking your finances.
          </p>

          {!hasGoogleClientId && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Google OAuth is not configured. Set <strong>VITE_GOOGLE_CLIENT_ID</strong> in
              <strong> frontend/.env</strong> and restart the frontend server.
            </p>
          )}

          <div className="flex justify-center">
            {hasGoogleClientId ? (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => toast.error('Google login failed. Please try again.')}
                theme={isDark ? 'filled_black' : 'outline'}
                size="large"
                width="300"
                text="signin_with"
                shape="rectangular"
              />
            ) : (
              <button
                type="button"
                disabled
                className="w-[300px] rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-2.5 text-sm cursor-not-allowed"
              >
                Google Sign-In Unavailable
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '📊', label: 'Smart Dashboard' },
            { icon: '🤖', label: 'AI Categorization' },
            { icon: '📱', label: 'Mobile Friendly' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="text-center p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl"
            >
              <span className="text-2xl">{feature.icon}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
