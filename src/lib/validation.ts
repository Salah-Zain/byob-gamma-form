import { z } from "zod";

// Phone: accepts +country code optional, 10-15 digits, allows spaces/dashes
const PHONE_REGEX = /^[+]?[\d][\d\s\-()]{8,18}\d$/;

export const phoneSchema = z
  .string()
  .trim()
  .min(10, { message: "Phone number must be at least 10 digits" })
  .max(20, { message: "Phone number is too long" })
  .regex(PHONE_REGEX, { message: "Enter a valid phone number (e.g. +91 98765 43210)" });

export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "Full name must be entered" })
  .max(100, { message: "Name must be less than 100 characters" })
  .regex(/^[a-zA-Z\s.''-]+$/, { message: "Name can only contain letters, spaces, and . ' -" });

export const shortText = (field: string, min = 5, max = 200) =>
  z.string().trim()
    .min(min, { message: `${field} must be at least ${min} characters` })
    .max(max, { message: `${field} must be less than ${max} characters` });

export const longText = (field: string, min = 10, max = 600) =>
  z.string().trim()
    .min(min, { message: `${field} must be at least ${min} characters` })
    .max(max, { message: `${field} must be less than ${max} characters` });

export const submissionSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  stage: z.string().min(1, { message: "Please select your current stage" }),
  ideaSentence: shortText("Idea sentence", 10, 200),
  buildingWhat: longText("What you're building", 15, 600),
  targetCustomer: longText("Target customer", 10, 400),
  problem: longText("Problem", 10, 400),
  currentSolutions: longText("Current solutions", 10, 400),
  whySwitch: longText("Why switch", 10, 400),
  doneSoFar: z.array(z.string()).min(1, { message: "Select at least one option" }),
  bottleneck: z.string().min(1, { message: "Please select your biggest bottleneck" }),
  hoursWeekly: z.string().min(1, { message: "Please choose your weekly hours" }),
  outcome: longText("Outcome", 15, 600),
  agreed: z.literal(true, { message: "You must agree to commit" }),
});

// Validate a partial subset by step
export const stepFields: Record<number, (keyof z.infer<typeof submissionSchema>)[]> = {
  0: ["fullName", "phone"],
  1: ["stage", "ideaSentence", "buildingWhat"],
  2: ["targetCustomer", "problem", "currentSolutions", "whySwitch"],
  3: ["doneSoFar", "bottleneck"],
  4: ["hoursWeekly", "outcome"],
  5: ["agreed"],
};

export type SubmissionInput = z.infer<typeof submissionSchema>;

export function validateStep(
  step: number,
  data: Record<string, unknown>
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const fields = stepFields[step] ?? [];
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const fieldSchema = submissionSchema.shape[f];
    const result = fieldSchema.safeParse(data[f]);
    if (!result.success) {
      errors[f] = result.error.issues[0]?.message ?? "Invalid value";
    }
  }
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}
