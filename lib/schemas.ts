import { z } from "zod";

export const createTrialSchema = z.object({
  trialName: z
    .string()
    .min(1, "trialName is required.")
    .transform((v) => v.trim()),
  nctId: z
    .string()
    .optional()
    .default("")
    .transform((v) => v.trim().toUpperCase()),
  phase: z.string().optional().default(""),
  sampleSize: z.coerce.number().int().min(0).optional().default(0),
  indication: z
    .string()
    .optional()
    .default("")
    .transform((v) => v.trim()),
  sponsor: z
    .string()
    .optional()
    .default("")
    .transform((v) => v.trim()),
  primaryEndpoint: z
    .string()
    .optional()
    .default("")
    .transform((v) => v.trim()),
  status: z.string().optional().default(""),
  notes: z
    .string()
    .optional()
    .default("")
    .transform((v) => v.trim()),
});

export const updateTrialSchema = z
  .object({
    trialName: z
      .string()
      .min(1, "trialName cannot be empty.")
      .transform((v) => v.trim())
      .optional(),
    nctId: z
      .string()
      .transform((v) => v.trim().toUpperCase())
      .optional(),
    phase: z.string().optional(),
    sampleSize: z.coerce.number().int().min(0).optional(),
    indication: z
      .string()
      .transform((v) => v.trim())
      .optional(),
    sponsor: z
      .string()
      .transform((v) => v.trim())
      .optional(),
    primaryEndpoint: z
      .string()
      .transform((v) => v.trim())
      .optional(),
    status: z.string().optional(),
    notes: z
      .string()
      .transform((v) => v.trim())
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export type CreateTrialInput = z.infer<typeof createTrialSchema>;
export type UpdateTrialInput = z.infer<typeof updateTrialSchema>;
