import test from "node:test";
import assert from "node:assert/strict";

import { CONTRIBUTION_NATIVE_SELECT_CLASSNAME } from "./contributionSelectStyles.js";

test("select styling keeps native options readable for the contributions admin UI", () => {
  assert.match(CONTRIBUTION_NATIVE_SELECT_CLASSNAME, /\[&>option\]:bg-white/);
  assert.match(CONTRIBUTION_NATIVE_SELECT_CLASSNAME, /\[&>option\]:text-slate-950/);
  assert.match(CONTRIBUTION_NATIVE_SELECT_CLASSNAME, /\[color-scheme:dark\]/);
});

