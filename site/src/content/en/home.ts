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

/**
 * The hero's call sheet: one real agency week, Sunday to Thursday (Friday and Saturday are the
 * weekend). `start` and `span` are day columns (0 = Sunday). One row waits on the client.
 */
export type CallSheetState = "done" | "now" | "client" | "planned";
export const CALL_SHEET: {
  title: string;
  week: string;
  days: string[];
  weekend: string;
  rows: { task: string; who: string; start: number; span: number; state: CallSheetState }[];
  legend: Record<CallSheetState, string>;
} = {
  title: "Bloom Café · Autumn launch",
  week: "Week 41",
  days: ["Sun 5", "Mon 6", "Tue 7", "Wed 8", "Thu 9"],
  weekend: "Weekend",
  rows: [
    { task: "Brief and moodboard", who: "Leila", start: 0, span: 2, state: "done" },
    { task: "Shoot day", who: "Omar", start: 2, span: 1, state: "done" },
    { task: "Teaser edit", who: "Maya", start: 2, span: 2, state: "now" },
    { task: "Client approval", who: "Lina, Bloom Café", start: 4, span: 1, state: "client" },
    { task: "Launch-day posts", who: "Yusuf", start: 4, span: 1, state: "planned" },
  ],
  legend: { done: "Done", now: "In progress", client: "Waiting on the client", planned: "Planned" },
};
