import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyCaptcha } from '@/lib/captcha';
import { logger } from '@/lib/logger';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      avatar?: string | null;
    }
  }
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    avatar?: string | null;
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not defined');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        captchaToken: { label: 'CAPTCHA Token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password || !credentials?.captchaToken) {
            logger.error('Missing credentials:', { 
              hasEmail: !!credentials?.email,
              hasPassword: !!credentials?.password,
              hasCaptcha: !!credentials?.captchaToken
            });
            throw new Error('Please provide all required fields');
          }

          // Verify CAPTCHA
          const isValidCaptcha = await verifyCaptcha(credentials.captchaToken);
          if (!isValidCaptcha) {
            logger.error('Invalid CAPTCHA token');
            throw new Error('Invalid CAPTCHA');
          }

          // Find user
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            logger.error('User not found:', { email: credentials.email });
            throw new Error('Invalid email or password');
          }

          // Verify password
          const isValidPassword = await compare(credentials.password, user.password);

          if (!isValidPassword) {
            logger.error('Invalid password for user:', { email: credentials.email });
            throw new Error('Invalid email or password');
          }

          // Check if email is verified
          if (!user.emailVerified) {
            logger.error('Email not verified:', { email: credentials.email });
            throw new Error('Please verify your email address before signing in');
          }

          logger.info('Login successful:', { 
            userId: user.id,
            email: user.email,
            name: user.name 
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          };
        } catch (error) {
          logger.error('Authorization error:', error);
          throw error;
        }
      },
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.avatar = user.avatar;
        token.picture = user.avatar ? `/avatars/${user.avatar}` : '/avatars/Avatar1.webp';
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.avatar = token.avatar as string;
        session.user.image = token.picture as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
}; 