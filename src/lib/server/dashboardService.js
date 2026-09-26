import { adminDb } from "@/lib/firebaseAdmin";

function getMonthRange(period) {
  const [year, month] = period.split("-").map(Number);

  const startDate = `${period}-01`;

  const lastDay = new Date(year, month, 0).getDate();

  const endDate = `${period}-${String(lastDay).padStart(2, "0")}`;

  return {
    startDate,
    endDate,
  };
}

function sumBy(items, field) {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0);
}

export async function getDashboardData({ period } = {}) {
  const now = new Date();

  const currentPeriod =
    period ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { startDate, endDate } = getMonthRange(currentPeriod);

  // --------------------------------
  // CLIENTS
  // --------------------------------

  const clientsSnapshot = await adminDb.collection("clients").get();

  const clients = clientsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const activeClients = clients.filter((client) => client.status === "active");

  // --------------------------------
  // AD ACCOUNTS
  // --------------------------------

  const adAccountsSnapshot = await adminDb.collection("adAccounts").get();

  const adAccounts = adAccountsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // --------------------------------
  // CAMPAIGNS
  // --------------------------------

  const campaignsSnapshot = await adminDb.collection("campaigns").get();

  const campaigns = campaignsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "ACTIVE",
  );

  // --------------------------------
  // CAMPAIGN METRICS
  // --------------------------------

  const metricsSnapshot = await adminDb
    .collection("campaignMetrics")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const metrics = metricsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const metaAdSpend = sumBy(metrics, "spend");

  const impressions = sumBy(metrics, "impressions");

  const clicks = sumBy(metrics, "clicks");

  const reach = sumBy(metrics, "reach");

  // --------------------------------
  // CLIENT RESULTS
  // --------------------------------

  const resultsSnapshot = await adminDb
    .collection("clientResults")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const clientResults = resultsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const orders = sumBy(clientResults, "orders");

  const revenue = sumBy(clientResults, "revenue");

  const grossProfit = sumBy(clientResults, "grossProfit");

  // --------------------------------
  // BILLING
  // --------------------------------

  const billingSnapshot = await adminDb
    .collection("clientBilling")
    .where("period", "==", currentPeriod)
    .get();

  const billings = billingSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const serviceRevenue = sumBy(billings, "serviceFee");

  const adSpendBilled = sumBy(billings, "adSpend");

  const totalBilled = sumBy(billings, "totalBilled");

  const amountPaid = sumBy(billings, "amountPaid");

  const outstanding = sumBy(billings, "outstanding");

  // --------------------------------
  // CLIENT OVERVIEW
  // --------------------------------

  const clientOverview = clients.map((client) => {
    const clientMetrics = metrics.filter(
      (metric) => metric.clientId === client.id,
    );

    const clientBilling = billings.filter(
      (billing) => billing.clientId === client.id,
    );

    const clientResultsData = clientResults.filter(
      (result) => result.clientId === client.id,
    );

    const spend = sumBy(clientMetrics, "spend");

    const clientRevenue = sumBy(clientResultsData, "revenue");

    const clientOrders = sumBy(clientResultsData, "orders");

    const billed = sumBy(clientBilling, "totalBilled");

    const paid = sumBy(clientBilling, "amountPaid");

    const clientOutstanding = sumBy(clientBilling, "outstanding");

    const runningCampaigns = activeCampaigns.filter(
      (campaign) => campaign.clientId === client.id,
    ).length;

    return {
      id: client.id,
      name:
        client.businessName ||
        client.name ||
        client.clientName ||
        "Unnamed Client",

      status: client.status || "unknown",

      runningCampaigns,

      spend,
      revenue: clientRevenue,
      orders: clientOrders,

      billed,
      paid,
      outstanding: clientOutstanding,
    };
  });

  // --------------------------------
  // ALERTS
  // --------------------------------

  const alerts = [];

  // --------------------------------
  // BILLING ALERTS
  // --------------------------------

  for (const billing of billings) {
    if (Number(billing.outstanding || 0) <= 0) {
      continue;
    }

    const client = clients.find((item) => item.id === billing.clientId);

    const clientName =
      client?.name ||
      client?.clientName ||
      billing.clientName ||
      "Unnamed Client";

    const today = new Date().toISOString().split("T")[0];

    const isOverdue = billing.dueDate && billing.dueDate < today;

    alerts.push({
      id: `billing_${billing.id}`,

      type: isOverdue ? "billing_overdue" : "billing_outstanding",

      priority: isOverdue ? "high" : "medium",

      clientId: billing.clientId,

      clientName,

      title: isOverdue ? "Billing overdue" : "Outstanding billing",

      description: isOverdue
        ? `${clientName} has overdue billing.`
        : `${clientName} has outstanding billing.`,

      value: Number(billing.outstanding || 0),
    });
  }

  // --------------------------------
  // ACTIVE CLIENT WITHOUT CAMPAIGN
  // --------------------------------

  for (const client of activeClients) {
    const clientCampaigns = activeCampaigns.filter(
      (campaign) => campaign.clientId === client.id,
    );

    if (clientCampaigns.length === 0) {
      alerts.push({
        id: `campaign_${client.id}`,

        type: "no_campaign",

        priority: "medium",

        clientId: client.id,

        clientName:
          client.businessName ||
          client.name ||
          client.clientName ||
          "Unnamed Client",

        title: "No running campaign",

        description: "Active client currently has no running campaign.",

        value: 0,
      });
    }
  }

  // --------------------------------
  // ACTIVE CAMPAIGN WITHOUT SPEND
  // --------------------------------

  for (const campaign of activeCampaigns) {
    const campaignMetrics = metrics.filter(
      (metric) => metric.campaignId === campaign.id,
    );

    const campaignSpend = sumBy(campaignMetrics, "spend");

    if (campaignSpend === 0) {
      alerts.push({
        id: `spend_${campaign.id}`,

        type: "no_spend",

        priority: "high",

        clientId: campaign.clientId,

        clientName: campaign.clientName || "Unnamed Client",

        campaignId: campaign.id,

        campaignName: campaign.campaignName || "Unnamed Campaign",

        title: "Campaign not spending",

        description: `${campaign.campaignName || "Campaign"} is active but has no spend this period.`,

        value: 0,
      });
    }
  }

  return {
    period: currentPeriod,

    clients: {
      total: clients.length,
      active: activeClients.length,
    },

    marketing: {
      metaAdSpend,
      impressions,
      clicks,
      reach,
      activeCampaigns: activeCampaigns.length,
    },

    business: {
      orders,
      revenue,
      grossProfit,
    },

    finance: {
      serviceRevenue,
      adSpendBilled,
      totalBilled,
      amountPaid,
      outstanding,
    },

    clientOverview,

    alerts,
  };
}
