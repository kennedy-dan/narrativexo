'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/authSlice';
import { openModal } from '@/store/slices/modalSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/',
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      // Open login modal instead of redirecting
      dispatch(openModal({
        message: 'Please log in or sign up to access this content.',
      }));
      
      // You can also redirect if needed
      // router.push(redirectTo);
    }
  }, [loading, isAuthenticated, requireAuth, dispatch, router, redirectTo, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Modal will handle the authentication
  }

  return <>{children}</>;
};

export default ProtectedRoute;