import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { addDays, format, subHours, subMinutes } from "date-fns";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import * as s from "./schema";
import { DEFAULT_TEMPLATES } from "../lib/default-templates";
import { addModuleToProject } from "../lib/modules";
import { saveFile } from "../lib/uploads";
import { nt } from "../lib/notify-text";
import type { Localized } from "../lib/events";

const DEMO_SLUG = "northwind";
const today = new Date();
const d = (offset: number) => format(addDays(today, offset), "yyyy-MM-dd");

async function main() {
  // `--if-empty` (used by the Vercel build) only seeds a brand-new database, never resets one.
  const orgs = await db.select({ slug: s.organizations.slug }).from(s.organizations);
  if (process.argv.includes("--if-empty") && orgs.length > 0) {
    console.log("Database already has data — skipping seed.");
    return;
  }
  // Safety net: only an empty database or an earlier demo ("northwind") may be wiped.
  // A customer's workspace is refused unless ALLOW_DB_RESET=true is set explicitly.
  const customer = orgs.find((o) => o.slug !== DEMO_SLUG);
  if (customer && process.env.ALLOW_DB_RESET !== "true") {
    console.error(
      `Refusing to reset: this database belongs to a real workspace ("${customer.slug}").\n` +
        "The demo seed deletes everything. If you really mean it, re-run with ALLOW_DB_RESET=true.",
    );
    process.exit(1);
  }
  console.log("Resetting database…");
  await db.execute(sql`TRUNCATE organizations, sessions, file_blobs RESTART IDENTITY CASCADE`);

  const [org] = await db.insert(s.organizations).values({ name: "Northwind Studio", nameAr: "نورثويند", slug: DEMO_SLUG, showcaseClients: ["Bloom Café", "Atlas Fitness", "Verde Real Estate", "Nimbus Tech"], contactEmail: "hello@northwind.agency" }).returning();
  const passwordHash = await bcrypt.hash("password", 10);

  /* ---------------- Staff ---------------- */
  const staffData = [
    { key: "sara", name: "Sara Haddad", email: "sara@northwind.agency", role: "admin", title: "Managing Director" },
    { key: "karim", name: "Karim Nasser", email: "karim@northwind.agency", role: "admin", title: "Operations Manager" },
    { key: "omar", name: "Omar Khalil", email: "omar@northwind.agency", role: "employee", title: "Content Lead" },
    { key: "maya", name: "Maya Rahman", email: "maya@northwind.agency", role: "employee", title: "Senior Designer" },
    { key: "yusuf", name: "Yusuf Ali", email: "yusuf@northwind.agency", role: "employee", title: "Video Producer" },
    { key: "nour", name: "Nour Saleh", email: "nour@northwind.agency", role: "employee", title: "Paid Media Specialist" },
    { key: "adam", name: "Adam Brooks", email: "adam@northwind.agency", role: "employee", title: "Account Manager" },
    { key: "leila", name: "Leila Farouk", email: "leila@northwind.agency", role: "employee", title: "Copywriter" },
  ] as const;
  const staffRows = await db
    .insert(s.users)
    .values(staffData.map((u) => ({ name: u.name, email: u.email, role: u.role, title: u.title, orgId: org.id, passwordHash, emailNotifications: false })))
    .returning();
  const U = Object.fromEntries(staffData.map((u, i) => [u.key, staffRows[i]])) as Record<
    (typeof staffData)[number]["key"],
    s.User
  >;

  /* ---------------- Clients ---------------- */
  const clientData = [
    { key: "bloom", name: "Bloom Café", industry: "Food & Beverage", contactName: "Lina Mansour", contactEmail: "lina@bloomcafe.com", phone: "+1 415 555 0142", website: "https://bloomcafe.com", notes: "Prefers WhatsApp for quick approvals. Budget-conscious; always show options." },
    { key: "atlas", name: "Atlas Fitness", industry: "Health & Fitness", contactName: "Daniel Price", contactEmail: "daniel@atlasfitness.com", phone: "+1 312 555 0199", website: "https://atlasfitness.com", notes: "Fast-moving; approvals typically within 24h." },
    { key: "verde", name: "Verde Real Estate", industry: "Real Estate", contactName: "Rana Aziz", contactEmail: "rana@verde-re.com", phone: "+1 646 555 0107", website: "https://verde-re.com", notes: "Legal must review all ad copy before launch." },
    { key: "nimbus", name: "Nimbus Tech", industry: "SaaS", contactName: "Priya Shah", contactEmail: "priya@nimbus.io", phone: null, website: "https://nimbus.io", notes: null },
    { key: "orchid", name: "Orchid Skincare", industry: "Beauty", contactName: "Emma Laurent", contactEmail: "emma@orchidskin.co", phone: null, website: "https://orchidskin.co", notes: null },
  ] as const;
  const clientRows = await db
    .insert(s.clients)
    .values(clientData.map((c) => ({
        orgId: org.id,
        name: c.name,
        industry: c.industry,
        contactName: c.contactName,
        contactEmail: c.contactEmail,
        phone: c.phone,
        website: c.website,
        notes: c.notes,
      })),
    )
    .returning();
  const C = Object.fromEntries(clientData.map((c, i) => [c.key, clientRows[i]])) as Record<
    (typeof clientData)[number]["key"],
    s.Client
  >;

  await db.insert(s.clientTeam).values([
    { clientId: C.bloom.id, userId: U.adam.id },
    { clientId: C.bloom.id, userId: U.omar.id },
    { clientId: C.bloom.id, userId: U.maya.id },
    { clientId: C.atlas.id, userId: U.adam.id },
    { clientId: C.atlas.id, userId: U.nour.id },
    { clientId: C.verde.id, userId: U.karim.id },
    { clientId: C.verde.id, userId: U.yusuf.id },
    { clientId: C.nimbus.id, userId: U.nour.id },
    { clientId: C.orchid.id, userId: U.maya.id },
  ]);

  /* ---------------- Client portal users ---------------- */
  const [lina, daniel, rana] = await db
    .insert(s.users)
    .values([
      { orgId: org.id, name: "Lina Mansour", email: "lina@bloomcafe.com", role: "client", title: "Marketing Manager", clientId: C.bloom.id, passwordHash, emailNotifications: false },
      { orgId: org.id, name: "Daniel Price", email: "daniel@atlasfitness.com", role: "client", title: "Founder", clientId: C.atlas.id, passwordHash, emailNotifications: false },
      { orgId: org.id, name: "Rana Aziz", email: "rana@verde-re.com", role: "client", title: "Head of Sales", clientId: C.verde.id, passwordHash, emailNotifications: false },
    ])
    .returning();

  /* ---------------- Templates ---------------- */
  const templateRows = await db
    .insert(s.moduleTemplates)
    .values(DEFAULT_TEMPLATES.map((t) => ({ ...t, orgId: org.id })))
    .returning();
  const T = Object.fromEntries(templateRows.map((t) => [t.name, t])) as Record<string, s.ModuleTemplate>;

  /* ---------------- Projects ---------------- */
  // For each module: how far along the workflow is (index of current stage), and who owns which work.
  type ModulePlan = {
    template: string;
    currentStage: number; // stages before are completed; >= stages.length means all done
    currentStatus?: s.TaskStatus;
    fieldValues?: Record<string, string>;
    owners: s.User[]; // cycled through stages
  };
  type ProjectPlan = {
    client: s.Client;
    name: string;
    description: string;
    status: s.ProjectStatus;
    start: number;
    end: number;
    owner: s.User;
    members: s.User[];
    modules: ModulePlan[];
  };

  const plans: ProjectPlan[] = [
    {
      client: C.bloom,
      name: "Autumn Menu Launch",
      description: "Launch campaign for the new autumn seasonal menu across Instagram, TikTok and in-store.",
      status: "active",
      start: -24,
      end: 21,
      owner: U.adam,
      members: [U.omar, U.maya, U.yusuf, U.nour, U.leila],
      modules: [
        { template: "Content", currentStage: 4, fieldValues: { channels: "Instagram, TikTok", postsPerMonth: "16", pillars: "Seasonal flavors, behind the counter, community", brandGuidelines: "https://bloomcafe.com/brand" }, owners: [U.omar, U.leila, U.maya, U.omar] },
        { template: "Production", currentStage: 3, currentStatus: "in_progress", fieldValues: { deliverableType: "Video + Photo", deliverableCount: "12", shootDate: d(-6), location: "Bloom Café – Mission St flagship" }, owners: [U.yusuf, U.yusuf, U.yusuf, U.maya] },
        { template: "Paid Media", currentStage: 1, currentStatus: "in_progress", fieldValues: { platforms: "Meta, TikTok", monthlyBudget: "4500", objective: "Traffic", kpi: "CPC < $0.60" }, owners: [U.nour] },
      ],
    },
    {
      client: C.atlas,
      name: "New Year Membership Campaign",
      description: "Drive January sign-ups with a pre-sale offer. Paid social + hero video.",
      status: "active",
      start: -14,
      end: 60,
      owner: U.adam,
      members: [U.nour, U.yusuf, U.leila, U.maya],
      modules: [
        { template: "Paid Media", currentStage: 3, fieldValues: { platforms: "Meta, Google Search", monthlyBudget: "12000", objective: "Leads", kpi: "CPL < $18" }, owners: [U.nour] },
        { template: "Production", currentStage: 1, currentStatus: "review", fieldValues: { deliverableType: "Video", deliverableCount: "3", shootDate: d(9), location: "Atlas Downtown gym" }, owners: [U.yusuf] },
        { template: "Content", currentStage: 1, currentStatus: "in_progress", owners: [U.leila, U.leila, U.maya] },
      ],
    },
    {
      client: C.verde,
      name: "Riverside Towers Launch",
      description: "Off-plan launch of Riverside Towers: drone film, brochure content and weekly client reporting.",
      status: "active",
      start: -30,
      end: 30,
      owner: U.karim,
      members: [U.yusuf, U.omar, U.maya, U.adam],
      modules: [
        { template: "Production", currentStage: 5, fieldValues: { deliverableType: "Video + Photo", deliverableCount: "6", shootDate: d(-12), location: "Riverside Towers site" }, owners: [U.yusuf] },
        { template: "Content", currentStage: 2, currentStatus: "in_progress", owners: [U.omar, U.omar, U.maya] },
        { template: "Account Management", currentStage: 3, currentStatus: "in_progress", fieldValues: { cadence: "Weekly", primaryContact: "Rana Aziz", reportingDay: "Monday", renewalDate: d(75) }, owners: [U.adam] },
      ],
    },
    {
      client: C.atlas,
      name: "Always-on Social",
      description: "Monthly organic social retainer.",
      status: "active",
      start: -60,
      end: 120,
      owner: U.omar,
      members: [U.leila, U.maya, U.adam],
      modules: [
        { template: "Content", currentStage: 3, currentStatus: "review", fieldValues: { channels: "Instagram", postsPerMonth: "12" }, owners: [U.leila, U.leila, U.maya, U.omar] },
        { template: "Account Management", currentStage: 4, currentStatus: "todo", fieldValues: { cadence: "Monthly", primaryContact: "Daniel Price" }, owners: [U.adam] },
      ],
    },
    {
      client: C.nimbus,
      name: "Product Hunt Launch",
      description: "Launch content and paid amplification. On hold pending the client's product release date.",
      status: "on_hold",
      start: -10,
      end: 40,
      owner: U.nour,
      members: [U.leila, U.nour],
      modules: [
        { template: "Content", currentStage: 1, currentStatus: "todo", owners: [U.leila] },
        { template: "Paid Media", currentStage: 0, currentStatus: "todo", owners: [U.nour] },
      ],
    },
    {
      client: C.bloom,
      name: "October Retainer",
      description: "Monthly content + account management for October.",
      status: "planning",
      start: 8,
      end: 38,
      owner: U.adam,
      members: [U.omar, U.leila],
      modules: [
        { template: "Content", currentStage: 0, currentStatus: "todo", owners: [U.omar, U.leila] },
        { template: "Account Management", currentStage: 0, currentStatus: "todo", owners: [U.adam] },
      ],
    },
    {
      client: C.orchid,
      name: "Brand Refresh",
      description: "Visual identity refresh and launch content.",
      status: "completed",
      start: -120,
      end: -35,
      owner: U.maya,
      members: [U.maya, U.omar],
      modules: [
        { template: "Content", currentStage: 99, owners: [U.omar, U.maya] },
        { template: "Production", currentStage: 99, owners: [U.yusuf] },
      ],
    },
  ];

  const stageDescriptions: Record<string, string> = {
    Brief: "Collect objectives, audience, key messages and mandatories from the client. Confirm scope and timeline.",
    Writing: "Draft copy and captions per the approved content calendar.",
    Design: "Produce static and carousel designs following brand guidelines.",
    "Internal Review": "Team lead reviews for quality, tone and brand consistency before sending to the client.",
    "Client Review": "Share the batch with the client and collect approval or change requests.",
    "Client Approval": "Share final cuts with the client for sign-off.",
    Planning: "Shot list, call sheet, location scout and talent booking.",
    Production: "Shoot day(s).",
    Editing: "Edit, color grade, sound and captions.",
    Strategy: "Audience, budget split, channel mix and KPI targets.",
    "Campaign Setup": "Build campaigns, ad sets, tracking and creatives in ad manager.",
    Live: "Campaign running; monitor daily.",
    Optimization: "Weekly bid/budget/creative optimization.",
    Reporting: "Performance report with insights and next steps.",
  };

  const projectIds: Record<string, string> = {};
  const allCreatedTasks: { id: string; projectId: string; title: string; status: s.TaskStatus; assigneeId: string | null; clientVisible: boolean }[] = [];

  for (const plan of plans) {
    const [project] = await db
      .insert(s.projects)
      .values({
        orgId: org.id,
        clientId: plan.client.id,
        name: plan.name,
        description: plan.description,
        status: plan.status,
        startDate: d(plan.start),
        endDate: d(plan.end),
        ownerId: plan.owner.id,
        createdAt: addDays(today, plan.start - 3),
      })
      .returning();
    projectIds[plan.name] = project.id;
    await db.insert(s.projectMembers).values(plan.members.map((m) => ({ projectId: project.id, userId: m.id })));

    for (const mp of plan.modules) {
      const template = T[mp.template];
      const { taskIds } = await addModuleToProject(db, {
        orgId: org.id,
        projectId: project.id,
        template,
        createdById: plan.owner.id,
        fieldValues: mp.fieldValues,
      });
      const n = template.stages.length;
      const span = plan.end - plan.start;
      for (let i = 0; i < n; i++) {
        const stage = template.stages[i];
        const due = plan.start + Math.round(((i + 1) / n) * span);
        let status: s.TaskStatus = "todo";
        let approvalStatus: "none" | "pending" | "approved" | "rejected" = "none";
        if (i < mp.currentStage) {
          status = "completed";
          if (stage.clientApproval) approvalStatus = "approved";
        } else if (i === mp.currentStage) {
          status = mp.currentStatus ?? (stage.clientApproval ? "waiting_client" : "in_progress");
          if (status === "waiting_client" && stage.clientApproval) approvalStatus = "pending";
        }
        const assignee = mp.owners[i % mp.owners.length];
        const isDeliverable = ["Published", "Delivered", "Live", "Reporting", "Monthly Report"].includes(stage.name);
        const clientVisible = !!stage.clientApproval || isDeliverable;
        const title = `${template.name}: ${stage.name}`;
        await db
          .update(s.tasks)
          .set({
            status,
            approvalStatus,
            assigneeId: assignee.id,
            dueDate: d(due),
            priority: i === mp.currentStage && due < 0 ? "high" : "medium",
            description: stageDescriptions[stage.name] ?? null,
            clientVisible,
            completedAt: status === "completed" ? addDays(today, Math.min(due, -1)) : null,
            createdAt: addDays(today, plan.start),
            updatedAt: status === "todo" ? addDays(today, plan.start) : subHours(today, (i + 1) * 5),
          })
          .where(eq(s.tasks.id, taskIds[i]));
        allCreatedTasks.push({ id: taskIds[i], projectId: project.id, title, status, assigneeId: assignee.id, clientVisible });
      }
    }
  }

  /* ---------------- Extra hand-written tasks ---------------- */
  const bloomId = projectIds["Autumn Menu Launch"];
  const atlasId = projectIds["New Year Membership Campaign"];
  const verdeId = projectIds["Riverside Towers Launch"];
  const bloomMods = await db.select().from(s.projectModules).where(eq(s.projectModules.projectId, bloomId));
  const bloomContent = bloomMods.find((m) => m.name === "Content")!;
  const bloomProd = bloomMods.find((m) => m.name === "Production")!;

  const extra = await db
    .insert(s.tasks)
    .values([
      { orgId: org.id, projectId: bloomId, moduleId: bloomContent.id, stage: "Writing", title: "Write captions for pumpkin spice latte carousel", assigneeId: U.leila.id, status: "in_progress", priority: "high", dueDate: d(0), createdById: U.omar.id, description: "5 caption options, playful tone. Include CTA to order ahead in the app." },
      { orgId: org.id, projectId: bloomId, moduleId: bloomContent.id, stage: "Design", title: "Design 'Autumn is here' teaser story set", assigneeId: U.maya.id, status: "review", priority: "medium", dueDate: d(1), createdById: U.omar.id },
      { orgId: org.id, projectId: bloomId, moduleId: bloomProd.id, stage: "Editing", title: "Cut 15s TikTok from shoot day footage", assigneeId: U.yusuf.id, status: "in_progress", priority: "urgent", dueDate: d(-2), createdById: U.adam.id, description: "Hook in the first 2s. Use trending audio from the shortlist." },
      { orgId: org.id, projectId: bloomId, moduleId: bloomProd.id, stage: "Client Approval", title: "Hero photo selects for menu boards", assigneeId: U.maya.id, status: "waiting_client", approvalStatus: "pending", clientVisible: true, requiresApproval: true, priority: "high", dueDate: d(2), createdById: U.adam.id, description: "12 selects for the in-store menu boards. Please approve or flag any you'd like swapped." },
      { orgId: org.id, projectId: bloomId, title: "Confirm in-store POS material quantities", assigneeId: U.adam.id, status: "todo", priority: "medium", dueDate: d(4), createdById: U.sara.id },
      { orgId: org.id, projectId: atlasId, title: "Landing page copy for pre-sale offer", assigneeId: U.leila.id, status: "todo", priority: "high", dueDate: d(-1), createdById: U.adam.id },
      { orgId: org.id, projectId: atlasId, title: "Set up lead form integration with CRM", assigneeId: null, status: "todo", priority: "high", dueDate: d(3), createdById: U.sara.id },
      { orgId: org.id, projectId: verdeId, title: "Legal review of brochure copy", assigneeId: U.omar.id, status: "waiting_client", priority: "high", dueDate: d(-3), createdById: U.karim.id, clientVisible: true, description: "Waiting on Verde's legal team to review brochure copy." },
      { orgId: org.id, projectId: verdeId, title: "Book drone operator for phase-2 shoot", assigneeId: null, status: "todo", priority: "medium", dueDate: d(6), createdById: U.karim.id },
    ])
    .returning();
  const [captionsTask, teaserTask, tiktokTask, heroTask] = extra;

  /* ---------------- Comments ---------------- */
  const bloomClientReview = allCreatedTasks.find((t) => t.projectId === bloomId && t.title === "Content: Client Review")!;
  await db.insert(s.taskComments).values([
    { orgId: org.id, taskId: captionsTask.id, authorId: U.omar.id, internal: true, body: "@Leila keep it under 150 characters for the first line — it gets cut off in the feed.", createdAt: subHours(today, 20) },
    { orgId: org.id, taskId: captionsTask.id, authorId: U.leila.id, internal: true, body: "On it. First draft by lunch.", createdAt: subHours(today, 19) },
    { orgId: org.id, taskId: teaserTask.id, authorId: U.maya.id, internal: true, body: "Uploaded v2 with the warmer palette. @Omar can you review?", createdAt: subHours(today, 6) },
    { orgId: org.id, taskId: tiktokTask.id, authorId: U.adam.id, internal: true, body: "Client asked if we can get this out before the weekend — flagging as urgent.", createdAt: subHours(today, 30) },
    { orgId: org.id, taskId: heroTask.id, authorId: U.adam.id, internal: false, body: "Hi Lina — the 12 hero selects are attached. Let us know if you'd like any swapped!", createdAt: subHours(today, 8) },
    { orgId: org.id, taskId: heroTask.id, authorId: U.maya.id, internal: true, body: "Note: #7 has a slight color cast, I've got an alt ready if she flags it.", createdAt: subHours(today, 7) },
    { orgId: org.id, taskId: bloomClientReview.id, authorId: U.omar.id, internal: false, body: "The first two weeks of the October calendar are ready for your review.", createdAt: subHours(today, 26) },
    { orgId: org.id, taskId: bloomClientReview.id, authorId: lina.id, internal: false, body: "Thanks! Looking at these today.", createdAt: subHours(today, 22) },
  ]);

  /* ---------------- Attachments (placeholder files) ---------------- */
  const files = [
    { task: heroTask, name: "hero-selects-contact-sheet.svg", mime: "image/svg+xml", clientVisible: true, body: svgPlaceholder("Hero selects – contact sheet") },
    { task: teaserTask, name: "autumn-teaser-stories-v2.svg", mime: "image/svg+xml", clientVisible: false, body: svgPlaceholder("Autumn teaser v2") },
    { task: captionsTask, name: "pumpkin-latte-captions-draft.txt", mime: "text/plain", clientVisible: false, body: "Option 1: Fall into flavor 🍂 …\nOption 2: Your new autumn ritual …\n" },
    { task: bloomClientReview, name: "october-content-calendar.txt", mime: "text/plain", clientVisible: true, body: "Week 1: Menu reveal\nWeek 2: Behind the counter\nWeek 3: Community spotlight\nWeek 4: Weekend specials\n" },
  ];
  for (const f of files) {
    const key = `${org.id}/${randomUUID()}-${f.name}`;
    await saveFile(key, Buffer.from(f.body), f.mime);
    await db.insert(s.attachments).values({
      orgId: org.id,
      taskId: f.task.id,
      uploaderId: U.maya.id,
      fileName: f.name,
      storageKey: key,
      mimeType: f.mime,
      size: Buffer.byteLength(f.body),
      clientVisible: f.clientVisible,
      createdAt: subHours(today, 9),
    });
  }

  /* ---------------- Chat ---------------- */
  const chat = (projectId: string, author: s.User, channel: "internal" | "client", body: string, minutesAgo: number) => ({
    orgId: org.id,
    projectId,
    authorId: author.id,
    channel,
    body,
    createdAt: subMinutes(today, minutesAgo),
  });
  await db.insert(s.chatMessages).values([
    chat(bloomId, U.adam, "internal", "Morning team — Lina wants the TikTok cut before Friday. @Yusuf can we make that?", 300),
    chat(bloomId, U.yusuf, "internal", "Yes, rough cut today, final tomorrow.", 285),
    chat(bloomId, U.nour, "internal", "I'll hold the paid launch until the video is approved.", 240),
    chat(bloomId, U.omar, "internal", "Captions for the carousel are with Leila, due today.", 120),
    chat(bloomId, U.adam, "client", "Hi Lina! Hero photo selects are ready for your approval in the Approvals tab.", 480),
    chat(bloomId, lina, "client", "Amazing, I'll review this afternoon. Can we also add a post about the new oat milk option?", 420),
    chat(bloomId, U.adam, "client", "Absolutely — @Omar will slot it into week 2.", 410),
    chat(atlasId, U.nour, "internal", "Pre-sale ads are drafted, sending to Daniel for approval.", 200),
    chat(atlasId, daniel, "client", "Looks great so far. What's the expected CPL?", 90),
    chat(verdeId, U.karim, "internal", "Brochure copy is stuck with their legal team — chasing today.", 60),
    chat(verdeId, rana, "client", "Legal will have comments back by Thursday.", 45),
  ]);

  /* ---------------- Notifications ---------------- */
  const n = (user: s.User, actor: s.User, type: string, title: Localized, link: string, hoursAgo: number, read = false) => ({
    orgId: org.id,
    userId: user.id,
    actorId: actor.id,
    type,
    title: title.en,
    titleAr: title.ar,
    link,
    createdAt: subHours(today, hoursAgo),
    readAt: read ? subHours(today, hoursAgo - 1) : null,
  });
  const bloomName = "Autumn Menu Launch";
  await db.insert(s.notifications).values([
    n(U.leila, U.omar, "assigned", nt.assigned(U.omar.name, captionsTask.title), `/tasks/${captionsTask.id}`, 22),
    n(U.leila, U.omar, "mention", nt.mentionTask(U.omar.name, captionsTask.title), `/tasks/${captionsTask.id}`, 20),
    n(U.omar, U.maya, "mention", nt.mentionTask(U.maya.name, teaserTask.title), `/tasks/${teaserTask.id}`, 6),
    n(U.omar, U.leila, "comment", nt.commentTask(U.leila.name, captionsTask.title), `/tasks/${captionsTask.id}`, 19, true),
    n(U.yusuf, U.adam, "mention", nt.mentionChat(U.adam.name, bloomName), `/projects/${bloomId}?tab=chat&channel=internal`, 5),
    n(U.omar, U.adam, "mention", nt.mentionChat(U.adam.name, bloomName), `/projects/${bloomId}?tab=chat&channel=client`, 7),
    n(U.adam, lina, "chat", nt.chatClient(lina.name, bloomName), `/projects/${bloomId}?tab=chat&channel=client`, 7),
    n(lina, U.adam, "approval", nt.approvalRequested(heroTask.title), `/tasks/${heroTask.id}`, 8),
    n(lina, U.omar, "approval", nt.approvalRequested("Content: Client Review"), `/tasks/${bloomClientReview.id}`, 26),
    n(U.sara, U.karim, "status", nt.taskStatus(U.karim.name, "Legal review of brochure copy", "waiting_client", "Verde"), `/tasks/${extra[7].id}`, 50, true),
  ]);

  /* ---------------- Team chat ---------------- */
  const tm = (author: s.User, body: string, hoursAgo: number) => ({ orgId: org.id, authorId: author.id, body, createdAt: subHours(today, hoursAgo) });
  await db.insert(s.teamMessages).values([
    tm(U.sara, "Morning team 👋 Big week: Autumn Menu Launch goes live Thursday. @all please keep your tasks up to date.", 28),
    tm(U.adam, "Bloom Café approved the hero photo. Moving the carousel to review today.", 26),
    tm(U.maya, "Teaser story set is almost there — @Omar can you check the copy before 3pm?", 6),
    tm(U.omar, "On it 👍", 5.5),
    tm(U.nour, "Atlas ad sets are live. First numbers look good, I'll share a snapshot tomorrow.", 3),
  ]);

  /* ---------------- Activity ---------------- */
  const act = (actor: s.User, projectId: string, taskId: string | null, action: string, summary: string, hoursAgo: number, clientVisible = false) => ({
    orgId: org.id,
    actorId: actor.id,
    projectId,
    taskId,
    action,
    summary,
    clientVisible,
    createdAt: subHours(today, hoursAgo),
  });
  const activity = [
    ...plans.map((p) => act(p.owner, projectIds[p.name], null, "project.created", `created project "${p.name}" for ${p.client.name}`, Math.abs(p.start - 3) * 24, true)),
    act(U.adam, bloomId, tiktokTask.id, "task.created", `created task "${tiktokTask.title}"`, 30),
    act(U.sara, bloomId, tiktokTask.id, "task.assigned", `assigned "${tiktokTask.title}" to Yusuf Ali`, 29.5),
    act(U.omar, bloomId, bloomClientReview.id, "task.status", `moved "Content: Client Review" from In Progress to Waiting for Client`, 26, true),
    act(U.omar, bloomId, captionsTask.id, "task.created", `created task "${captionsTask.title}"`, 22),
    act(lina, bloomId, bloomClientReview.id, "comment.added", `commented on "Content: Client Review"`, 22, true),
    act(U.maya, bloomId, heroTask.id, "file.uploaded", `uploaded hero-selects-contact-sheet.svg to "${heroTask.title}"`, 9, true),
    act(U.adam, bloomId, heroTask.id, "task.status", `moved "${heroTask.title}" from Review to Waiting for Client`, 8, true),
    act(U.maya, bloomId, teaserTask.id, "task.status", `moved "${teaserTask.title}" from In Progress to Review`, 6),
    act(daniel, atlasId, null, "approval.approved", `approved "Paid Media: Client Approval"`, 70, true),
    act(U.karim, verdeId, extra[7].id, "task.status", `moved "Legal review of brochure copy" from In Progress to Waiting for Client`, 50, true),
    act(rana, verdeId, null, "approval.rejected", `requested changes on "Production: Client Approval"`, 3, true),
  ];
  await db.insert(s.activityLog).values(activity);

  // Verde production approval: show a "changes requested" state + client feedback.
  const verdeApproval = allCreatedTasks.find((t) => t.projectId === verdeId && t.title === "Production: Client Approval")!;
  await db
    .update(s.tasks)
    .set({ status: "in_progress", approvalStatus: "rejected" })
    .where(eq(s.tasks.id, verdeApproval.id));
  await db.insert(s.taskComments).values({
    orgId: org.id,
    taskId: verdeApproval.id,
    authorId: rana.id,
    internal: false,
    body: "↩️ Changes requested: Please replace the sunset aerial with the daytime version and add the sales office phone number to the end card.",
    createdAt: subHours(today, 3),
  });

  console.log("✓ Seed complete");
  console.log("  Log in with any of these (password: password):");
  console.log("    Admin:    sara@northwind.agency");
  console.log("    Employee: omar@northwind.agency  (also leila@, maya@, yusuf@, nour@, adam@)");
  console.log("    Client:   lina@bloomcafe.com  (also daniel@atlasfitness.com, rana@verde-re.com)");
}

function svgPlaceholder(label: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#f4f4f5"/><text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#52525b">${label}</text></svg>`;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

