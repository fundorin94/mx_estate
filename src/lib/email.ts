import { Resend } from "resend";
import { SITE_NAME, SITE_URL, absoluteUrl } from "./site";

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type LeadEmailInput = {
  publicId?: string | null;
  buyer: {
    name: string;
    email: string;
    phone: string | null;
    message: string;
    budgetUsd: number | null;
    timeline: string | null;
  };
  property: {
    id: string;
    title: string;
    priceUsd: number;
    type: "sale" | "rent";
    neighborhood: string | null;
    cityName: string | null;
  };
  realtor: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export async function sendLeadNotification(input: LeadEmailInput): Promise<void> {
  const client = getClient();
  const to = process.env.OPERATOR_EMAIL;
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

  if (!client) {
    // eslint-disable-next-line no-console
    console.warn("[email] RESEND_API_KEY missing — skipping notification");
    return;
  }
  if (!to) {
    // eslint-disable-next-line no-console
    console.warn("[email] OPERATOR_EMAIL missing — skipping notification");
    return;
  }

  const { buyer, property, realtor } = input;
  const priceLabel =
    property.type === "rent"
      ? `$${property.priceUsd.toLocaleString()}/mo`
      : `$${property.priceUsd.toLocaleString()}`;
  const location = [property.neighborhood, property.cityName]
    .filter(Boolean)
    .join(", ");
  const propertyUrl = absoluteUrl(`/properties/${property.id}`);
  const realtorUrl = realtor ? absoluteUrl(`/realtors/${realtor.id}`) : null;

  const subject = `[${SITE_NAME}] New lead · ${priceLabel} · ${property.title}`;

  const rows: [string, string][] = [
    ["From", `${escape(buyer.name)} &lt;${escape(buyer.email)}&gt;`],
    ...(buyer.phone ? ([["Phone", escape(buyer.phone)]] as [string, string][]) : []),
    ["Property", `<a href="${propertyUrl}">${escape(property.title)}</a> · ${priceLabel}${location ? ` · ${escape(location)}` : ""}`],
    ...(realtor
      ? ([
          [
            "Assigned realtor",
            realtorUrl
              ? `<a href="${realtorUrl}">${escape(realtor.name)}</a>${realtor.email ? ` &lt;${escape(realtor.email)}&gt;` : ""}${realtor.phone ? ` · ${escape(realtor.phone)}` : ""}`
              : escape(realtor.name),
          ],
        ] as [string, string][])
      : []),
    ...(buyer.budgetUsd
      ? ([["Budget", `$${buyer.budgetUsd.toLocaleString()}`]] as [string, string][])
      : []),
    ...(buyer.timeline
      ? ([["Timeline", escape(buyer.timeline)]] as [string, string][])
      : []),
    ...(input.publicId
      ? ([["Lead ID", escape(input.publicId)]] as [string, string][])
      : []),
  ];

  const html = `
<!doctype html>
<html>
<body style="font-family: -apple-system, system-ui, sans-serif; color: #111827; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="font-size: 14px; color: #6b7280;">${SITE_NAME}</div>
  <h2 style="margin: 8px 0 16px; font-size: 22px;">New lead received</h2>

  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    ${rows
      .map(
        ([k, v]) => `
    <tr>
      <td style="padding: 6px 12px 6px 0; vertical-align: top; color: #6b7280; width: 130px; border-bottom: 1px solid #f3f4f6;">${escape(k)}</td>
      <td style="padding: 6px 0; border-bottom: 1px solid #f3f4f6;">${v}</td>
    </tr>`,
      )
      .join("")}
  </table>

  <h3 style="margin: 24px 0 6px; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Message</h3>
  <p style="margin: 0; white-space: pre-line; padding: 12px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">${escape(buyer.message)}</p>

  <p style="margin: 32px 0 0; font-size: 12px; color: #9ca3af;">
    Sent from ${SITE_URL}
  </p>
</body>
</html>
  `.trim();

  const text = [
    `New lead from ${buyer.name} <${buyer.email}>`,
    ...(buyer.phone ? [`Phone: ${buyer.phone}`] : []),
    `Property: ${property.title} (${priceLabel})${location ? ` — ${location}` : ""}`,
    `URL: ${propertyUrl}`,
    ...(realtor ? [`Realtor: ${realtor.name}${realtor.email ? ` <${realtor.email}>` : ""}`] : []),
    ...(buyer.budgetUsd ? [`Budget: $${buyer.budgetUsd.toLocaleString()}`] : []),
    ...(buyer.timeline ? [`Timeline: ${buyer.timeline}`] : []),
    "",
    "Message:",
    buyer.message,
  ].join("\n");

  const { error } = await client.emails.send({
    from: `${SITE_NAME} <${from}>`,
    to,
    replyTo: buyer.email,
    subject,
    html,
    text,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[email] failed to send lead notification:", error);
  }
}
