// Title band used at the top of inner pages.
export default function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="container-page py-14 sm:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-body">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
