import type { ReactNode } from "react";

type CardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function Card({ title, description, action, children }: CardProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
