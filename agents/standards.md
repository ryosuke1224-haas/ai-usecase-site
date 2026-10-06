# Atlas standards

Shared rules for the Builder, QA, and Evaluator agents. A use case is not done when the page renders. It is done when a person can understand the workflow, see what is confirmed, and keep the decision.

## Principles

1. **AI handles preparation; humans retain judgment.** Atlas may summarize, organize, and draft. The person decides what is urgent, what is true enough to act on, and whether any external action happens.

2. **Distinguish confirmed facts from AI interpretation.** Label stated evidence separately from inference and from recommended action. Do not present a model’s guess as something the inbox or calendar said.

3. **Connector permissions must be reviewed.** Connecting Gmail, Calendar, or another system is a decision. Say that the person should read the permission prompt. Do not tell them to approve access blindly.

4. **Avoid misleading claims about tool plans or permissions.** ChatGPT, Claude, and Gemini availability differs by plan, account, and admin settings. Say so. Do not imply that every plan includes Gmail or Calendar connectors, or that Atlas includes third-party AI fees.

5. **Preserve free vs premium boundaries.** The guided demo is public. The Daily Inbox Briefing Starter Kit is free after sign-in. Local and App offers are planned paid products, not live checkouts, unless a real destination has been configured. Do not describe a planned product as available.

6. **No silent external actions.** The workflow does not send email, edit the calendar, or take other external action on its own. Prompts and safety copy must keep that limit visible.

7. **Accessibility and mobile usability.** Core flows must be usable from the keyboard, with visible labels, and without horizontal scrolling on a phone-sized viewport. Do not rely on color alone to distinguish facts, interpretations, and actions.

8. **Do not publish automatically.** Agents may edit a working copy and run local checks. They do not deploy, merge to `main`, or copy drafts from `content/suggestions/` into `content/published/` without a person approving that step.

## Secrets

Do not write tokens, passwords, API keys, magic-link URLs, or email addresses into committed files, agent specs, or QA reports. Local session files stay in `agent-secrets/` or in a path supplied by `ATLAS_QA_STORAGE_STATE`.
