import { createAsyncThunk } from '@reduxjs/toolkit';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Login failed');
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (credentials: SignupCredentials, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Signup failed');
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);