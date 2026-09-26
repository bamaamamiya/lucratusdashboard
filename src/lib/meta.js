const META_GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION || "v23.0";

const META_ACCESS_TOKEN =
  process.env.META_ACCESS_TOKEN;

const META_BASE_URL =
  `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

function cleanAdAccountId(id) {
  return String(id || "")
    .replace(/^act_/, "")
    .trim();
}

export async function getCampaignInsights({
  adAccountId,
  datePreset,
  startDate,
  endDate,
}) {
  const accountId =
    cleanAdAccountId(adAccountId);

  const params = new URLSearchParams({
    level: "campaign",

    fields:
      [
        "campaign_id",
        "campaign_name",
        "spend",
        "impressions",
        "reach",
        "clicks",
        "ctr",
        "cpc",
        "cpm",
        "actions",
        "cost_per_action_type",
      ].join(","),

    time_increment: "1",
  });

  if (startDate && endDate) {
    params.set(
      "time_range",
      JSON.stringify({
        since: startDate,
        until: endDate,
      }),
    );
  } else {
    params.set(
      "date_preset",
      datePreset || "last_7d",
    );
  }

  const url =
    `${META_BASE_URL}/act_${accountId}/insights?` +
    `${params.toString()}` +
    `&access_token=${META_ACCESS_TOKEN}`;

  const res = await fetch(url);

  if (!res.ok) {
    const errorText = await res.text();

    throw new Error(
      `Meta Insights API error: ${errorText}`
    );
  }

  return res.json();
}