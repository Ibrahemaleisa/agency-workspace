import Link from "next/link";
import { ContactForm } from "@/components/inquiry-forms";
import { PageHero } from "@/components/page-hero";
import { Container, Section } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Talk to the Operra team about pricing, a walkthrough, or your existing workspace.",
  path: "/contact",
});

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";
const link = "text-ink underline underline-offset-4";

export default function ContactPage() {
  return (
    <>
      <PageHero
        marker="Contact"
        title="Talk to us"
        lead="Pricing, a walkthrough for your team, or help with your workspace. Send a message and we’ll reply by email."
      />
      <Section tone="surface" className="pt-12 sm:pt-14">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
          <ContactForm />
          <aside className="space-y-8 text-[15px] leading-[22px] lg:border-s lg:border-line lg:ps-12">
            {site.contactEmail && (
              <div>
                <h2 className={`text-muted ${label}`}>Email</h2>
                <a href={`mailto:${site.contactEmail}`} className={`mt-2 inline-block ${link}`}>
                  {site.contactEmail}
                </a>
              </div>
            )}
            <div>
              <h2 className={`text-muted ${label}`}>Looking around first</h2>
              <p className="mt-2 text-muted">
                The{" "}
                <Link href="/demo" className={link}>
                  interactive demo
                </Link>{" "}
                walks through a real project. The live demo lets you sign in as an admin, team member or client.
              </p>
            </div>
            <div>
              <h2 className={`text-muted ${label}`}>Already on Operra</h2>
              <p className="mt-2 text-muted">
                Your workspace has a built-in guide under Help. Your admin can reset passwords in Team &amp; Users. To sign in,
                go to{" "}
                <Link href="/login" className={link}>
                  your workspace
                </Link>
                .
              </p>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
