import { PrimaryButton } from "@/components/app/PrimaryButton";

export function SelfAssessmentButtons() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <PrimaryButton className="bg-stone-700 hover:bg-stone-800">קשה</PrimaryButton>
      <PrimaryButton className="bg-teal-700 hover:bg-teal-800">בסדר</PrimaryButton>
      <PrimaryButton className="bg-emerald-700 hover:bg-emerald-800">קל</PrimaryButton>
    </div>
  );
}
