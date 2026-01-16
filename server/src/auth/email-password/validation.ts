import { z } from 'zod';
export const SignupSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
      },
    ),
  email: z.string().email({ message: 'Invalid email format' }),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
      },
    ),
});

export const otp = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  OTP: z.string().min(1, { message: 'OTP is required' }),
});

export const resendOtp = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

// Type inference from Zod schemas
export type SignupDto = z.infer<typeof SignupSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type CreateOTPDto = z.infer<typeof otp>;
export type ResendOTPDto = z.infer<typeof resendOtp>;
