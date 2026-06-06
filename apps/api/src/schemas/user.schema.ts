import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const CreateUserSchema = z.object({
  nama: z.string().min(1).max(100),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  role: z.enum(['admin', 'kasir']),
});

export const UpdateUserSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'kasir']).optional(),
  isActive: z.boolean().optional(),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
