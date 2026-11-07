import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminPasswordModalProps {
  isOpen: boolean;
  correctPassword?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  correctPassword = 'egasa2025',
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, user } = useAuth();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      try {
        sessionStorage.setItem('egasa_admin_auth', 'true');
      } catch {
        // ignore
      }
      setIsLoading(false);
      onSuccess();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setIsLoading(false);
      setError('تعذر تسجيل الدخول بحساب Google. يمكنك استخدام كلمة المرور أدناه.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const actualPassword = (correctPassword || 'egasa2025').trim();
    const enteredPassword = password.trim();

    if (enteredPassword === actualPassword) {
      // كلمة المرور صحيحة — يجب تسجيل الدخول بحساب Google أيضاً
      // حتى تُسمح قواعد Firestore بتعديل المنتجات والإعدادات (مزامنة عبر كل الأجهزة)
      try {
        await signInWithGoogle();
      } catch (err: any) {
        setIsLoading(false);
        setError('تعذر تسجيل الدخول بحساب Google. يلزم ذلك لحفظ التعديلات ومزامنتها.');
        return;
      }
      try {
        sessionStorage.setItem('egasa_admin_auth', 'true');
      } catch {
        // ignore
      }
      setIsLoading(false);
      setPassword('');
      setError('');
      onSuccess();
    } else {
      setIsLoading(false);
      setError('كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Cairo',sans-serif]">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1C1917] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 flex items-center justify-center border border-teal-600/40 text-teal-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تسجيل دخول الإدارة</h3>
              <p className="text-[11px] text-stone-400">لوحة التحكم محمية بكلمة مرور للمسؤولين فقط</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white border border-stone-300 hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.4 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>دخول سريع بحساب Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] text-stone-600 font-bold shrink-0">أو بكلمة المرور</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              كلمة مرور لوحة التحكم *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="أدخل كلمة المرور..."
                className="w-full pr-10 pl-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition-all font-sans"
              />
              <KeyRound className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-[11px] text-stone-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>منطقة محمية ومشفرة</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              هذه المنطقة مخصصة لإدارة المتجر ومحمية بكلمة مرور خاصة بك لمنع وصول أي زائر للبيانات.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};
