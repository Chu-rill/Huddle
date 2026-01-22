import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, { message: 'Organization name is required' }),
  ownerId: z.string().uuid({ message: 'Invalid owner ID format' }),
});

export const UpdateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Organization name is required' })
    .optional(),
});

// Type inference from Zod schemas
export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;
