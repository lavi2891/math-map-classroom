"use client";

import { useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { Card } from "@/components/app/Card";
import { HomeworkCard } from "@/components/homework/HomeworkCard";
import {
  createHomeworkAction,
  updateHomeworkAction,
} from "@/app/teacher/homework/actions";
import type { ClassSummary, HomeworkAssignment } from "@/types";
import { HomeworkForm } from "./HomeworkForm";

type TeacherHomeworkPanelProps = {
  assignments: HomeworkAssignment[];
  classes: ClassSummary[];
};

export function TeacherHomeworkPanel({
  assignments,
  classes,
}: TeacherHomeworkPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(
    null,
  );

  if (classes.length === 0) {
    return (
      <EmptyState
        title="אין כיתות לניהול"
        description="רק בעלים ומורים של כיתה יכולים לנהל שיעורי בית."
      />
    );
  }

  return (
    <div className="grid gap-4" dir="rtl">
      <button
        className="min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800 sm:w-fit"
        onClick={() => {
          setEditingAssignmentId(null);
          setIsCreateOpen((current) => !current);
        }}
        type="button"
      >
        + שיעורי בית חדשים
      </button>

      {isCreateOpen ? (
        <Card title="שיעורי בית חדשים">
          <HomeworkForm
            action={createHomeworkAction}
            classes={classes}
            onCancel={() => setIsCreateOpen(false)}
          />
        </Card>
      ) : null}

      <div className="grid gap-3">
        {assignments.length > 0 ? (
          assignments.map((assignment) => {
            const isEditing = editingAssignmentId === assignment.id;

            return (
              <div className="grid gap-3" key={assignment.id}>
                {isEditing ? (
                  <Card title="עריכת שיעורי בית">
                    <HomeworkForm
                      action={updateHomeworkAction}
                      assignment={assignment}
                      classes={classes}
                      onCancel={() => setEditingAssignmentId(null)}
                    />
                  </Card>
                ) : (
                  <div className="grid gap-2">
                    <HomeworkCard assignment={assignment} />
                    <button
                      className="min-h-10 rounded-md border border-stone-200 px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50 sm:w-fit"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setEditingAssignmentId(assignment.id);
                      }}
                      type="button"
                    >
                      עריכה
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
            title="עדיין אין שיעורי בית."
            description="שיעורי בית לכיתות שבהן יש לך הרשאת ניהול יופיעו כאן."
          />
        )}
      </div>
    </div>
  );
}
