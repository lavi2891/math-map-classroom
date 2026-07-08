"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getHomeworkTagSuggestionsAction } from "@/app/teacher/homework/actions";
import type { HomeworkTag, HomeworkTagInput, HomeworkTagSuggestion } from "@/types";

type HomeworkTagInputProps = {
  classId?: string;
  initialTags?: HomeworkTag[];
  onTagsChange?: (tags: HomeworkTagInput[]) => void;
};

function normalizeTagLabel(label: string) {
  return label
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "_");
}

function getDisplayTagLabel(label: string) {
  return label.trim().replace(/^#+/, "").replace(/\s+/g, " ").trim();
}

export function HomeworkTagInput({
  classId,
  initialTags = [],
  onTagsChange,
}: HomeworkTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<HomeworkTagInput[]>(
    initialTags.map((tag) => ({
      knowledgeSkillId: tag.knowledgeSkillId,
      label: tag.label,
    })),
  );
  const [suggestions, setSuggestions] = useState<HomeworkTagSuggestion[]>([]);
  const [isPending, startTransition] = useTransition();
  const hiddenValue = useMemo(
    () => JSON.stringify(selectedTags),
    [selectedTags],
  );
  const normalizedInput = normalizeTagLabel(inputValue);
  const showSuggestions = Boolean(
    inputValue.trim().startsWith("#") && normalizedInput,
  );
  const visibleSuggestions = showSuggestions ? suggestions : [];

  function setTags(tags: HomeworkTagInput[]) {
    setSelectedTags(tags);
    onTagsChange?.(tags);
  }

  function addTag(tag: HomeworkTagInput) {
    const label = getDisplayTagLabel(tag.label);
    const normalizedLabel = normalizeTagLabel(label);

    if (!label || selectedTags.some((item) => normalizeTagLabel(item.label) === normalizedLabel)) {
      setInputValue("");
      setSuggestions([]);
      return;
    }

    setTags([
      ...selectedTags,
      {
        knowledgeSkillId: tag.knowledgeSkillId,
        label,
      },
    ]);
    setInputValue("");
    setSuggestions([]);
  }

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    startTransition(async () => {
      const result = await getHomeworkTagSuggestionsAction(inputValue, classId);
      setSuggestions(result);
    });
  }, [classId, inputValue, showSuggestions]);

  return (
    <div className="grid min-w-0 gap-2 text-sm font-semibold text-stone-700">
      <input name="tags" type="hidden" value={hiddenValue} />
      <span>תגיות</span>
      {selectedTags.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button
              className="max-w-full truncate rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-800"
              key={normalizeTagLabel(tag.label)}
              onClick={() =>
                setTags(
                  selectedTags.filter(
                    (item) =>
                      normalizeTagLabel(item.label) !== normalizeTagLabel(tag.label),
                  ),
                )
              }
              title={`#${tag.label}`}
              type="button"
            >
              #{tag.label} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <input
          className="box-border min-h-11 w-full min-w-0 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            addTag(suggestions[0] ?? { label: inputValue });
          }}
          placeholder="#חוקיות, #הצבה, #חזרה"
          type="text"
          value={inputValue}
        />
        {showSuggestions && (visibleSuggestions.length > 0 || !isPending) ? (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-stone-200 bg-white p-1 shadow-lg">
            {visibleSuggestions.map((suggestion) => (
              <button
                className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded px-2 text-right text-sm font-semibold text-stone-700 hover:bg-stone-50"
                key={`${suggestion.source}-${suggestion.id ?? suggestion.knowledgeSkillId ?? suggestion.label}`}
                onClick={() => addTag(suggestion)}
                type="button"
              >
                <span className="min-w-0 truncate">#{suggestion.label}</span>
                {suggestion.source === "skill" ? (
                  <span className="shrink-0 text-xs text-stone-500">מיומנות</span>
                ) : null}
              </button>
            ))}
            {visibleSuggestions.length === 0 ? (
              <button
                className="min-h-10 w-full rounded px-2 text-right text-sm font-semibold text-teal-700 hover:bg-stone-50"
                onClick={() => addTag({ label: inputValue })}
                type="button"
              >
                הוסף תגית
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
