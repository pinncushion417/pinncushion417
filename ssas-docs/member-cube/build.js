const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip,
  TableOfContents, PageBreak
} = require("docx");

const PAGE_W = 12240, PAGE_H = 15840; // US Letter
const NAVY = "1F3864", ACCENT = "2E5395", LIGHT = "EDF2FA", GREY = "595959";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { color: NAVY, space: 4, style: BorderStyle.SINGLE, size: 8 } },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 30 })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 23 })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 160, line: 276 }, children: [new TextRun({ text, size: 21, ...opts })] });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 70, line: 260 },
    children: [new TextRun({ text, size: 21 })],
  });
}
function label(text, rest) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 90, line: 260 },
    children: [new TextRun({ text: text + " — ", bold: true, size: 21 }), new TextRun({ text: rest, size: 21 })],
  });
}
function cell(text, { header = false, width, shade, align, size = 19 } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { type: ShadingType.CLEAR, fill: shade } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align || AlignmentType.LEFT,
        children: [new TextRun({ text, bold: header, color: header ? "FFFFFF" : "000000", size })],
      }),
    ],
  });
}
function dataTable(headers, rows, widths) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { header: true, width: widths[i], shade: NAVY })),
      }),
      ...rows.map(
        (r, i) =>
          new TableRow({
            children: r.map((v, j) => cell(v, { width: widths[j], shade: i % 2 ? LIGHT : "FFFFFF" })),
          })
      ),
    ],
  });
}
function calloutBox(title, lines) {
  return new Table({
    width: { size: 8600, type: WidthType.DXA },
    columnWidths: [8600],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 8600, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "FFF4E5" },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
            },
            children: [
              new Paragraph({ spacing: { after: 70 }, children: [new TextRun({ text: title, bold: true, color: "8A5A00", size: 21 })] }),
              ...lines.map(
                (t) =>
                  new Paragraph({
                    numbering: { reference: "bullets", level: 0 },
                    spacing: { after: 60, line: 256 },
                    children: [new TextRun({ text: t, size: 20 })],
                  })
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------- content ----------

const categoryRows = [
  ["Fact / bridge", "MemberMonth, Claim, ClaimDetail, Enrollment, EnrollmentMonths, Calls, CaseManagement, MemberAuths, ClaimAuths, LabResults", "Transactional / event-grain tables: claims, enrollment segments, member-month bridge, member services calls, case management activity, authorizations, lab results."],
  ["Member", "Member, CurrentPCP, MemberRateCode, MemberCRG", "Core member attributes, current PCP assignment, rate code and clinical risk group (CRG) lookups."],
  ["Provider / network", "ClaimProvider, CallsProvider, ClaimPCP, EnrollmentPCP, ClaimTaxonomy, Contract", "Provider identity and taxonomy, plus point-in-time PCP-of-record captured separately for claims and for enrollment segments."],
  ["Clinical / code reference", "CPT, LabCPT, NDC, REV, ICD, ICD2, ICD3, POS, ClaimDRG, MemberCRG, EnrollMonthCRG, LabLOINC", "Procedure, drug, revenue, diagnosis, place-of-service, DRG, and risk-group code tables. ICD is role-played three times for primary/secondary/tertiary diagnosis."],
  ["Rate code", "ClaimRateCode, EnrollRateCode, MemberMonth_RateCode", "Rate/benefit code lookups joined at claim, enrollment, and member-month grain respectively."],
  ["Date (role-playing)", "MemberMonth, ClaimPaidDate, ClaimStartDate, CallDate, LabDate", "Five independent Year → Quarter → Month → Date calendars — one per fact table's relevant date — rather than one shared date dimension."],
];

const relRows = [
  ["Claim", "PK_ICD", "ICD", "1-way"],
  ["Claim", "PK_ICD2", "ICD2", "1-way"],
  ["Claim", "PK_ICD3", "ICD3", "1-way"],
  ["Claim", "PK_ContractID", "Contract", "1-way"],
  ["Claim", "PK_ProviderID", "ClaimProvider", "1-way"],
  ["Claim", "PK_MemberMonth", "MemberMonth", "1-way"],
  ["Claim", "PK_MemberID", "Member", "1-way"],
  ["Claim", "paiddate", "ClaimPaidDate", "1-way"],
  ["Claim", "startdate", "ClaimStartDate", "1-way"],
  ["Claim", "PK_RateCode", "ClaimRateCode", "1-way"],
  ["Claim", "ProviderTaxonomyCode", "ClaimTaxonomy", "1-way"],
  ["Claim", "PK_MemberMonth_RateCode", "MemberMonth_RateCode", "1-way"],
  ["Claim", "PK_EnrollID", "ClaimPCP", "1-way"],
  ["Claim", "PK_DRG", "ClaimDRG", "1-way"],
  ["Claim", "PK_AuthorizationID", "ClaimAuths", "1-way"],
  ["Claim", "NDC", "NDC", "1-way (active)"],
  ["ClaimDetail", "ProcedureCode", "CPT", "1-way"],
  ["ClaimDetail", "RevCode", "REV", "1-way"],
  ["ClaimDetail", "POS", "POS", "1-way"],
  ["ClaimDetail", "PK_ClaimID", "Claim", "Bi-directional"],
  ["ClaimDetail", "NDC", "NDC", "Inactive"],
  ["Enrollment", "RateCode", "EnrollRateCode", "1-way"],
  ["Enrollment", "PK_MemberID", "Member", "1-way"],
  ["Enrollment", "PK_EnrollID2", "EnrollmentPCP", "1-way"],
  ["EnrollmentMonths", "PK_EnrollID", "Enrollment", "1-way"],
  ["EnrollmentMonths", "PK_MemberMonth_RateCode", "MemberMonth_RateCode", "1-way"],
  ["EnrollmentMonths", "PK_MemberMonth", "MemberMonth", "1-way"],
  ["EnrollmentMonths", "CRG", "EnrollMonthCRG", "1-way"],
  ["Member", "RateCode", "MemberRateCode", "1-way"],
  ["Member", "PK_MemberID", "CurrentPCP", "Bi-directional"],
  ["Member", "CRG_Code", "MemberCRG", "1-way"],
  ["Calls", "PK_ProviderID", "CallsProvider", "1-way"],
  ["Calls", "PK_EnrollID", "Enrollment", "1-way"],
  ["Calls", "CallDate", "CallDate", "1-way"],
  ["MemberAuths", "PK_MemberID", "Member", "1-way"],
  ["CaseManagement", "PK_MemberID", "Member", "Bi-directional"],
  ["LabResults", "PK_MemberID", "Member", "1-way"],
  ["LabResults", "ProcedureCode", "LabCPT", "1-way"],
  ["LabResults", "LOINC", "LabLOINC", "1-way"],
  ["LabResults", "ServiceDate", "LabDate", "1-way"],
];

const measRows = [
  ["Member", "Member_MLR", "Medical loss ratio: DIVIDE(SUM(Claim[ClaimPaid]), SUM(EnrollmentMonths[Premium]))"],
  ["Member", "Member_PMPM", "Paid per member per month"],
  ["Claim", "Claim_GenericRate", "Share of Navitus pharmacy claims filled with a generic NDC"],
  ["ClaimDetail", "UnitCost", "Line paid ÷ line quantity"],
  ["Enrollment", "EnrollmentPremium", "SUM(EnrollmentMonths[Premium])"],
  ["EnrollmentMonths", "EnrollmentMonths_MemberMonths", "SUM(EnrollmentMonths[MemberMonth])"],
  ["EnrollmentMonths", "EnrollmentMonths_TotalPremium", "SUM(EnrollmentMonths[Premium])"],
  ["MemberMonth", "MLR", "Medical loss ratio incl. UHRIP paid"],
  ["MemberMonth", "PMPM", "Paid per member per month"],
  ["MemberMonth", "PaidDaysPerK", "Inpatient paid days per 1,000 member months"],
  ["MemberMonth", "ALOS", "Average length of stay"],
  ["MemberMonth", "TotalPremium / TotalPaid / TotalPaidDays", "Base sums used by the ratio measures above"],
  ["MemberMonth", "Encounters / EncountersPerK", "Distinct encounter count and rate per 1,000 member months"],
  ["MemberMonth", "EncountersPerK_ER / EncountersPerK_Inpatient", "Utilization rate filtered to ER / Inpatient claim type"],
  ["MemberMonth", "AvgClaimPaid / AvgPaidPerDay", "Average paid per claim and per paid day"],
  ["MemberMonth", "PMPM_YTD / PMPM_YTD_SPLY / PMPM_YTD_Variance", "Year-to-date PMPM, same-period-last-year, and the variance between them"],
  ["ClaimStartDate", "ClaimStartDate_ClaimPaid_YTD (+ SPLY, Variance)", "Year-to-date paid claims by service date, with prior-year comparison"],
];

const roleRows = [
  ["ReadAll", "Read", "Everyone", "Open read access — no row-level security filter defined."],
  ["Process", "Read + Refresh", "CHCHEALTH\\DB-FDP-ANA", "Service account used for scheduled processing."],
  ["db_owner", "Administrator", "CHCHEALTH\\DB-FDP-ANA", "Full model administration."],
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.28), hanging: convertInchesToTwip(0.18) } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: 1000, bottom: 1000, left: 950, right: 950 },
        },
      },
      children: [
        new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "MemberCube", bold: true, size: 44, color: NAVY })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "SSAS Tabular Model — Design Reference", size: 26, color: ACCENT })] }),
        new Paragraph({
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "Compatibility level 1500  ·  Data source: DRSVETLPSQL01 → CHC_STAR  ·  Culture: en-US",
              size: 19, color: GREY, italics: true,
            }),
          ],
        }),

        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Table of Contents", bold: true, color: NAVY, size: 26 })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-2",
        }),
        new Paragraph({ children: [new PageBreak()] }),

        h1("1. Overview"),
        p(
          "MemberCube is a SQL Server Analysis Services Tabular model (compatibility level 1500) built from a single relational source, CHC_STAR on DRSVETLPSQL01. It is a healthcare claims and utilization data warehouse: 38 tables, 40 relationships, and 27 DAX measures covering member eligibility, medical and pharmacy claims, provider/PCP assignment, authorizations, case management, lab results, and member services call activity."
        ),
        p(
          "Unlike a single-fact star schema, this model is a fact constellation (galaxy schema): several fact-grain tables — Claim, ClaimDetail, Enrollment, EnrollmentMonths, MemberMonth, Calls, CaseManagement, MemberAuths, ClaimAuths, and LabResults — each carry their own dimensions, and several of those fact tables also relate to each other."
        ),

        h1("2. Schema Type: Fact Constellation (Galaxy Schema)"),
        p("All 38 tables grouped by role:"),
        dataTable(
          ["Category", "Tables", "Purpose"],
          categoryRows,
          [1500, 3100, 4000]
        ),

        h1("3. Relationships"),
        p("40 relationships in total. 37 are single-direction (dimension filters the fact); three are bidirectional; one is stored inactive."),
        dataTable(
          ["From Table", "Key", "To Table", "Filter"],
          relRows,
          [2000, 2300, 2300, 2000]
        ),

        h1("4. Key Design Patterns"),
        label(
          "Duplicated hidden key columns for extra active relationships",
          "Tabular allows only one active relationship per column pair. To attach a table via two different paths simultaneously, the model duplicates the key as a second hidden column — Member.PK_MemberID2 (for CurrentPCP), MemberMonth.PK_MemberMonth2 (for EnrollmentMonths), and Enrollment.PK_EnrollID2 (for EnrollmentPCP) — rather than relying on an inactive relationship plus USERELATIONSHIP."
        ),
        label(
          "One true role-playing relationship: NDC",
          "ClaimDetail.NDC → NDC is stored inactive because Claim.NDC → NDC is already active on the same table. Any measure that needs the ClaimDetail-side NDC relationship must wrap the calculation in USERELATIONSHIP(ClaimDetail[NDC], NDC[NDC])."
        ),
        label(
          "Diagnosis codes are role-played three times",
          "Claim carries PK_ICD, PK_ICD2, and PK_ICD3, each relating to its own copy of the ICD table (ICD, ICD2, ICD3) — modeling primary, secondary, and tertiary diagnosis without a single shared ICD dimension."
        ),
        label(
          "PCP is tracked three separate ways",
          "CurrentPCP (bidirectional, off Member — today's assignment), ClaimPCP (off Claim via PK_EnrollID — PCP of record at time of claim), and EnrollmentPCP (off Enrollment via PK_EnrollID2 — PCP of record for the enrollment segment). This preserves point-in-time PCP history instead of only the current assignment."
        ),
        label(
          "Five independent date dimensions",
          "MemberMonth, ClaimPaidDate, ClaimStartDate, CallDate, and LabDate are each separate Year → Quarter → Month → Date hierarchies, rather than one shared calendar table joined multiple times. Time intelligence (TOTALYTD, SAMEPERIODLASTYEAR) is written per-table rather than centrally."
        ),
        label(
          "Claim is snowflaked to ClaimDetail",
          "ClaimDetail → Claim is the only fact-to-fact relationship besides the MemberMonth bridge, modeling claim header vs. claim line detail (bidirectional, so filters propagate either way)."
        ),
        label(
          "MemberMonth is the enrollment/claims bridge",
          "Both Claim and EnrollmentMonths relate to MemberMonth on a member+period key, making it the common grain that lets PMPM/MLR measures combine claims paid with premium and member-month counts from two otherwise-unrelated fact tables."
        ),
        label(
          "Self-contained data source",
          "Every partition query reads only from CHC_STAR — no cross-server or linked-server references were found in this model (unlike some sibling models in this environment that reach across servers)."
        ),

        h1("5. Measures (27 total)"),
        p("Grouped by hosting table. MemberMonth carries the bulk of the model's KPIs — standard health-plan metrics: MLR, PMPM, ALOS, utilization per 1,000, and YTD/prior-year variance."),
        dataTable(
          ["Table", "Measure(s)", "What it computes"],
          measRows,
          [1500, 2900, 4200]
        ),

        h1("6. Calculated Columns"),
        bullet("Claim.AgeOnDOS — INT(YEARFRAC(RELATED(Member[DOB]), Claim[startdate])) — member's age on the claim's date of service."),
        bullet("ClaimDetail.CostPerDay — IFERROR(LinePaid / DaysSupply, 0) — per-day cost for scripts/supplies with a days-supply quantity."),

        h1("7. Security Roles"),
        p("Same three-role pattern as the sibling Membership_Dashboard model — no row-level security expressions are defined anywhere in this model either."),
        dataTable(["Role", "Permission", "Member(s)", "Notes"], roleRows, [1500, 1900, 2200, 3000]),
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        calloutBox("Security note", [
          "ReadAll grants read access to Everyone with no RLS filter. Member, MemberAuths, CaseManagement, and LabResults contain clinical/PHI-adjacent data (diagnosis, authorizations, case management notes, lab results) visible to any reader of this model.",
        ]),

        h1("8. Quick Reference Summary"),
        bullet("Model type: SSAS Tabular, compatibility level 1500"),
        bullet("Pattern: Fact constellation / galaxy schema — 10 fact-grain tables, 28 dimension/reference tables"),
        bullet("Relationships: 40 total — 37 one-way, 3 bidirectional, 1 stored inactive (NDC role-play)"),
        bullet("Measures: 27, concentrated on MemberMonth (MLR, PMPM, utilization, YTD variance)"),
        bullet("Calculated columns: 2 (AgeOnDOS, CostPerDay)"),
        bullet("Date dimensions: 5 independent calendars (no shared date table)"),
        bullet("Data source: single source, CHC_STAR — no cross-server dependencies"),
        bullet("Security: role-based only, no RLS — ReadAll is open to Everyone"),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("MemberCube_Design.docx", buf);
  console.log("written");
});
