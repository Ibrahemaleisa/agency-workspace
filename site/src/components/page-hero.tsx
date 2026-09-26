import type { ReactNode } from "react";
import { Container, SectionHeader } from "./section";

/** Standard opening for inner pages. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className="border-b border-line bg-paper pt-16 pb-16 sm:pt-24 sm:pb-20">
      <Container>
        <SectionHeader as="h1" eyebrow={eyebrow} title={title} lead={lead} align={align} className="max-w-3xl" />
        {children && <div className="mt-10">{children}</div>}
      </Container>
    </div>
  );
}
