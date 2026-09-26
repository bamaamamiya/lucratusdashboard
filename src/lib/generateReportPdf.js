import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = {
  black: [13, 13, 13],
  dark: [24, 24, 27],
  text: [25, 25, 25],
  muted: [113, 113, 122],
  light: [244, 244, 245],
  border: [228, 228, 231],
  white: [255, 255, 255],
};

async function loadImageAsDataUrl(src) {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error("Failed to load logo");
  }

  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

export async function generateReportPdf({
  report,
  client,
  startDate,
  endDate,
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 16;

  let logoDataUrl = null;

  try {
    logoDataUrl = await loadImageAsDataUrl("/images/logo/logo.png");
  } catch (error) {
    console.warn("Lucratus logo could not be loaded:", error);
  }

  const clientName =
    client?.businessName || client?.name || "Agency Performance";

  const totals = report?.totals || {};
  const campaigns = report?.campaigns || [];
  const daily = report?.daily || [];

  /*
  ============================================================
  PAGE 1 — EXECUTIVE OVERVIEW
  ============================================================
  */

  drawHeader(doc, logoDataUrl);

  let y = 58;

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);

  doc.text(clientName, margin, y);

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);

  doc.text("Meta Ads Performance Report", margin, y);

  y += 6;

  doc.text(formatDateRange(startDate, endDate), margin, y);

  /*
  ------------------------------------------------------------
  PRIMARY SPEND CARD
  ------------------------------------------------------------
  */

  y += 16;

  doc.setFillColor(...COLORS.black);

  doc.roundedRect(margin, y, pageWidth - margin * 2, 39, 4, 4, "F");

  doc.setTextColor(170, 170, 170);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text("TOTAL AD SPEND", margin + 8, y + 10);

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);

  doc.text(formatRupiah(totals.spend), margin + 8, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 170);

  doc.text(
    `${formatNumber(totals.clicks)} clicks generated`,
    pageWidth - margin - 8,
    y + 24,
    {
      align: "right",
    },
  );

  /*
  ------------------------------------------------------------
  CORE METRICS
  ------------------------------------------------------------
  */

  y += 51;

  const metricGap = 4;
  const metricWidth = (pageWidth - margin * 2 - metricGap * 3) / 4;

  const coreMetrics = [
    {
      label: "REACH",
      value: formatNumber(totals.reach),
    },
    {
      label: "IMPRESSIONS",
      value: formatNumber(totals.impressions),
    },
    {
      label: "CLICKS",
      value: formatNumber(totals.clicks),
    },
    {
      label: "CTR",
      value: formatPercent(totals.ctr),
    },
  ];

  coreMetrics.forEach((metric, index) => {
    const x = margin + index * (metricWidth + metricGap);

    drawMetricCard(doc, x, y, metricWidth, 27, metric.label, metric.value);
  });

  /*
  ------------------------------------------------------------
  PERFORMANCE SNAPSHOT
  ------------------------------------------------------------
  */

  y += 40;

  drawSectionTitle(doc, "Performance Snapshot", margin, y);

  y += 8;

  const performanceMetrics = [
    ["CPC", formatRupiah(totals.cpc)],
    ["CPM", formatRupiah(totals.cpm)],
    ["Frequency", Number(totals.frequency || 0).toFixed(2)],
    ["Link Clicks", formatNumber(totals.linkClicks)],
    ["LP Views", formatNumber(totals.landingPageViews)],
    ["LP View Rate", formatPercent(totals.landingPageViewRate)],
  ];

  drawTwoColumnMetrics(doc, performanceMetrics, margin, y, pageWidth);

  /*
  ------------------------------------------------------------
  CONVERSION
  ------------------------------------------------------------
  */

  y += 52;

  drawSectionTitle(doc, "Conversion Performance", margin, y);

  y += 8;

  const conversionMetrics = [
    ["Add To Cart", formatNumber(totals.atc)],
    ["ATC Rate", formatPercent(totals.atcRate)],
    ["Leads", formatNumber(totals.leads)],
    ["Purchases", formatNumber(totals.purchases)],
    ["Cost / Purchase", formatRupiah(totals.costPerPurchase)],
    ["Conversations", formatNumber(totals.messagingConversations)],
  ];

  drawTwoColumnMetrics(doc, conversionMetrics, margin, y, pageWidth);

  addFooter(doc, 1);

  /*
  ============================================================
  PAGE 2 — CAMPAIGN PERFORMANCE
  ============================================================
  */

  doc.addPage();

  drawSimplePageHeader(doc, "Campaign Performance", clientName, logoDataUrl);

  y = 43;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);

  doc.text("Performance breakdown by campaign", margin, y);

  y += 8;

  autoTable(doc, {
    startY: y,
    margin: {
      left: margin,
      right: margin,
    },

    head: [["Campaign", "Spend", "Impr.", "Clicks", "CTR", "ATC", "Purch."]],

    body: campaigns.length
      ? campaigns.map((campaign) => [
          campaign.campaignName || "-",
          formatRupiah(campaign.spend),
          formatNumber(campaign.impressions),
          formatNumber(campaign.clicks),
          formatPercent(campaign.ctr),
          formatNumber(campaign.atc),
          formatNumber(campaign.purchases),
        ])
      : [["No campaign data", "", "", "", "", "", ""]],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 4,
      textColor: COLORS.text,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      valign: "middle",
    },

    headStyles: {
      fillColor: COLORS.dark,
      textColor: COLORS.white,
      fontStyle: "bold",
      lineColor: COLORS.dark,
    },

    alternateRowStyles: {
      fillColor: [249, 249, 250],
    },

    columnStyles: {
      0: {
        cellWidth: 53,
      },
    },
  });

  y = doc.lastAutoTable.finalY + 18;

  /*
  ------------------------------------------------------------
  DAILY PERFORMANCE
  ------------------------------------------------------------
  */

  drawSectionTitle(doc, "Daily Performance", margin, y);

  y += 8;

  autoTable(doc, {
    startY: y,
    margin: {
      left: margin,
      right: margin,
    },

    head: [["Date", "Spend", "Impr.", "Reach", "Clicks", "CTR", "ATC"]],

    body: daily.length
      ? daily.map((day) => [
          formatDate(day.date),
          formatRupiah(day.spend),
          formatNumber(day.impressions),
          formatNumber(day.reach),
          formatNumber(day.clicks),
          formatPercent(day.ctr),
          formatNumber(day.atc),
        ])
      : [["No daily data", "", "", "", "", "", ""]],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 4,
      textColor: COLORS.text,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },

    headStyles: {
      fillColor: COLORS.dark,
      textColor: COLORS.white,
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [249, 249, 250],
    },
  });

  addFooter(doc, 2);

  /*
  ============================================================
  PAGE 3 — BUSINESS RESULTS
  ============================================================
  */

  doc.addPage();

  drawSimplePageHeader(doc, "Business Results", clientName, logoDataUrl);

  y = 48;

  const businessMetrics = [
    {
      label: "REVENUE",
      value: formatRupiah(totals.revenue),
    },
    {
      label: "ORDERS",
      value: formatNumber(totals.orders),
    },
    {
      label: "ROAS",
      value: `${Number(totals.roas || 0).toFixed(2)}x`,
    },
    {
      label: "PROFIT AFTER ADS",
      value: formatRupiah(totals.profitAfterAds),
    },
  ];

  const businessGap = 5;

  const businessWidth = (pageWidth - margin * 2 - businessGap * 3) / 4;

  businessMetrics.forEach((metric, index) => {
    const x = margin + index * (businessWidth + businessGap);

    drawMetricCard(
      doc,
      x,
      y,
      businessWidth,
      32,
      metric.label,
      metric.value,
      true,
    );
  });

  y += 48;

  drawSectionTitle(doc, "Business Funnel", margin, y);

  y += 8;

  const businessFunnel = [
    ["Qualified Leads", formatNumber(totals.qualifiedLeads)],
    ["Orders", formatNumber(totals.orders)],
    ["Order Rate", formatPercent(totals.orderRate)],
    ["Revenue / Order", formatRupiah(totals.revenuePerOrder)],
    ["Gross Profit", formatRupiah(totals.grossProfit)],
    ["CAC", formatRupiah(totals.cac)],
  ];

  drawTwoColumnMetrics(doc, businessFunnel, margin, y, pageWidth);

  /*
  ------------------------------------------------------------
  KEY FINDINGS
  ------------------------------------------------------------
  */

  y += 58;

  drawSectionTitle(doc, "Key Findings", margin, y);

  y += 9;

  const findings = buildFindings(totals, campaigns);

  findings.forEach((finding) => {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = 25;
    }

    doc.setFillColor(...COLORS.light);

    doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 3, 3, "F");

    doc.setFillColor(...COLORS.black);

    doc.circle(margin + 7, y + 11, 2, "F");

    doc.setFont("helvetica", "normal");

    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.text);

    const lines = doc.splitTextToSize(finding, pageWidth - margin * 2 - 20);

    doc.text(lines, margin + 13, y + 9);

    y += 27;
  });

  /*
  ------------------------------------------------------------
  NEXT ACTIONS
  ------------------------------------------------------------
  */

  y += 4;

  if (y > pageHeight - 75) {
    doc.addPage();
    y = 25;
  }

  drawSectionTitle(doc, "Next Actions", margin, y);

  y += 9;

  const actions = buildNextActions(totals, campaigns);

  actions.forEach((action, index) => {
    doc.setFont("helvetica", "bold");

    doc.setFontSize(9);

    doc.setTextColor(...COLORS.text);

    doc.text(`${index + 1}.`, margin, y);

    doc.setFont("helvetica", "normal");

    const lines = doc.splitTextToSize(action, pageWidth - margin * 2 - 10);

    doc.text(lines, margin + 8, y);

    y += Math.max(12, lines.length * 4) + 3;
  });

  /*
  ------------------------------------------------------------
  FINAL NOTE
  ------------------------------------------------------------
  */

  y += 5;

  if (y > pageHeight - 40) {
    doc.addPage();
    y = 25;
  }

  doc.setFillColor(...COLORS.black);

  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, "F");

  doc.setFont("helvetica", "bold");

  doc.setFontSize(9);

  doc.setTextColor(...COLORS.white);

  doc.text("Prepared by lucratusagency", margin + 8, y + 10);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(7.5);

  doc.setTextColor(170, 170, 170);

  doc.text("Meta Ads performance reporting & optimization", margin + 8, y + 17);

  addFooter(doc, doc.internal.getNumberOfPages());

  /*
  ============================================================
  DOWNLOAD
  ============================================================
  */

  const safeClientName = clientName.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  doc.save(`lucratusagency-${safeClientName}-${startDate}-${endDate}.pdf`);
}

/*
============================================================
DRAW HELPERS
============================================================
*/

function drawHeader(doc, logoDataUrl) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(
    ...COLORS.black
  );

  doc.rect(
    0,
    0,
    pageWidth,
    40,
    "F"
  );

  // =========================================
  // BRAND LOCKUP
  // =========================================

  const logoX = 16;
  const logoY = 10;
  const logoSize = 13;

  if (logoDataUrl) {
    doc.addImage(
      logoDataUrl,
      "PNG",
      logoX,
      logoY,
      logoSize,
      logoSize
    );
  }

  // Vertical separator
  const separatorX =
    logoX + logoSize + 7;

  doc.setDrawColor(
    75,
    75,
    80
  );

  doc.setLineWidth(0.35);

  doc.line(
    separatorX,
    9,
    separatorX,
    24
  );

  // Agency name
  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.setTextColor(
    ...COLORS.white
  );

  doc.text(
    "Lucratus Agency",
    separatorX + 7,
    16
  );

  // Small descriptor
  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6.5);

  doc.setTextColor(
    160,
    160,
    165
  );

  doc.text(
    "META ADS PERFORMANCE",
    separatorX + 7,
    22
  );

  // =========================================
  // REPORT LABEL — RIGHT SIDE
  // =========================================

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6.5);

  doc.setTextColor(
    145,
    145,
    150
  );

  doc.text(
    "PERFORMANCE REPORT",
    pageWidth - 16,
    16,
    {
      align: "right",
    }
  );

  doc.setTextColor(
    95,
    95,
    100
  );

  doc.text(
    "CONFIDENTIAL",
    pageWidth - 16,
    22,
    {
      align: "right",
    }
  );

  // Bottom divider
  doc.setDrawColor(
    45,
    45,
    48
  );

  doc.setLineWidth(0.25);

  doc.line(
    16,
    32,
    pageWidth - 16,
    32
  );
}

function drawSimplePageHeader(
  doc,
  title,
  clientName,
  logoDataUrl
) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  doc.setFillColor(
    ...COLORS.black
  );

  doc.rect(
    0,
    0,
    pageWidth,
    30,
    "F"
  );

  const logoX = 16;
  const logoY = 7;
  const logoSize = 11;

  if (logoDataUrl) {
    doc.addImage(
      logoDataUrl,
      "PNG",
      logoX,
      logoY,
      logoSize,
      logoSize
    );
  }

  const separatorX =
    logoX + logoSize + 6;

  doc.setDrawColor(
    70,
    70,
    75
  );

  doc.setLineWidth(0.3);

  doc.line(
    separatorX,
    7,
    separatorX,
    20
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(9);

  doc.setTextColor(
    ...COLORS.white
  );

  doc.text(
    "Lucratus Agency",
    separatorX + 6,
    13
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6);

  doc.setTextColor(
    155,
    155,
    160
  );

  doc.text(
    "META ADS PERFORMANCE",
    separatorX + 6,
    18
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(
    ...COLORS.white
  );

  doc.text(
    title,
    pageWidth - 16,
    13,
    {
      align: "right",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6);

  doc.setTextColor(
    150,
    150,
    155
  );

  doc.text(
    clientName,
    pageWidth - 16,
    19,
    {
      align: "right",
    }
  );
}

function drawMetricCard(doc, x, y, width, height, label, value, dark = false) {
  if (dark) {
    doc.setFillColor(...COLORS.black);
  } else {
    doc.setFillColor(...COLORS.light);
  }

  doc.roundedRect(x, y, width, height, 3, 3, "F");

  doc.setFont("helvetica", "normal");

  doc.setFontSize(7);

  if (dark) {
    doc.setTextColor(165, 165, 165);
  } else {
    doc.setTextColor(...COLORS.muted);
  }

  doc.text(label, x + 5, y + 8);

  doc.setFont("helvetica", "bold");

  doc.setFontSize(value.length > 14 ? 8.5 : 11);

  if (dark) {
    doc.setTextColor(...COLORS.white);
  } else {
    doc.setTextColor(...COLORS.text);
  }

  doc.text(value, x + 5, y + 20);
}

function drawSectionTitle(doc, title, x, y) {
  doc.setFont("helvetica", "bold");

  doc.setFontSize(12);

  doc.setTextColor(...COLORS.text);

  doc.text(title, x, y);
}

function drawTwoColumnMetrics(doc, metrics, margin, y, pageWidth) {
  const gap = 4;

  const width = (pageWidth - margin * 2 - gap) / 2;

  metrics.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);

    const x = margin + column * (width + gap);

    const currentY = y + row * 16;

    doc.setFont("helvetica", "normal");

    doc.setFontSize(8);

    doc.setTextColor(...COLORS.muted);

    doc.text(label, x, currentY);

    doc.setFont("helvetica", "bold");

    doc.setTextColor(...COLORS.text);

    doc.text(value, x + width, currentY, {
      align: "right",
    });

    doc.setDrawColor(...COLORS.border);

    doc.line(x, currentY + 4, x + width, currentY + 4);
  });
}

function buildFindings(totals, campaigns) {
  const findings = [];

  findings.push(
    `The campaign generated ${formatNumber(
      totals.impressions,
    )} impressions and reached ${formatNumber(
      totals.reach,
    )} people during the reporting period.`,
  );

  findings.push(
    `The overall click-through rate was ${formatPercent(
      totals.ctr,
    )}, with an average CPC of ${formatRupiah(totals.cpc)}.`,
  );

  if (totals.atc > 0) {
    findings.push(
      `The campaign recorded ${formatNumber(
        totals.atc,
      )} Add To Cart actions at an average cost of ${formatRupiah(
        totals.costPerAtc,
      )}.`,
    );
  } else {
    findings.push(
      "No Add To Cart activity was recorded in the reporting period.",
    );
  }

  if (totals.orders > 0) {
    findings.push(
      `The business recorded ${formatNumber(
        totals.orders,
      )} orders from ${formatNumber(totals.qualifiedLeads)} qualified leads.`,
    );
  } else {
    findings.push(
      "No business orders were recorded in the available client result data.",
    );
  }

  if (campaigns.length > 0) {
    const topCampaign = [...campaigns].sort(
      (a, b) => Number(b.spend || 0) - Number(a.spend || 0),
    )[0];

    findings.push(
      `The highest-spend campaign was "${topCampaign.campaignName || "-"}", accounting for ${formatPercent(
        topCampaign.budgetShare,
      )} of total ad spend.`,
    );
  }

  return findings;
}

function buildNextActions(totals, campaigns) {
  const actions = [];

  if (Number(totals.ctr || 0) < 1) {
    actions.push(
      "Review creative hooks and messaging to improve click-through performance.",
    );
  } else {
    actions.push(
      "Continue monitoring creative performance and identify the ads generating the strongest click response.",
    );
  }

  if (Number(totals.frequency || 0) > 3) {
    actions.push(
      "Monitor audience fatigue because frequency is relatively high for the reporting period.",
    );
  } else {
    actions.push(
      "Continue monitoring frequency as spend scales to ensure audience saturation does not increase unnecessarily.",
    );
  }

  if (Number(totals.atc || 0) === 0) {
    actions.push(
      "Investigate the post-click experience and conversion path before increasing spend aggressively.",
    );
  } else {
    actions.push(
      "Identify campaigns and creatives contributing to Add To Cart activity and consider reallocating budget based on sustained performance.",
    );
  }

  if (Number(totals.orders || 0) === 0) {
    actions.push(
      "Improve downstream lead handling and conversion tracking so advertising performance can be evaluated against actual business outcomes.",
    );
  } else {
    actions.push(
      "Compare advertising results with sales outcomes to determine where additional budget can be deployed efficiently.",
    );
  }

  return actions;
}

function addFooter(doc, pageNumber) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  doc.setDrawColor(
    ...COLORS.border
  );

  doc.line(
    16,
    pageHeight - 14,
    pageWidth - 16,
    pageHeight - 14
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7);

  doc.setTextColor(
    ...COLORS.muted
  );

  doc.text(
    "Lucratus Agency  ·  Meta Ads Performance Reporting",
    16,
    pageHeight - 8
  );

  doc.text(
    `Page ${pageNumber}`,
    pageWidth - 16,
    pageHeight - 8,
    {
      align: "right",
    }
  );
}
