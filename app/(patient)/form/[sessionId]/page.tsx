import { notFound } from "next/navigation";
import { PatientForm } from "../../../../components/form/PatientForm";
import { sessionIdSchema } from "../../../../lib/schema";

type PatientFormPageProps = {
  params: {
    sessionId: string;
  };
};

export default function PatientFormPage({ params }: PatientFormPageProps) {
  const parsedSessionId = sessionIdSchema.safeParse(params.sessionId);

  if (!parsedSessionId.success) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PatientForm sessionId={parsedSessionId.data} />
      </div>
    </main>
  );
}
