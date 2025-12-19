'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { openModal } from '@/store/slices/modalSlice';

const LoginButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Welcome, {user?.name}
        </span>
        <button
          onClick={() => dispatch(logout())}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-4">
      <button
        onClick={() => dispatch(openModal({ type: 'login' }))}
        className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Login
      </button>
      <button
        onClick={() => dispatch(openModal({ type: 'signup' }))}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Sign Up
      </button>
    </div>
  );
};

export default LoginButton;