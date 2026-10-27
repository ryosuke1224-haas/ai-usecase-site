import Stripe from "stripe";
import { WEBHOOK_EVENT, type ListedWebhook } from "./setup";

const EVENT = WEBHOOK_EVENT as Stripe.WebhookEndpointCreateParams.EnabledEvent;

export function stripeWebhookApi(key: string): {
  list: () => Promise<ListedWebhook[]>;
  create: (url: string) => Promise<ListedWebhook>;
  updateEvents: (id: string, events: string[]) => Promise<void>;
} {
  const stripe = new Stripe(key);
  return {
    async list() {
      const endpoints: ListedWebhook[] = [];
      let startingAfter: string | undefined;
      for (let page = 0; page < 10; page += 1) {
        const result = await stripe.webhookEndpoints.list({ limit: 100, starting_after: startingAfter });
        for (const item of result.data) {
          endpoints.push({
            id: item.id,
            url: item.url,
            enabledEvents: [...item.enabled_events],
            disabled: item.status === "disabled",
            livemode: item.livemode,
            secret: item.secret ?? null,
          });
        }
        if (!result.has_more || result.data.length === 0) break;
        startingAfter = result.data[result.data.length - 1]?.id;
      }
      return endpoints;
    },
    async create(url) {
      const item = await stripe.webhookEndpoints.create(
        {
          url,
          enabled_events: [EVENT],
          description: "Atlas Preview Japan Sandbox",
        },
        { idempotencyKey: `atlas-preview-jp-webhook-${url.length}-${url.slice(-40)}` },
      );
      return {
        id: item.id,
        url: item.url,
        enabledEvents: [...item.enabled_events],
        disabled: item.status === "disabled",
        livemode: item.livemode,
        secret: item.secret ?? null,
      };
    },
    async updateEvents(id, events) {
      await stripe.webhookEndpoints.update(id, {
        enabled_events: events as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
        disabled: false,
      });
    },
  };
}
