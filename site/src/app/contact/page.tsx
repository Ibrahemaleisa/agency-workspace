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

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to us." lead="Questions about pricing, a walkthrough for your team, or help with your workspace — send a message and we’ll reply by email." />
      <Section tone="white" className="pt-14 sm:pt-16">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
          <ContactForm />
          <aside className="space-y-8 text-[0.95rem] lg:border-s lg:border-line lg:ps-12">
            {site.contactEmail && (
              <div>
                <h2 className="font-medium">Email</h2>
                <a href={`mailto:${site.contactEmail}`} className="mt-1 inline-block text-muted underline-offset-4 hover:text-ink hover:underline">
                  {site.contactEmail}
                </a>
              </div>
            )}
            <div>
              <h2 className="font-medium">Want to look around first?</h2>
              <p className="mt-1 leading-relaxed text-muted">
                The{" "}
                <Link href="/demo" className="text-ink underline underline-offset-4">
                  interactive demo
                </Link>{" "}
                walks through a real project, and the live demo lets you sign in as an admin, team member or client.
              </p>
            </div>
            <div>
              <h2 className="font-medium">Already on Operra?</h2>
              <p className="mt-1 leading-relaxed text-muted">
                Your workspace has a built-in guide under Help. For access issues, your agency’s admin can reset passwords
                in Team &amp; Users. To sign in, go to{" "}
                <Link href="/login" className="text-ink underline underline-offset-4">
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
