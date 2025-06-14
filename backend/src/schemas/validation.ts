import { z } from 'zod';

export const userRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const leadLogSchema = z.object({
  leadId: z.string(),
  companyName: z.string().min(1),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const crmStatusLogSchema = z.object({
  leadId: z.string(),
  previousStatus: z.string(),
  newStatus: z.string(),
  notes: z.string().optional(),
});

export const slackAuthSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});
