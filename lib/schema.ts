import { z } from "zod";

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(120, `${label} is too long`);

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().max(120).optional()
);

export const patientSchema = z.object({
  firstName: requiredText("First name"),
  middleName: optionalText,
  lastName: requiredText("Last name"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: requiredText("Gender"),
  phoneNumber: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(30, "Phone number is too long")
    .regex(/^[+()\-\s0-9]+$/, "Use a valid phone number"),
  email: z.string().trim().email("Use a valid email address"),
  address: z.string().trim().min(1, "Address is required").max(240),
  preferredLanguage: requiredText("Preferred language"),
  nationality: requiredText("Nationality"),
  emergencyContact: z
    .object({
      name: optionalText,
      relationship: optionalText
    })
    .optional(),
  religion: optionalText
});

export const patientFieldSchema = z.enum([
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phoneNumber",
  "email",
  "address",
  "preferredLanguage",
  "nationality",
  "emergencyContact.name",
  "emergencyContact.relationship",
  "religion"
]);

export const sessionIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/, "Session IDs may only contain letters, numbers, dashes, and underscores");

export const fieldStatusSchema = z.enum(["inactive", "filling", "submitted"]);

export const patientUpdatePayloadSchema = z.object({
  sessionId: sessionIdSchema,
  field: patientFieldSchema,
  value: z.string().max(500)
});

export const patientStatusPayloadSchema = z.object({
  sessionId: sessionIdSchema,
  status: fieldStatusSchema
});

export const patientSubmitPayloadSchema = z.object({
  sessionId: sessionIdSchema,
  data: patientSchema
});

export type PatientData = z.infer<typeof patientSchema>;
export type PatientField = z.infer<typeof patientFieldSchema>;
export type FieldStatus = z.infer<typeof fieldStatusSchema>;
export type PatientUpdatePayload = z.infer<typeof patientUpdatePayloadSchema>;
export type PatientStatusPayload = z.infer<typeof patientStatusPayloadSchema>;
export type PatientSubmitPayload = z.infer<typeof patientSubmitPayloadSchema>;

export type PatientSnapshot = {
  sessionId: string;
  data: Partial<PatientData>;
  status: FieldStatus;
  updatedAt: string;
};
