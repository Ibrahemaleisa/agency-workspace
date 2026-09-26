/** Landing-page copy that isn't shared with other pages. Voice: short declaratives, no exclamation marks. */

/** "Out of the thread": the real mess on the left, the shipped Operra behaviour on the right. */
export const THREAD_VS_OPERRA: { thread: string; operra: string }[] = [
  {
    thread: "“OK go ahead” — a voice note in the client group",
    operra: "Approve or Request changes on the task, recorded with who and when",
  },
  {
    thread: "final_v7_REAL.mp4, forwarded twice",
    operra: "Files live on the task. You choose which ones the client sees",
  },
  {
    thread: "The Sunday sheet of who’s doing what",
    operra: "Team workload and overdue work on the dashboard",
  },
  {
    thread: "“Who’s on this?”",
    operra: "One assignee per task, notified in the app and by email",
  },
  {
    thread: "Scrolling up to find the brief",
    operra: "Channels, budget, shoot date — held on the project’s module",
  },
  {
    thread: "“Are we on track for the launch?”",
    operra: "Every open project rated on track, at risk or off track",
  },
];

/** Proof pillars (from the brand strategy), phrased to what the product does today. */
export const PILLARS: { title: string; body: string }[] = [
  { title: "One model", body: "Client → project → module → task, linked by default. Starter workflows are ready on day one." },
  { title: "Live state", body: "Every task has a status, an owner and a due date. Every module shows its current stage." },
  { title: "Client in the loop", body: "Clients see their work and approve it in their own portal — not in a chat." },
  { title: "Built for here", body: "Arabic and English with a native right-to-left layout, on your own brand and domain." },
];

/** Numbers over adjectives — every figure is a fact about the product. */
export const FACTS: { value: string; label: string }[] = [
  { value: "3", label: "Roles" },
  { value: "4", label: "Starter modules" },
  { value: "5", label: "Task statuses" },
  { value: "2", label: "Chat channels per project" },
  { value: "2", label: "Languages, RTL native" },
];
