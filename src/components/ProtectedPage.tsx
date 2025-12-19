"use client";

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/authSlice';
import { openModal } from '@/store/slices/modalSlice';
import AuthModal from './AuthModal';

interface ProtectedPageProps {
  children: React.ReactNode;
}

const ProtectedPage = ({ children }: ProtectedPageProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Show login modal
      dispatch(openModal({
        message: 'Log in or sign up to create amazing stories!',
        type: 'login'
      }));
      
      // Optional: Redirect to home if not authenticated
      // router.push('/');
    }
  }, [loading, isAuthenticated, dispatch, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show placeholder while modal is open
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in or sign up to access the story creation features. The login modal should appear automatically.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => dispatch(openModal({ type: 'login' }))}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg w-full"
              >
                Open Login Modal
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 w-full"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
        <AuthModal />
      </div>
    );
  }

  return (
    <>
      {children}
      <AuthModal />
    </>
  );
};

export default ProtectedPage;