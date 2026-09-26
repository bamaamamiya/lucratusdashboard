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
  success: [22, 101, 52],
};

async function loadImageAsDataUrl(src) {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error("Failed to load logo");
  }

  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function generateInvoicePdf({
  invoice,
  client,
}) {
  if (!invoice) {
    throw new Error("Invoice data is required");
  }

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
    logoDataUrl = await loadImageAsDataUrl(
      "/images/logo/logo.png",
    );
  } catch (error) {
    console.warn(
      "Lucratus logo could not be loaded:",
      error,
    );
  }

  /*
  ============================================================
  HEADER
  ============================================================
  */

  drawInvoiceHeader(
    doc,
    logoDataUrl,
    invoice,
    pageWidth,
  );

  /*
  ============================================================
  INVOICE TITLE
  ============================================================
  */

  let y = 54;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.setTextColor(...COLORS.text);

  doc.text("INVOICE", margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);

  doc.text(
    invoice.invoiceNumber || "-",
    pageWidth - margin,
    y,
    {
      align: "right",
    },
  );

  /*
  ============================================================
  INVOICE META
  ============================================================
  */

  y += 12;

  const metaWidth = 78;

  drawLabelValue(
    doc,
    "Issue Date",
    formatDate(invoice.issueDate),
    margin,
    y,
  );

  drawLabelValue(
    doc,
    "Due Date",
    formatDate(invoice.dueDate),
    margin + metaWidth,
    y,
  );

  /*
  ============================================================
  BILL TO
  ============================================================
  */

  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);

  doc.text("BILL TO", margin, y);

  y += 7;

  const clientName =
    client?.businessName ||
    client?.name ||
    invoice.clientName ||
    "Client";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);

  doc.text(clientName, margin, y);

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);

  if (client?.email) {
    doc.text(client.email, margin, y);
    y += 5;
  }

  if (client?.phone || client?.whatsapp) {
    doc.text(
      client.phone || client.whatsapp,
      margin,
      y,
    );
    y += 5;
  }

  if (client?.address) {
    const addressLines = doc.splitTextToSize(
      client.address,
      80,
    );

    doc.text(addressLines, margin, y);

    y += addressLines.length * 4;
  }

  /*
  ============================================================
  PERIOD
  ============================================================
  */

  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);

  doc.text("Billing Period", margin, y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);

  doc.text(
    invoice.period || "-",
    margin + 30,
    y,
  );

  /*
  ============================================================
  ITEMS
  ============================================================
  */

  y += 12;

  const items = Array.isArray(invoice.items)
    ? invoice.items
    : [];

  autoTable(doc, {
    startY: y,

    margin: {
      left: margin,
      right: margin,
    },

    head: [
      [
        "Description",
        "Amount",
      ],
    ],

    body: items.length
      ? items.map((item) => [
          item.description || "-",
          formatRupiah(item.amount),
        ])
      : [
          [
            "Invoice",
            formatRupiah(invoice.total),
          ],
        ],

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 5,
      textColor: COLORS.text,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      valign: "middle",
    },

    headStyles: {
      fillColor: COLORS.dark,
      textColor: COLORS.white,
      fontStyle: "bold",
    },

    columnStyles: {
      0: {
        cellWidth: 120,
      },

      1: {
        halign: "right",
      },
    },

    alternateRowStyles: {
      fillColor: [249, 249, 250],
    },
  });

  y = doc.lastAutoTable.finalY + 12;

  /*
  ============================================================
  TOTALS
  ============================================================
  */

  const totalsX = pageWidth - margin - 70;
  const totalsValueX = pageWidth - margin;

  drawTotalRow(
    doc,
    "Subtotal",
    formatRupiah(invoice.subtotal),
    totalsX,
    totalsValueX,
    y,
  );

  y += 8;

  drawTotalRow(
    doc,
    "Total",
    formatRupiah(invoice.total),
    totalsX,
    totalsValueX,
    y,
    true,
  );

  y += 11;

  drawTotalRow(
    doc,
    "Amount Paid",
    formatRupiah(invoice.amountPaid),
    totalsX,
    totalsValueX,
    y,
  );

  y += 8;

  drawTotalRow(
    doc,
    "Outstanding",
    formatRupiah(invoice.outstanding),
    totalsX,
    totalsValueX,
    y,
    true,
  );

  /*
  ============================================================
  STATUS
  ============================================================
  */

  y += 18;

  drawStatus(
    doc,
    invoice.status,
    margin,
    y,
  );

  /*
  ============================================================
  NOTES
  ============================================================
  */

  if (invoice.notes) {
    y += 28;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);

    doc.text("Notes", margin, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);

    const notesLines = doc.splitTextToSize(
      invoice.notes,
      pageWidth - margin * 2,
    );

    doc.text(notesLines, margin, y);
  }

  /*
  ============================================================
  PAYMENT INFORMATION
  ============================================================
  */

  const paymentY = Math.min(
    pageHeight - 55,
    Math.max(y + 18, 210),
  );

  doc.setFillColor(...COLORS.light);

  doc.roundedRect(
    margin,
    paymentY,
    pageWidth - margin * 2,
    25,
    3,
    3,
    "F",
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);

  doc.text(
    "Payment Information",
    margin + 7,
    paymentY + 9,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);

  doc.text(
    "Please reference the invoice number when making payment.",
    margin + 7,
    paymentY + 16,
  );

  /*
  ============================================================
  FOOTER
  ============================================================
  */

  addFooter(doc);

  /*
  ============================================================
  DOWNLOAD
  ============================================================
  */

  const safeClientName = clientName
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();

  const invoiceNumber =
    invoice.invoiceNumber || "invoice";

  doc.save(
    `lucratusagency-${invoiceNumber}-${safeClientName}.pdf`,
  );
}

/*
============================================================
HEADER
============================================================
*/

function drawInvoiceHeader(
  doc,
  logoDataUrl,
  invoice,
  pageWidth,
) {
  doc.setFillColor(...COLORS.black);

  doc.rect(
    0,
    0,
    pageWidth,
    40,
    "F",
  );

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
      logoSize,
    );
  }

  const separatorX =
    logoX + logoSize + 7;

  doc.setDrawColor(
    75,
    75,
    80,
  );

  doc.setLineWidth(0.35);

  doc.line(
    separatorX,
    9,
    separatorX,
    24,
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(11);

  doc.setTextColor(
    ...COLORS.white,
  );

  doc.text(
    "Lucratus Agency",
    separatorX + 7,
    16,
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(6.5);

  doc.setTextColor(
    160,
    160,
    165,
  );

  doc.text(
    "META ADS MANAGEMENT",
    separatorX + 7,
    22,
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(8);

  doc.setTextColor(
    ...COLORS.white,
  );

  doc.text(
    invoice.invoiceNumber || "INVOICE",
    pageWidth - 16,
    16,
    {
      align: "right",
    },
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(6.5);

  doc.setTextColor(
    145,
    145,
    150,
  );

  doc.text(
    "OFFICIAL BILLING DOCUMENT",
    pageWidth - 16,
    22,
    {
      align: "right",
    },
  );

  doc.setDrawColor(
    45,
    45,
    48,
  );

  doc.setLineWidth(0.25);

  doc.line(
    16,
    32,
    pageWidth - 16,
    32,
  );
}

/*
============================================================
HELPERS
============================================================
*/

function drawLabelValue(
  doc,
  label,
  value,
  x,
  y,
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);

  doc.text(label, x, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);

  doc.text(value, x, y + 6);
}

function drawTotalRow(
  doc,
  label,
  value,
  labelX,
  valueX,
  y,
  emphasized = false,
) {
  doc.setFont(
    "helvetica",
    emphasized ? "bold" : "normal",
  );

  doc.setFontSize(
    emphasized ? 10 : 8,
  );

  doc.setTextColor(
    ...(emphasized
      ? COLORS.text
      : COLORS.muted),
  );

  doc.text(
    label,
    labelX,
    y,
  );

  doc.setTextColor(
    ...COLORS.text,
  );

  doc.text(
    value,
    valueX,
    y,
    {
      align: "right",
    },
  );

  if (emphasized) {
    doc.setDrawColor(
      ...COLORS.border,
    );

    doc.line(
      labelX,
      y - 5,
      valueX,
      y - 5,
    );
  }
}

function drawStatus(
  doc,
  status,
  x,
  y,
) {
  const normalized =
    String(status || "unpaid")
      .toLowerCase();

  let label = "UNPAID";

  if (normalized === "paid") {
    label = "PAID";
  } else if (normalized === "partial") {
    label = "PARTIALLY PAID";
  } else if (normalized === "overdue") {
    label = "OVERDUE";
  }

  doc.setFillColor(...COLORS.light);

  doc.roundedRect(
    x,
    y,
    35,
    11,
    2,
    2,
    "F",
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  doc.setTextColor(
    ...COLORS.text,
  );

  doc.text(
    label,
    x + 17.5,
    y + 7,
    {
      align: "center",
    },
  );
}

function addFooter(doc) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  doc.setDrawColor(
    ...COLORS.border,
  );

  doc.line(
    16,
    pageHeight - 14,
    pageWidth - 16,
    pageHeight - 14,
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(7);

  doc.setTextColor(
    ...COLORS.muted,
  );

  doc.text(
    "Lucratus Agency  ·  Invoice",
    16,
    pageHeight - 8,
  );

  doc.text(
    "lucratusagency",
    pageWidth - 16,
    pageHeight - 8,
    {
      align: "right",
    },
  );
}