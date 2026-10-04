import { test } from "node:test";
import assert from "node:assert/strict";
import { safePath } from "@/lib/safe-path";

test("safePath keeps same-site paths and rejects other sites", () => {
  assert.equal(safePath("/tasks/1?x=1"), "/tasks/1?x=1");
  assert.equal(safePath("/"), "/");
  for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "", null, undefined]) {
    assert.equal(safePath(bad), null, String(bad));
  }
});
