type HomeSectionProps = {
  id?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function HomeSection({
  id,
  title,
  description,
  children,
  className = "",
}: HomeSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 ${className}`}
    >
      <header className="mb-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}
