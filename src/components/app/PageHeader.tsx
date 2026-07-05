type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header>
      {eyebrow ? (
        <p className="text-sm font-semibold text-teal-700">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-2xl font-bold text-stone-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
    </header>
  );
}
