import { CrmEmployee } from '../models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface User {
  id: number
  name: string
  email: string
  cemail: string
  role: number
  branch: number
  region: number
  type: string
  photo: string
  wfh: number
}

export interface AuthUser extends User {
  token: string
}

function generateToken(user: User): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export async function simpleAuthenticateUser(username: string, password: string): Promise<AuthUser | null> {
  try {
    console.log('Simple auth attempt for:', username);
    
    // Direct database query for CrmEmployee
    const user = await CrmEmployee.findOne({
      where: {
        username: username.toLowerCase(),
        status: 1
      }
    });

    if (!user) {
      console.log('User not found');
      return null;
    }

    // Verify password (plain text for now)
    if (user.password !== password) {
      console.log('Password mismatch');
      return null;
    }

    console.log('Authentication successful for user:', user.name);

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      cemail: user.email || '',
      role: user.role || 1,
      branch: 0,
      region: 0,
      type: user.role === 1 ? 'Administrator' : 'User',
      photo: '',
      wfh: 0
    };

    const token = generateToken(userWithoutPassword);
    
    return { ...userWithoutPassword, token };
  } catch (error) {
    console.error('Simple authentication error:', error);
    return null;
  }
}
