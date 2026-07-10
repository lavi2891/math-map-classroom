import type {
  Announcement,
  AppCard,
  ClassFeedItem,
  ClassMembership,
  ClassSummary,
  HomeworkAssignment,
  Profile,
} from "@/types";

export const mockStudentProfile: Profile = {
  id: "student-1",
  name: "נועה כהן",
};

export const mockTeacherProfile: Profile = {
  id: "teacher-1",
  name: "דניאל לוי",
};

export const mockStudentMemberships: ClassMembership[] = [
  {
    classId: "class-1",
    userId: mockStudentProfile.id,
    role: "student",
    active: true,
  },
];

export const mockTeacherMemberships: ClassMembership[] = [
  {
    classId: "class-1",
    userId: mockTeacherProfile.id,
    role: "owner",
    active: true,
  },
  {
    classId: "class-2",
    userId: mockTeacherProfile.id,
    role: "viewer",
    active: true,
  },
];

export const studentHomeCards: AppCard[] = [
  {
    id: "student-home-1",
    title: "המשימה הבאה",
    description: "תרגול קצר בנושא אחוזים מחכה להשלמה.",
    actionLabel: "התחלת תרגול",
  },
  {
    id: "student-home-2",
    title: "התקדמות השבוע",
    description: "נפתרו 18 שאלות, מתוכן 14 נכונות בניסיון הראשון.",
    actionLabel: "צפייה בסיכום",
  },
  {
    id: "student-home-3",
    title: "נושא לחיזוק",
    description: "כדאי לחזור על מעבר משבר לאחוז.",
    actionLabel: "חזרה מהירה",
  },
];

export const studentClassFeed: ClassFeedItem[] = [
  {
    id: "student-class-1",
    title: "מה לומדים היום",
    description: "הכיתה מתקדמת לבעיות יחס מתוך מצבים יומיומיים.",
    actionLabel: "צפייה בנושא",
  },
  {
    id: "student-class-2",
    title: "עדכון מהמורה",
    description: "להביא מחברת תרגול לשיעור הבא.",
    actionLabel: "סימון כנקרא",
  },
  {
    id: "student-class-3",
    title: "עבודה בזוגות",
    description: "בשיעור הבא נפתור שאלות מילוליות בקבוצות קטנות.",
    actionLabel: "פרטים",
  },
];

export const practiceCards: AppCard[] = [
  {
    id: "practice-1",
    title: "תרגול מותאם",
    description: "10 שאלות קצרות לפי מפת הידע האישית.",
    actionLabel: "התחלה",
  },
  {
    id: "practice-2",
    title: "חזרה על טעויות",
    description: "שאלות דומות לשאלות שהיו קשות בשבוע האחרון.",
    actionLabel: "תרגול חוזר",
  },
];

export const studentProfileCards: AppCard[] = [
  {
    id: "student-profile-1",
    title: "פרטי תלמיד/ה",
    description: "שם, כיתה והעדפות למידה יוצגו כאן בהמשך.",
    actionLabel: "עריכה",
  },
  {
    id: "student-profile-2",
    title: "יעד אישי",
    description: "השלמת שלושה תרגולים קצרים השבוע.",
    actionLabel: "עדכון יעד",
  },
];

export const classSummaries: ClassSummary[] = [
  {
    active: true,
    classCode: "Z7A",
    grade: 7,
    id: "class-1",
    name: "ז2",
    studentCount: 31,
    focus: "יחסים ופרופורציה",
  },
  {
    active: true,
    classCode: "Z7D",
    grade: 7,
    id: "class-2",
    name: "ז4",
    studentCount: 29,
    focus: "משוואות בסיסיות",
  },
  {
    active: true,
    classCode: "H8A",
    grade: 8,
    id: "class-3",
    name: "ח1",
    studentCount: 27,
    focus: "פונקציות",
  },
];

export const homeworkAssignments = [
  {
    id: "homework-1",
    title: "תרגול שברים",
    dueDate: "מחר",
    completedCount: 18,
    totalCount: 31,
  },
  {
    id: "homework-2",
    title: "בעיות יחס",
    dueDate: "יום חמישי",
    completedCount: 12,
    totalCount: 29,
  },
] as unknown as HomeworkAssignment[];

export const announcements: Announcement[] = [
  {
    id: "announcement-1",
    classId: "class-1",
    className: "ז2",
    category: "exam",
    isHidden: false,
    isPinned: true,
    links: [],
    requireReadConfirmation: true,
    visibleFrom: new Date().toISOString(),
    title: "בוחן קצר",
    body: "ביום רביעי נתרגל שאלות חזרה לפני הבוחן.",
    audience: "כיתה ז2",
  },
  {
    id: "announcement-2",
    classId: "class-1",
    className: "ז2",
    category: "material",
    isHidden: false,
    isPinned: false,
    links: [],
    requireReadConfirmation: false,
    visibleFrom: new Date().toISOString(),
    title: "חומרי עזר",
    body: "דף נוסחאות חדש יעלה בהמשך השבוע.",
    audience: "כל הכיתות",
  },
];

export const knowledgeSkills = [
  { id: "skill-1", title: "חיבור שברים", status: "strong", progress: 86 },
  { id: "skill-2", title: "אחוזים", status: "practice", progress: 58 },
  { id: "skill-3", title: "משוואות", status: "new", progress: 24 },
];

export const knowledgeDomains = [
  {
    id: "domain-1",
    title: "מספרים ופעולות",
    description: "שליטה בשברים, אחוזים וחישובים בסיסיים.",
    skills: knowledgeSkills.slice(0, 2),
  },
  {
    id: "domain-2",
    title: "אלגברה",
    description: "ביטויים ומשוואות ראשונות.",
    skills: knowledgeSkills.slice(2),
  },
];

export const teacherStatusCards: AppCard[] = [
  {
    id: "teacher-status-1",
    title: "תמונת מצב כיתתית",
    description: "7 תלמידים צריכים חיזוק בנושא אחוזים.",
    actionLabel: "צפייה בפירוט",
  },
  {
    id: "teacher-status-2",
    title: "התקדמות שבועית",
    description: "רוב הכיתה השלימה את תרגול היחסים.",
    actionLabel: "פתיחת סיכום",
  },
];

export const teacherProfileCards: AppCard[] = [
  {
    id: "teacher-profile-1",
    title: "פרטי מורה",
    description: "שם, כיתות פעילות והעדפות מערכת.",
    actionLabel: "עריכה",
  },
  {
    id: "teacher-profile-2",
    title: "הגדרות תצוגה",
    description: "בחירת כיתת ברירת מחדל וסדר נושאים.",
    actionLabel: "הגדרות",
  },
];
