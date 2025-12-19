"use client";

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import AuthModal from '@/components/AuthModal';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
// import LoginButton from '../LoginButton';

// This component wraps the layout with Redux
const ReduxProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load user from localStorage on client side
    store.dispatch({ type: 'auth/loadUser' });
  }, []);

  if (!isClient) {
    return <>{children}</>; // Return children without Redux during SSR
  }

  return (
    <Provider store={store}>
      {children}
      <AuthModal />
    </Provider>
  );
};

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReduxProvider>
      <LayoutContent>{children}</LayoutContent>
    </ReduxProvider>
  );
};

export default Layout;