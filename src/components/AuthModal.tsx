'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeModal, setModalType } from '@/store/slices/modalSlice';
import { loginUser, signupUser } from '@/store/authAction';
import { clearError } from '@/store/slices/authSlice';
import { handleThunkResult } from '@/lib/thunkHelper';

const AuthModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, modalType, message } = useAppSelector((state) => state.modal);
  const { loading, error } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (modalType === 'signup') {
      if (!formData.name) {
        errors.name = 'Name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
  try {
  if (modalType === 'login') {
    await handleThunkResult(
      dispatch,
      loginUser({
        email: formData.email,
        password: formData.password,
      })
    );
    
    dispatch(closeModal());
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  } else {
    await handleThunkResult(
      dispatch,
      signupUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
    );
    
    dispatch(closeModal());
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  }
} catch (error) {
  console.error('Authentication failed:', error);
}
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const switchModalType = (type: 'login' | 'signup') => {
    dispatch(setModalType(type));
    setFormErrors({});
    dispatch(clearError());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => dispatch(closeModal())}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => dispatch(closeModal())}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">
                {modalType === 'login' ? 'Login' : 'Sign Up'}
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                {message}
              </p>
              
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => switchModalType('login')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      modalType === 'login'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => switchModalType('signup')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      modalType === 'signup'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Sign Up
                  </button>
                </nav>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalType === 'signup' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>
                
                {modalType === 'signup' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    modalType === 'login' ? 'Login' : 'Sign Up'
                  )}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {modalType === 'login' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchModalType('signup')}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchModalType('login')}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Login
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;