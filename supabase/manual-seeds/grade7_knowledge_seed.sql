-- =========================================================
-- Grade 7 knowledge map seed - first period
-- Run manually after migrations.
-- =========================================================

insert into public.knowledge_domains (grade, title, description, sort_order)
values
  (7, 'מספרים ופעולות', 'ידע קודם וחישובים הנדרשים לתחילת כיתה ז.', 10),
  (7, 'אלגברה ראשונית', 'ביטויים, הצבה ומשוואות ראשונות.', 20),
  (7, 'אוריינות מתמטית', 'מיומנויות תומכות לפתרון בעיות וכתיבה מתמטית.', 30),
  (7, 'העשרה', 'נושאי הרחבה לתלמידים מוכנים.', 90)
on conflict (grade, title) do update
set
  description = excluded.description,
  sort_order = excluded.sort_order;

with domains as (
  select id, title
  from public.knowledge_domains
  where grade = 7
)
insert into public.knowledge_skills (
  domain_id,
  title,
  description,
  source_level,
  skill_type,
  sort_order,
  active
)
select d.id, s.title, s.description, 'grade7'::public.skill_source_level, s.skill_type, s.sort_order, true
from (
  values
    ('מספרים ופעולות', 'ארבע פעולות במספרים טבעיים', 'חזרה על סדר פעולות וחישוב מדויק.', 'prerequisite', 10),
    ('מספרים ופעולות', 'שברים פשוטים', 'צמצום, הרחבה והשוואת שברים.', 'prerequisite', 20),
    ('מספרים ופעולות', 'שברים עשרוניים', 'קריאה, כתיבה והשוואה של מספרים עשרוניים.', 'prerequisite', 30),
    ('מספרים ופעולות', 'קריאת טבלאות', 'איסוף נתונים מטבלה פשוטה.', 'prerequisite', 40),
    ('אלגברה ראשונית', 'הצבה בביטוי אלגברי', 'חישוב ערך ביטוי עבור ערכים נתונים.', 'curriculum', 10),
    ('אלגברה ראשונית', 'חוקיות וביטויים', 'זיהוי חוקיות וכתיבת ביטוי מתאים.', 'curriculum', 20),
    ('אלגברה ראשונית', 'משוואות חד-שלביות', 'פתרון משוואות פשוטות ובדיקת פתרון.', 'curriculum', 30),
    ('אוריינות מתמטית', 'קריאת בעיה מילולית', 'זיהוי הנתונים והשאלה בבעיה.', 'support', 10),
    ('אוריינות מתמטית', 'כתיבה מתמטית מסודרת', 'הצגת דרך פתרון עם יחידות ותשובה מילולית.', 'support', 20),
    ('אוריינות מתמטית', 'בדיקת תשובה', 'הצבה חוזרת, אומדן ובדיקת סבירות.', 'support', 30),
    ('אוריינות מתמטית', 'שימוש במחשבון', 'שימוש מבוקר במחשבון ובדיקת הקלדה.', 'support', 40),
    ('העשרה', 'פירוק לגורמים ראשוני', 'הרחבה לתלמידים מוכנים לקראת אלגברה מתקדמת.', 'enrichment', 10)
) as s(domain_title, title, description, skill_type, sort_order)
join domains d on d.title = s.domain_title
where not exists (
  select 1
  from public.knowledge_skills existing
  where existing.domain_id = d.id
    and existing.title = s.title
);

with skills as (
  select ks.id, ks.title
  from public.knowledge_skills ks
  join public.knowledge_domains kd on kd.id = ks.domain_id
  where kd.grade = 7
)
insert into public.skill_resources (skill_id, resource_type, title, url, sort_order)
select skills.id, resources.resource_type, resources.title, resources.url, resources.sort_order
from (
  values
    ('הצבה בביטוי אלגברי', 'explanation', 'הסבר קצר על הצבה', 'https://example.com/grade7/substitution', 10),
    ('משוואות חד-שלביות', 'practice', 'תרגול משוואות חד-שלביות', 'https://example.com/grade7/one-step-equations', 10),
    ('קריאת בעיה מילולית', 'worksheet', 'דף עבודה לניתוח בעיות', 'https://example.com/grade7/word-problems', 10)
) as resources(skill_title, resource_type, title, url, sort_order)
join skills on skills.title = resources.skill_title
where not exists (
  select 1
  from public.skill_resources existing
  where existing.skill_id = skills.id
    and existing.title = resources.title
);
