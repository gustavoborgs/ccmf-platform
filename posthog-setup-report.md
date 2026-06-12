<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the CCMF platform. The setup covers client-side initialization via `instrumentation-client.ts` (Next.js 15.3+ pattern), a reverse proxy via `next.config.ts` rewrites to avoid ad-blockers, a shared server-side PostHog client, four new event capture points that were not previously tracked in Google Analytics, user identification on both signup and login, and a server-side event fired from the Asaas payment webhook handler.

| Event | Description | File |
|---|---|---|
| `sign_up` | New guardian account created during enrollment (with `posthog.identify`) | `src/modules/registrations/components/guardian-step.tsx` |
| `sign_in` | Successful login with credentials (with `posthog.identify`) | `src/modules/auth/components/login-form.tsx` |
| `participant_liked` | User liked a participant profile | `src/modules/participants/components/like-button.tsx` |
| `participant_shared` | User shared a participant profile (native share or clipboard) | `src/modules/participants/components/share-button.tsx` |
| `payment_confirmed` | Payment confirmed server-side via Asaas webhook | `src/modules/payments/webhook-handler.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/467905/dashboard/1706144)
- [Registration-to-payment funnel (wizard)](https://us.posthog.com/project/467905/insights/PC3Gp0Us)
- [Logins over time (wizard)](https://us.posthog.com/project/467905/insights/vX7ws7Oh)
- [Participant engagement – likes & shares (wizard)](https://us.posthog.com/project/467905/insights/lXwnXtbO)
- [Payments confirmed over time (wizard)](https://us.posthog.com/project/467905/insights/uGzeq0DA)
- [New accounts vs logins (wizard)](https://us.posthog.com/project/467905/insights/2zlJ3wQW)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
