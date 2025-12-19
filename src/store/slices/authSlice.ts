import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loginUser, signupUser } from '@/store/authAction'; // Import the async thunks

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const isClient = typeof window !== 'undefined';

const getInitialState = (): AuthState => {
  if (!isClient) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
    }
  }

  return {
    user,
    token,
    isAuthenticated: !!token,
    loading: false,
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      
      if (isClient) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    loadUser: (state) => {
      if (!isClient) return;
      
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        
        if (isClient) {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Login failed';
      })
      
      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        
        if (isClient) {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Signup failed';
      });
  },
});

export const { logout, loadUser, clearError } = authSlice.actions;
export default authSlice.reducer;