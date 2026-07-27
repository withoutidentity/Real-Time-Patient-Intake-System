"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/Button";
import { FormField } from "./FormField";
import {
  emitPatientStatus,
  emitPatientSubmitted,
  emitPatientUpdate,
  joinPatientSession
} from "../../lib/socket-client";
import { sanitizeDeep } from "../../lib/sanitize";
import { type FieldStatus, type PatientData, type PatientField, patientSchema } from "../../lib/schema";

const genders = [
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Prefer not to say", value: "prefer-not-to-say" }
];

const languages = [
  { label: "English", value: "english" },
  { label: "Spanish", value: "spanish" },
  { label: "Thai", value: "thai" },
  { label: "Mandarin", value: "mandarin" },
  { label: "Other", value: "other" }
];

const fieldNames = new Set<PatientField>([
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

const defaultValues: PatientData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phoneNumber: "",
  email: "",
  address: "",
  preferredLanguage: "",
  nationality: "",
  emergencyContact: {
    name: "",
    relationship: ""
  },
  religion: ""
};

type PatientFormProps = {
  sessionId: string;
};

export function PatientForm({ sessionId }: PatientFormProps) {
  const [localStatus, setLocalStatus] = useState<FieldStatus>("inactive");
  const [submitted, setSubmitted] = useState(false);
  const updateTimer = useRef<number>();
  const inactiveTimer = useRef<number>();

  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    watch
  } = useForm<PatientData>({
    resolver: zodResolver(patientSchema),
    defaultValues,
    mode: "onBlur"
  });

  useEffect(() => {
    joinPatientSession(sessionId);
    emitPatientStatus({ sessionId, status: "inactive" });
  }, [sessionId]);

  useEffect(() => {
    const subscription = watch((_value, info) => {
      const field = info.name as PatientField | undefined;

      if (!field || !fieldNames.has(field) || submitted) {
        return;
      }

      window.clearTimeout(updateTimer.current);
      window.clearTimeout(inactiveTimer.current);
      setLocalStatus("filling");
      emitPatientStatus({ sessionId, status: "filling" });

      updateTimer.current = window.setTimeout(() => {
        const value = getValues(field as keyof PatientData) ?? "";
        emitPatientUpdate({
          sessionId,
          field,
          value: typeof value === "string" ? value : ""
        });
      }, 300);
    });

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(updateTimer.current);
      window.clearTimeout(inactiveTimer.current);
    };
  }, [getValues, sessionId, submitted, watch]);

  function markInactive() {
    if (submitted) {
      return;
    }

    window.clearTimeout(inactiveTimer.current);
    inactiveTimer.current = window.setTimeout(() => {
      setLocalStatus("inactive");
      emitPatientStatus({ sessionId, status: "inactive" });
    }, 500);
  }

  const onSubmit = handleSubmit((values) => {
    const sanitized = sanitizeDeep(values);
    emitPatientSubmitted({ sessionId, data: sanitized });
    setSubmitted(true);
    setLocalStatus("submitted");
  });

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-panel sm:p-6">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">Patient Intake</h1>
            <p className="mt-1 text-sm text-zinc-600">Session ID: {sessionId}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
            {localStatus === "submitted" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            ) : localStatus === "filling" ? (
              <Activity className="h-4 w-4 text-blue-700" aria-hidden="true" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" aria-hidden="true" />
            )}
            {localStatus}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <FormField
            error={errors.firstName?.message}
            id="firstName"
            label="First name"
            onFieldBlur={markInactive}
            register={register("firstName")}
          />
          <FormField
            error={errors.middleName?.message}
            id="middleName"
            label="Middle name"
            onFieldBlur={markInactive}
            optional
            register={register("middleName")}
          />
          <FormField
            error={errors.lastName?.message}
            id="lastName"
            label="Last name"
            onFieldBlur={markInactive}
            register={register("lastName")}
          />
          <FormField
            error={errors.dateOfBirth?.message}
            id="dateOfBirth"
            label="Date of birth"
            onFieldBlur={markInactive}
            register={register("dateOfBirth")}
            type="date"
          />
          <FormField
            error={errors.gender?.message}
            id="gender"
            label="Gender"
            onFieldBlur={markInactive}
            options={genders}
            register={register("gender")}
          />
          <FormField
            error={errors.phoneNumber?.message}
            id="phoneNumber"
            inputMode="tel"
            label="Phone number"
            onFieldBlur={markInactive}
            register={register("phoneNumber")}
            type="tel"
          />
          <FormField
            error={errors.email?.message}
            id="email"
            inputMode="email"
            label="Email"
            onFieldBlur={markInactive}
            register={register("email")}
            type="email"
          />
          <FormField
            error={errors.preferredLanguage?.message}
            id="preferredLanguage"
            label="Preferred language"
            onFieldBlur={markInactive}
            options={languages}
            register={register("preferredLanguage")}
          />
          <FormField
            error={errors.nationality?.message}
            id="nationality"
            label="Nationality"
            onFieldBlur={markInactive}
            register={register("nationality")}
          />
          <FormField
            error={errors.religion?.message}
            id="religion"
            label="Religion"
            onFieldBlur={markInactive}
            optional
            register={register("religion")}
          />
          <div className="md:col-span-2">
            <FormField
              error={errors.address?.message}
              id="address"
              label="Address"
              onFieldBlur={markInactive}
              register={register("address")}
              textarea
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-panel sm:p-6">
        <h2 className="text-base font-semibold text-zinc-950">Emergency contact</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <FormField
            error={errors.emergencyContact?.name?.message}
            id="emergencyContactName"
            label="Name"
            onFieldBlur={markInactive}
            optional
            register={register("emergencyContact.name")}
          />
          <FormField
            error={errors.emergencyContact?.relationship?.message}
            id="emergencyContactRelationship"
            label="Relationship"
            onFieldBlur={markInactive}
            optional
            register={register("emergencyContact.relationship")}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button disabled={submitted || isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {submitted ? "Submitted" : "Submit intake"}
        </Button>
      </div>
    </form>
  );
}
