import { expect, test } from "../support/fixtures";

test.describe("Atlas payments boundaries", () => {
  test("checkout sends a logged-out buyer to sign in and ignores a browser price id", async ({
    request,
  }) => {
    const response = await request.post("/api/stripe/checkout", {
      form: {
        productSlug: "ai-collections-assistant",
        priceId: "price_from_browser",
      },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    const location = response.headers().location ?? "";
    expect(location).toContain("/auth");
    expect(location).not.toContain("price_from_browser");
    expect(location).not.toContain("checkout.stripe.com");
  });

  test("an invalid stripe signature is rejected", async ({ request }) => {
    const response = await request.post("/api/stripe/webhook", {
      data: "{}",
      headers: { "stripe-signature": "t=1,v1=bad" },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { granted?: boolean };
    expect(body.granted).toBe(false);
  });
});
