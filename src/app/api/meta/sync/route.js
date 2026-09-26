import { NextResponse } from "next/server";

import { getCampaignInsights } from "@/lib/meta";
import { getCampaignsByAccount } from "@/lib/server/campaignService";
import { saveCampaignMetric } from "@/lib/server/campaignMetricService";
import { parseMetaActions } from "@/lib/metaMetrics";
import { requireAdmin } from "@/lib/server/auth";
import { getAdAccountById } from "@/lib/server/adAccountService";

export async function POST(request) {
  try {
    const authUser = await requireAdmin(request);

    console.log("========== META SYNC START ==========");
    console.log("SYNC USER:", {
      uid: authUser.uid,
      email: authUser.email,
      role: authUser.role,
    });

    const body = await request.json();

    console.log("REQUEST BODY:", body);

    const { adAccountId, datePreset, startDate, endDate } = body;
    console.log("AD ACCOUNT ID:", adAccountId);
    console.log("DATE PRESET:", datePreset);
    console.log("START DATE:", startDate);
    console.log("END DATE:", endDate);

    if (!adAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "adAccountId is required",
        },
        { status: 400 },
      );
    }

    if (!datePreset && (!startDate || !endDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide datePreset or startDate & endDate",
        },
        { status: 400 },
      );
    }

    const adAccount = await getAdAccountById(adAccountId);
    const metaAdAccountId = adAccount.metaId;

    console.log("FIRESTORE AD ACCOUNT:", adAccount);
    console.log("META AD ACCOUNT ID:", metaAdAccountId);

    console.log("AD ACCOUNT ID:", adAccountId);
    console.log("DATE PRESET:", datePreset);

    // if (!adAccountId) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "adAccountId is required",
    //     },
    //     { status: 400 },
    //   );
    // }

    // if (!datePreset && (!startDate || !endDate)) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Provide datePreset or startDate & endDate",
    //     },
    //     { status: 400 },
    //   );
    // }

    // =========================
    // FIRESTORE CAMPAIGNS
    // =========================

    const campaigns = await getCampaignsByAccount(adAccountId);

    console.log("FIRESTORE CAMPAIGNS COUNT:", campaigns.length);
    console.log("FIRESTORE CAMPAIGNS:", campaigns);

    const mappedCampaigns = campaigns.filter(
      (campaign) => campaign.adAccountId === adAccountId,
    );

    console.log("MAPPED CAMPAIGNS COUNT:", mappedCampaigns.length);

    console.log("MAPPED CAMPAIGNS:", mappedCampaigns);

    // =========================
    // META INSIGHTS
    // =========================

    const metaData = await getCampaignInsights({
      adAccountId: metaAdAccountId,
      datePreset,
      startDate,
      endDate,
    });

    console.log("META RAW RESPONSE:", metaData);

    const insights = metaData?.data || [];

    console.log("META INSIGHTS COUNT:", insights.length);
    console.log("META INSIGHTS:", insights);

    // =========================
    // MATCHING
    // =========================

    const results = [];

    for (const insight of insights) {
      console.log("-----------------------------");

      console.log("META CAMPAIGN:", {
        id: insight.campaign_id,
        name: insight.campaign_name,
        spend: insight.spend,
      });

      const mapping = mappedCampaigns.find(
        (campaign) => campaign.metaCampaignId === insight.campaign_id,
      );

      console.log("MATCHED FIRESTORE CAMPAIGN:", mapping);

      if (!mapping) {
        console.log("⚠️ SKIPPED — NO CAMPAIGN MAPPING");

        continue;
      }

      const actionMetrics = parseMetaActions(insight.actions);

      const metric = {
        clientId: mapping.clientId,
        campaignId: mapping.id,

        adAccountId,
        metaAdAccountId,

        metaCampaignId: insight.campaign_id,

        campaignName: insight.campaign_name,

        date: insight.date_start,
        dateStart: insight.date_start,
        dateStop: insight.date_stop,

        // =========================
        // META CORE METRICS
        // =========================

        spend: Number(insight.spend || 0),

        impressions: Number(insight.impressions || 0),

        reach: Number(insight.reach || 0),

        clicks: Number(insight.clicks || 0),

        ctr: Number(insight.ctr || 0),

        cpm: Number(insight.cpm || 0),

        // =========================
        // META ACTION METRICS
        // =========================

        linkClicks: actionMetrics.linkClicks,

        landingPageViews: actionMetrics.landingPageViews,

        atc: actionMetrics.atc,

        initiateCheckout: actionMetrics.initiateCheckout,

        addPaymentInfo: actionMetrics.addPaymentInfo,

        purchases: actionMetrics.purchases,

        leads: actionMetrics.leads,

        // =========================
        // RAW META DATA
        // =========================

        actions: insight.actions || [],

        costPerAction: insight.cost_per_action_type || [],
      };

      console.log("SAVING DAILY METRIC:", {
        campaign: metric.campaignName,
        date: metric.date,
        spend: metric.spend,
        chats: metric.chats,
      });

      await saveCampaignMetric(metric);

      results.push(metric);
    }

    console.log("FINAL RESULTS COUNT:", results.length);
    console.log("FINAL RESULTS:", results);
    console.log("========== META SYNC END ==========");

    return NextResponse.json({
      success: true,
      synced: results.length,
      data: results,
    });
  } catch (error) {
    console.error("========== META SYNC ERROR ==========");
    console.error("META_SYNC_ERROR:", error);
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR STACK:", error.stack);

    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "INVALID_AUTH_HEADER"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (error.message === "USER_NOT_FOUND" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Meta sync failed",
      },
      { status: 500 },
    );
  }
}
