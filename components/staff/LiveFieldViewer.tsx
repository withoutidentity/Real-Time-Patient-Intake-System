import type { FieldStatus, PatientData } from "@/lib/schema";

const fields: Array<{ label: string; value: (data: Partial<PatientData>) => string | undefined }> = [
  { label: "First name", value: (data) => data.firstName },
  { label: "Middle name", value: (data) => data.middleName },
  { label: "Last name", value: (data) => data.lastName },
  { label: "Date of birth", value: (data) => data.dateOfBirth },
  { label: "Gender", value: (data) => data.gender },
  { label: "Phone", value: (data) => data.phoneNumber },
  { label: "Email", value: (data) => data.email },
  { label: "Language", value: (data) => data.preferredLanguage },
  { label: "Nationality", value: (data) => data.nationality },
  { label: "Emergency contact", value: (data) => data.emergencyContact?.name },
  { label: "Relationship", value: (data) => data.emergencyContact?.relationship },
  { label: "Religion", value: (data) => data.religion },
  { label: "Address", value: (data) => data.address }
];

type LiveFieldViewerProps = {
  data: Partial<PatientData>;
  status: FieldStatus;
};

export function LiveFieldViewer({ data, status }: LiveFieldViewerProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const value = field.value(data);
        const displayValue = value?.trim();

        return (
          <div className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 p-3" key={field.label}>
            <dt className="text-xs font-semibold uppercase text-zinc-500">{field.label}</dt>
            <dd className="mt-1 min-h-5 break-words text-sm text-zinc-950">
              {displayValue ? (
                displayValue
              ) : status === "submitted" ? (
                <span className="text-zinc-500">-</span>
              ) : (
                <span className="text-zinc-400">Waiting...</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
