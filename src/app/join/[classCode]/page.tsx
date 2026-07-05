import { Card } from "@/components/app/Card";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryButton } from "@/components/app/PrimaryButton";

type JoinClassPageProps = {
  params: Promise<{
    classCode: string;
  }>;
};

export default async function JoinClassPage({ params }: JoinClassPageProps) {
  const { classCode } = await params;

  return (
    <main
      dir="rtl"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8"
    >
      <div className="space-y-4">
        <PageHeader
          eyebrow="הצטרפות לכיתה"
          title="קוד כיתה"
          description="עמוד מדומה להצטרפות לכיתה. חיבור אמיתי יתווסף בהמשך."
        />
        <Card
          title={classCode}
          description="זהו קוד הכיתה שהתקבל בקישור."
          action={<PrimaryButton disabled>הצטרפות בקרוב</PrimaryButton>}
        />
      </div>
    </main>
  );
}
