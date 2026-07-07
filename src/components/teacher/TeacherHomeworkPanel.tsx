"use client";

import { useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { Card } from "@/components/app/Card";
import { HomeworkCard } from "@/components/homework/HomeworkCard";
import { TeacherCardActions } from "@/components/teacher/TeacherCardActions";
import {
  createHomeworkAction,
  deleteHomeworkAction,
  hideHomeworkAction,
  unhideHomeworkAction,
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
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(
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
                  <div className="relative">
                    <TeacherCardActions
                      hidden={assignment.isHidden}
                      hideAction={hideHomeworkAction}
                      idFieldName="homeworkId"
                      idValue={assignment.id}
                      onDeleteRequest={() => setDeleteAssignmentId(assignment.id)}
                      onEdit={() => {
                        setIsCreateOpen(false);
                        setEditingAssignmentId(assignment.id);
                      }}
                      unhideAction={unhideHomeworkAction}
                    />
                    <HomeworkCard assignment={assignment} className="pt-16" />
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

      <DeleteHomeworkDialog
        assignmentId={deleteAssignmentId}
        onClose={() => setDeleteAssignmentId(null)}
      />
    </div>
  );
}

type DeleteHomeworkDialogProps = {
  assignmentId: string | null;
  onClose: () => void;
};

function DeleteHomeworkDialog({
  assignmentId,
  onClose,
}: DeleteHomeworkDialogProps) {
  if (!assignmentId) {
    return null;
  }

  return (
    <div
      aria-labelledby="delete-homework-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 p-4"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
        <h2
          className="text-lg font-bold text-stone-950"
          id="delete-homework-title"
        >
          למחוק את שיעורי הבית?
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          המשימה תוסר מהכיתה והתלמידים לא יוכלו לראות אותה. לא ניתן לשחזר אותה
          מהממשק כרגע.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="min-h-11 rounded-md border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            onClick={onClose}
            type="button"
          >
            ביטול
          </button>
          <form action={deleteHomeworkAction}>
            <input name="homeworkId" type="hidden" value={assignmentId} />
            <button
              className="min-h-11 w-full rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
              onClick={onClose}
              type="submit"
            >
              מחק
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
