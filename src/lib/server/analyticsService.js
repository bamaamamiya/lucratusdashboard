import { adminDb } from "@/lib/firebaseAdmin";

export async function getAnalytics({
  clientId = null,
  startDate,
  endDate,
}) {
  if (!startDate || !endDate) {
    throw new Error(
      "startDate and endDate are required"
    );
  }

  // =========================================================
  // 1. GET META CAMPAIGN METRICS
  // =========================================================

  const campaignSnapshot = await adminDb
    .collection("campaignMetrics")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const metrics = campaignSnapshot.docs.map(
    (doc) => ({
      id: doc.id,
      ...doc.data(),
    })
  );

  const filteredMetrics = clientId
    ? metrics.filter(
        (metric) =>
          metric.clientId === clientId
      )
    : metrics;

  // =========================================================
  // 2. GET CLIENT BUSINESS RESULTS
  // =========================================================

  const clientResultSnapshot =
    await adminDb
      .collection("clientResults")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .get();

  const clientResults =
    clientResultSnapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

  const filteredClientResults =
    clientId
      ? clientResults.filter(
          (result) =>
            result.clientId === clientId
        )
      : clientResults;

  // =========================================================
  // 3. META TOTALS
  // =========================================================

  let spend = 0;
  let impressions = 0;
  let reach = 0;

  let clicks = 0;
  let linkClicks = 0;

  let atc = 0;
  let landingPageViews = 0;
  let initiateCheckout = 0;
  let addPaymentInfo = 0;

  let purchases = 0;
  let leads = 0;
  let messagingConversations = 0;

  const campaignMap = {};
  const dailyMap = {};

  for (const metric of filteredMetrics) {
    const metricSpend =
      Number(metric.spend || 0);

    const metricImpressions =
      Number(metric.impressions || 0);

    const metricReach =
      Number(metric.reach || 0);

    const metricClicks =
      Number(metric.clicks || 0);

    const metricLinkClicks =
      Number(
        metric.linkClicks ??
          metric.link_clicks ??
          metric.outboundClicks ??
          0
      );

    const metricAtc =
      Number(metric.atc || 0);

    const metricLandingPageViews =
      Number(
        metric.landingPageViews ??
          metric.landing_page_views ??
          0
      );

    const metricInitiateCheckout =
      Number(
        metric.initiateCheckout ??
          metric.initiate_checkout ??
          0
      );

    const metricAddPaymentInfo =
      Number(
        metric.addPaymentInfo ??
          metric.add_payment_info ??
          0
      );

    const metricPurchases =
      Number(
        metric.purchases ??
          metric.purchase ??
          0
      );

    const metricLeads =
      Number(metric.leads || 0);

    const metricMessagingConversations =
      Number(
        metric.messagingConversations ??
          metric.messaging_conversations ??
          0
      );

    spend += metricSpend;
    impressions += metricImpressions;
    reach += metricReach;

    clicks += metricClicks;
    linkClicks += metricLinkClicks;

    atc += metricAtc;
    landingPageViews +=
      metricLandingPageViews;

    initiateCheckout +=
      metricInitiateCheckout;

    addPaymentInfo +=
      metricAddPaymentInfo;

    purchases += metricPurchases;
    leads += metricLeads;

    messagingConversations +=
      metricMessagingConversations;

    // =======================================================
    // CAMPAIGN AGGREGATION
    // =======================================================

    const campaignKey =
      metric.campaignId;

    if (!campaignMap[campaignKey]) {
      campaignMap[campaignKey] = {
        campaignId:
          metric.campaignId,

        metaCampaignId:
          metric.metaCampaignId,

        campaignName:
          metric.campaignName,

        clientId:
          metric.clientId,

        spend: 0,
        impressions: 0,
        reach: 0,

        clicks: 0,
        linkClicks: 0,

        landingPageViews: 0,

        atc: 0,
        initiateCheckout: 0,
        addPaymentInfo: 0,

        purchases: 0,
        leads: 0,
        messagingConversations: 0,
      };
    }

    const campaign =
      campaignMap[campaignKey];

    campaign.spend +=
      metricSpend;

    campaign.impressions +=
      metricImpressions;

    campaign.reach +=
      metricReach;

    campaign.clicks +=
      metricClicks;

    campaign.linkClicks +=
      metricLinkClicks;

    campaign.landingPageViews +=
      metricLandingPageViews;

    campaign.atc +=
      metricAtc;

    campaign.initiateCheckout +=
      metricInitiateCheckout;

    campaign.addPaymentInfo +=
      metricAddPaymentInfo;

    campaign.purchases +=
      metricPurchases;

    campaign.leads +=
      metricLeads;

    campaign.messagingConversations +=
      metricMessagingConversations;

    // =======================================================
    // DAILY AGGREGATION
    // =======================================================

    if (!dailyMap[metric.date]) {
      dailyMap[metric.date] = {
        date: metric.date,

        spend: 0,
        impressions: 0,
        reach: 0,

        clicks: 0,
        linkClicks: 0,

        landingPageViews: 0,

        atc: 0,
        initiateCheckout: 0,
        addPaymentInfo: 0,

        purchases: 0,
        leads: 0,
        messagingConversations: 0,
      };
    }

    const daily =
      dailyMap[metric.date];

    daily.spend +=
      metricSpend;

    daily.impressions +=
      metricImpressions;

    daily.reach +=
      metricReach;

    daily.clicks +=
      metricClicks;

    daily.linkClicks +=
      metricLinkClicks;

    daily.landingPageViews +=
      metricLandingPageViews;

    daily.atc +=
      metricAtc;

    daily.initiateCheckout +=
      metricInitiateCheckout;

    daily.addPaymentInfo +=
      metricAddPaymentInfo;

    daily.purchases +=
      metricPurchases;

    daily.leads +=
      metricLeads;

    daily.messagingConversations +=
      metricMessagingConversations;
  }

  // =========================================================
  // 4. BUSINESS RESULTS TOTALS
  // =========================================================

  let qualifiedLeads = 0;
  let orders = 0;
  let revenue = 0;
  let grossProfit = 0;

  for (const result of filteredClientResults) {
    qualifiedLeads += Number(
      result.qualifiedLeads || 0
    );

    orders += Number(
      result.orders || 0
    );

    revenue += Number(
      result.revenue || 0
    );

    grossProfit += Number(
      result.grossProfit || 0
    );
  }

  // =========================================================
  // 5. MARKETING METRICS
  // =========================================================

  const ctr =
    impressions > 0
      ? (clicks / impressions) * 100
      : 0;

  const cpc =
    clicks > 0
      ? spend / clicks
      : 0;

  const cpm =
    impressions > 0
      ? (spend / impressions) * 1000
      : 0;

  const frequency =
    reach > 0
      ? impressions / reach
      : 0;

  const costPerAtc =
    atc > 0
      ? spend / atc
      : 0;

  const costPerPurchase =
    purchases > 0
      ? spend / purchases
      : 0;

  const purchaseRate =
    linkClicks > 0
      ? (purchases / linkClicks) * 100
      : 0;

  const landingPageViewRate =
    linkClicks > 0
      ? (landingPageViews / linkClicks) *
        100
      : 0;

  const atcRate =
    landingPageViews > 0
      ? (atc / landingPageViews) * 100
      : 0;

  // =========================================================
  // 6. BUSINESS METRICS
  // =========================================================

  const cac =
    orders > 0
      ? spend / orders
      : 0;

  const roas =
    spend > 0
      ? revenue / spend
      : 0;

  const profitAfterAds =
    grossProfit - spend;

  const orderRate =
    qualifiedLeads > 0
      ? (orders / qualifiedLeads) * 100
      : 0;

  const revenuePerOrder =
    orders > 0
      ? revenue / orders
      : 0;

  // =========================================================
  // 7. CAMPAIGN METRICS
  // =========================================================

  const campaigns = Object.values(
    campaignMap
  )
    .map((campaign) => ({
      ...campaign,

      budgetShare:
        spend > 0
          ? (campaign.spend / spend) * 100
          : 0,

      ctr:
        campaign.impressions > 0
          ? (campaign.clicks /
              campaign.impressions) *
            100
          : 0,

      cpc:
        campaign.clicks > 0
          ? campaign.spend /
            campaign.clicks
          : 0,

      cpm:
        campaign.impressions > 0
          ? (campaign.spend /
              campaign.impressions) *
            1000
          : 0,

      frequency:
        campaign.reach > 0
          ? campaign.impressions /
            campaign.reach
          : 0,

      costPerAtc:
        campaign.atc > 0
          ? campaign.spend /
            campaign.atc
          : 0,

      costPerPurchase:
        campaign.purchases > 0
          ? campaign.spend /
            campaign.purchases
          : 0,

      purchaseRate:
        campaign.linkClicks > 0
          ? (campaign.purchases /
              campaign.linkClicks) *
            100
          : 0,
    }))
    .sort(
      (a, b) =>
        b.spend - a.spend
    );

  // =========================================================
  // 8. DAILY METRICS
  // =========================================================

  const daily = Object.values(
    dailyMap
  )
    .map((day) => ({
      ...day,

      ctr:
        day.impressions > 0
          ? (day.clicks /
              day.impressions) *
            100
          : 0,

      cpc:
        day.clicks > 0
          ? day.spend / day.clicks
          : 0,

      cpm:
        day.impressions > 0
          ? (day.spend /
              day.impressions) *
            1000
          : 0,

      costPerAtc:
        day.atc > 0
          ? day.spend / day.atc
          : 0,

      costPerPurchase:
        day.purchases > 0
          ? day.spend /
            day.purchases
          : 0,
    }))
    .sort((a, b) =>
      a.date.localeCompare(b.date)
    );

  // =========================================================
  // 9. FINAL RESPONSE
  // =========================================================

  return {
    period: {
      startDate,
      endDate,
    },

    totals: {
      // -----------------------------------------------------
      // META / MARKETING
      // -----------------------------------------------------

      spend,

      impressions,
      reach,
      frequency,

      clicks,
      linkClicks,

      ctr,
      cpc,
      cpm,

      landingPageViews,
      landingPageViewRate,

      atc,
      atcRate,
      costPerAtc,

      initiateCheckout,
      addPaymentInfo,

      purchases,
      costPerPurchase,
      purchaseRate,

      leads,
      messagingConversations,

      // -----------------------------------------------------
      // BUSINESS
      // -----------------------------------------------------

      qualifiedLeads,
      orders,
      revenue,
      grossProfit,

      // -----------------------------------------------------
      // PROFITABILITY
      // -----------------------------------------------------

      cac,
      roas,
      profitAfterAds,
      orderRate,
      revenuePerOrder,
    },

    campaigns,

    daily,

    clientResults:
      filteredClientResults,
  };
}