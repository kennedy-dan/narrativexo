import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    console.log('Signup request body:', req.body);
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Please provide all required fields' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Email already exists' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}