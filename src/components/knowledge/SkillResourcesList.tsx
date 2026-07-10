import type { SkillResource, SkillResourceType } from "@/types";

type SkillResourcesListProps = {
  resources: SkillResource[];
};

const resourceTypeLabels: Record<SkillResourceType, string> = {
  practice: "תרגול",
  video: "סרטון",
  worksheet: "דף עבודה",
  explanation: "הסבר",
  geogebra: "GeoGebra",
  form: "טופס",
  other: "קישור",
};

export function SkillResourcesList({ resources }: SkillResourcesListProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {resources.map((resource) => (
        <a
          className="max-w-full truncate rounded-full border border-teal-100 bg-white px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
          href={resource.url}
          key={resource.id}
          rel="noreferrer"
          target="_blank"
        >
          {resourceTypeLabels[resource.resourceType]} · {resource.title}
        </a>
      ))}
    </div>
  );
}
