import { createClubSettingsHandlers } from "./clubSettingsHandlers";
import { createContactHandlers } from "./contactHandlers";
import { createPageHandlers } from "./pageHandlers";
import { createFieldUpdater } from "./fieldUpdater";

export { createFieldUpdater };

export function createSettingsHandlers(params) {
  const clubHandlers = createClubSettingsHandlers(params);
  const contactHandlers = createContactHandlers(params);
  const pageHandlers = createPageHandlers(params);

  return {
    ...clubHandlers,
    ...contactHandlers,
    ...pageHandlers,
  };
}
