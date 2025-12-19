"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { loadUser } from '@/store/slices/authSlice';
import "../styles/global.css";

// Component to handle client-side initialization
const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Load user from localStorage on client side
    store.dispatch(loadUser());
  }, []);

  return <>{children}</>;
};

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <ClientWrapper>
        <Component {...pageProps} />
      </ClientWrapper>
    </Provider>
  );
}