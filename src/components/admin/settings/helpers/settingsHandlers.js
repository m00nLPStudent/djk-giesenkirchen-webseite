import { createClubSettingsHandlers } from "./clubSettingsHandlers";
import { createContactHandlers } from "./contactHandlers";
import { createMembershipRecipientHandlers } from "./membershipRecipientHandlers";
import { createMembershipRequestHandlers } from "./membershipRequestHandlers";
import { createPageHandlers } from "./pageHandlers";
import { createFieldUpdater } from "./fieldUpdater";

export { createFieldUpdater };

export function createSettingsHandlers(params) {
  const clubHandlers = createClubSettingsHandlers(params);
  const contactHandlers = createContactHandlers(params);
  const pageHandlers = createPageHandlers(params);
  const membershipRecipientHandlers = createMembershipRecipientHandlers(params);
  const membershipRequestHandlers = createMembershipRequestHandlers(params);

  return {
    ...clubHandlers,
    ...contactHandlers,
    ...pageHandlers,
    ...membershipRecipientHandlers,
    ...membershipRequestHandlers,
  };
}
