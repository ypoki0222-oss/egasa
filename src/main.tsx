import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">حدث خطأ أثناء تحميل الصفحة</h1>
            <p className="text-sm text-slate-600 mb-6 font-mono bg-slate-100 p-3 rounded-lg overflow-x-auto text-left" dir="ltr">
              {this.state.error?.message || 'خطأ غير متوقع'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-xs"
              >
                إعادة تحميل الصفحة
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('egasa_store_settings_v3');
                    localStorage.removeItem('egasa_store_products_v3');
                    localStorage.removeItem('egasa_store_orders_v3');
                    localStorage.removeItem('egasa_store_settings_v4');
                    localStorage.removeItem('egasa_store_products_v4');
                    localStorage.removeItem('egasa_store_orders_v4');
                    localStorage.removeItem('egasa_cache_migrated_v4');
                    sessionStorage.clear();
                  } catch (e) {
                    console.error(e);
                  }
                  window.location.href = window.location.pathname;
                }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-5 py-2.5 rounded-xl transition-all border border-stone-200 cursor-pointer text-xs"
              >
                مسح البيانات المؤقتة والبدء من جديد
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const appTree = (
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

const rootContainer = document.getElementById('root');
// Edge SSR: snapshot + static markup were injected before this module runs.
// Hydrate to attach React to the existing DOM (no flicker / no full replacement).
// Fall back to createRoot in dev (no embedded snapshot / empty root) or if hydration throws.
const hasEmbeddedSnapshot =
  !!document.getElementById('egasa-published-snapshot') ||
  !!(typeof window !== 'undefined' && (window as any).__EGASA_SNAPSHOT__);

if (hasEmbeddedSnapshot && rootContainer && rootContainer.children.length > 0) {
  try {
    hydrateRoot(rootContainer, appTree);
  } catch (err) {
    console.warn('[main] hydrateRoot failed, falling back to createRoot:', err);
    createRoot(rootContainer).render(appTree);
  }
} else {
  createRoot(rootContainer!).render(appTree);
}
