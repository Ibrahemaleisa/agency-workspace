import type { ReactNode } from "react";
import { Container, SectionHeader } from "./section";

/** Standard opening for inner pages. */
export function PageHero({
  marker,
  title,
  lead,
  children,
  align = "left",
}: {
  marker: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className="bg-paper pt-14 pb-14 sm:pt-20 sm:pb-16">
      <Container>
        <SectionHeader as="h1" marker={marker} title={title} lead={lead} align={align} className="max-w-3xl" />
        {children && <div className="mt-10">{children}</div>}
      </Container>
    </div>
  );
}
