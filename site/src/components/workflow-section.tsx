import { WORKFLOW } from "@/content/workflow";
import { ProductFrame } from "./product-frame";
import { WorkflowTour } from "./workflow-tour";

/** Server wrapper: renders each step's screenshot here so the client tour stays small. */
export function WorkflowSection() {
  const frames = WORKFLOW.map((s) => (
    <ProductFrame key={s.id} shot={s.shot} sizes="(min-width: 1200px) 820px, (min-width: 1024px) 65vw, 100vw" />
  ));
  return <WorkflowTour steps={WORKFLOW} frames={frames} />;
}
