import { z } from 'zod';

export const clockInSchema = {
  body: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isWfh: z.boolean().optional(),
    qrScanned: z.boolean().optional()
  })
};

export const clockOutSchema = {
  body: z.object({}) // empty body ok
};

export const correctionSchema = {
  body: z.object({
    date: z.string().min(1, "Date is required"),
    reason: z.string().min(1, "Reason is required"),
    correctedClockIn: z.string().min(1, "Corrected Clock-In time is required"),
    correctedClockOut: z.string().min(1, "Corrected Clock-Out time is required")
  })
};

export const reviewCorrectionSchema = {
  body: z.object({
    action: z.enum(['Approve', 'Reject'])
  }),
  params: z.object({
    id: z.string().min(1)
  })
};
