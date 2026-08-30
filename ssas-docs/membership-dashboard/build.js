const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip,
  TableOfContents, PageBreak
} = require("docx");

const PAGE_W = 12240, PAGE_H = 15840; // US Letter

const NAVY = "1F3864";
const ACCENT = "2E5395";
const LIGHT = "EDF2FA";
const GREY = "595959";

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
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 24 })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80, line: 264 },
    children: Array.isArray(text) ? text : [new TextRun({ text, size: 21, ...opts })],
  });
}

function label(text, rest) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80, line: 264 },
    children: [
      new TextRun({ text: text + " — ", bold: true, size: 21 }),
      new TextRun({ text: rest, size: 21 }),
    ],
  });
}

function cell(text, { header = false, width, shade, align } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { type: ShadingType.CLEAR, fill: shade } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: header,
            color: header ? "FFFFFF" : "000000",
            size: 19,
          }),
        ],
      }),
    ],
  });
}

// ---- Relationship table (fact -> dimension) ----
const relRows = [
  ["MemberEnrollmentFact", "EnterpriseMemberID", "MemberContact"],
  ["MemberEnrollmentFact", "EnterpriseMemberID", "MemberDemographics"],
  ["MemberEnrollmentFact", "EnterpriseMemberID", "MemberHeader"],
  ["MemberEnrollmentFact", "EligibilitySID", "MemberEligibility"],
  ["MemberEnrollmentFact", "ProductSID", "MemberProduct"],
  ["MemberEnrollmentFact", "PremiumHHSCSID", "PremiumHHSC"],
  ["MemberEnrollmentFact", "SofteonSID", "Softheon"],
  ["MemberEnrollmentFact", "HealthplanId", "CareMgtFlags"],
];

const relColWidths = [2900, 2100, 2900];
const relTable = new Table({
  width: { size: 7900, type: WidthType.DXA },
  columnWidths: relColWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Fact Table", { header: true, width: relColWidths[0], shade: NAVY }),
        cell("Join Key", { header: true, width: relColWidths[1], shade: NAVY }),
        cell("Dimension Table", { header: true, width: relColWidths[2], shade: NAVY }),
      ],
    }),
    ...relRows.map(([f, k, d], i) =>
      new TableRow({
        children: [
          cell(f, { width: relColWidths[0], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(k, { width: relColWidths[1], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(d, { width: relColWidths[2], shade: i % 2 ? LIGHT : "FFFFFF" }),
        ],
      })
    ),
  ],
});

// ---- Dimension table description ----
const dimRows = [
  ["MemberEnrollmentFact", "FACT", "Grain: one row per member enrollment segment. Carries FKs to all 8 dimensions plus MemberMonths, coverage/rate codes, and a calculated Year column."],
  ["MemberContact", "Dimension", "Mailing/physical address, phone, email. Computed Top20CountyFlag (Houston-area service region flag)."],
  ["MemberDemographics", "Dimension", "Name, DOB/DOD, gender, ethnicity, deceased flag. Computed MemberAge, Age_Cat age bands, and 65/26 aging countdowns."],
  ["MemberHeader", "Dimension", "Cross-system member identifiers: QNXT, Salesforce Contact ID, SSN, MBI, HIC."],
  ["MemberEligibility", "Dimension + Measures", "Enrollment effective/termination dates, rate/coverage codes. Computed TenureGroup, ActivEnroll, PlanExpires90. Hosts the model's only DAX measures (member-movement waterfall)."],
  ["MemberProduct", "Dimension", "Plan/product attributes: Line of Business, Company, Metal Tier, ACA plan/network type, HHSC rate code hierarchy, subsidy flags."],
  ["PremiumHHSC", "Dimension", "Premium amounts and HHSC delivery/payment program (DPP) breakdowns, current and prior period."],
  ["Softheon", "Dimension", "ACA marketplace/exchange enrollment detail: APTC, broker info, SEP, transaction/termination reasons."],
  ["CareMgtFlags", "Dimension", "Diabetes/ESRD/CHF condition flags, pivoted per member from a care-management source."],
];

const dimColWidths = [2100, 1500, 4300];
const dimTable = new Table({
  width: { size: 7900, type: WidthType.DXA },
  columnWidths: dimColWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Table", { header: true, width: dimColWidths[0], shade: NAVY }),
        cell("Role", { header: true, width: dimColWidths[1], shade: NAVY }),
        cell("Contents", { header: true, width: dimColWidths[2], shade: NAVY }),
      ],
    }),
    ...dimRows.map(([t, r, c], i) =>
      new TableRow({
        children: [
          cell(t, { width: dimColWidths[0], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(r, { width: dimColWidths[1], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(c, { width: dimColWidths[2], shade: i % 2 ? LIGHT : "FFFFFF" }),
        ],
      })
    ),
  ],
});

// ---- Measures table ----
const measureRows = [
  ["StartingMembers", "Distinct members whose eligibility spans the period before the reporting month begins."],
  ["NewMembers", "Distinct members newly effective within the reporting month."],
  ["EndingMembers", "Distinct members still eligible at the end of the reporting month."],
  ["TermedMembers", "Distinct members terminated within the reporting month."],
  ["TotalMembers", "Distinct members eligible at any point that spans the reporting month."],
  ["TotalLossGain", "EndingMembers − StartingMembers (net monthly change)."],
  ["IncomingPct / OutgoingPct", "New / Termed members as a percentage of StartingMembers."],
  ["WaterfallMembersView", "SWITCH measure: shows EndingMembers on the first/last month of the selection, and TotalLossGain for months in between — built for a membership waterfall chart."],
  ["Mem_1stDayMon", "Distinct members eligible as of the first day of the reporting month."],
];

const measColWidths = [2600, 5300];
const measTable = new Table({
  width: { size: 7900, type: WidthType.DXA },
  columnWidths: measColWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Measure (on MemberEligibility)", { header: true, width: measColWidths[0], shade: NAVY }),
        cell("Purpose", { header: true, width: measColWidths[1], shade: NAVY }),
      ],
    }),
    ...measureRows.map(([m, d], i) =>
      new TableRow({
        children: [
          cell(m, { width: measColWidths[0], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(d, { width: measColWidths[1], shade: i % 2 ? LIGHT : "FFFFFF" }),
        ],
      })
    ),
  ],
});

// ---- Roles table ----
const roleRows = [
  ["db_owner", "Administrator", "CHCHEALTH\\DB-FDP-ANA", "Full model admin (design, process, read)."],
  ["Process", "Refresh", "CHCHEALTH\\DB-FDP-ANA", "Refresh/processing only — the ETL/service account."],
  ["ReadAll", "Read", "Everyone", "Unrestricted read access — no row-level security filters are applied."],
];
const roleColWidths = [1600, 1700, 2200, 2400];
const roleTable = new Table({
  width: { size: 7900, type: WidthType.DXA },
  columnWidths: roleColWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Role", { header: true, width: roleColWidths[0], shade: NAVY }),
        cell("Permission", { header: true, width: roleColWidths[1], shade: NAVY }),
        cell("Member(s)", { header: true, width: roleColWidths[2], shade: NAVY }),
        cell("Notes", { header: true, width: roleColWidths[3], shade: NAVY }),
      ],
    }),
    ...roleRows.map(([r, p_, m, n], i) =>
      new TableRow({
        children: [
          cell(r, { width: roleColWidths[0], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(p_, { width: roleColWidths[1], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(m, { width: roleColWidths[2], shade: i % 2 ? LIGHT : "FFFFFF" }),
          cell(n, { width: roleColWidths[3], shade: i % 2 ? LIGHT : "FFFFFF" }),
        ],
      })
    ),
  ],
});

function calloutBox(title, lines) {
  return new Table({
    width: { size: 7900, type: WidthType.DXA },
    columnWidths: [7900],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 7900, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "FFF4E5" },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "E8A33D" },
            },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: title, bold: true, color: "8A5A00", size: 21 })],
              }),
              ...lines.map(
                (t) =>
                  new Paragraph({
                    numbering: { reference: "bullets", level: 0 },
                    spacing: { after: 60, line: 260 },
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
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      children: [
        // Title block
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: "Membership_Dashboard", bold: true, size: 44, color: NAVY })],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: "SSAS Tabular Model — Design Reference", size: 26, color: ACCENT })],
        }),
        new Paragraph({
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "Compatibility level 1200  ·  Data source: SqlServer EADWGOLD,1103 → EADW  ·  Culture: en-US",
              size: 19,
              color: GREY,
              italics: true,
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
          "Membership_Dashboard is a SQL Server Analysis Services Tabular model (compatibility level 1200), not a multidimensional OLAP cube. It follows a classic star schema: a single fact table, MemberEnrollmentFact, sits at the center with eight dimension tables connected directly to it — no snowflaking and no dimension-to-dimension relationships."
        ),
        p(
          "The model is sourced from a single declared connection (SqlServer EADWGOLD,1103 → EADW), though two partitions reach across linked servers inside their SQL text (see Section 5)."
        ),

        h1("2. Schema Type: Star Schema"),
        p("Fact table: MemberEnrollmentFact — grain is one row per member enrollment segment."),
        p("All eight dimensions attach only to the fact table (hub-and-spoke). Table roles and contents:"),
        dimTable,

        h1("3. Relationships"),
        p(
          "All eight relationships originate from MemberEnrollmentFact and use bidirectional cross-filtering (crossFilteringBehavior: bothDirections)."
        ),
        relTable,
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        calloutBox("Design note — bidirectional filtering", [
          "Every relationship allows filters to flow both ways between the fact and each dimension. This is convenient for slicing the fact table from any dimension, but it is also the most common cause of ambiguous filter-path errors in Tabular models.",
          "Currently safe because no two dimensions are connected to each other. If a future relationship links two of these dimensions directly, expect ambiguity errors or unintended cross-filtering — review before adding new relationships.",
        ]),

        h1("4. Measures (DAX)"),
        p(
          "The model's only defined measures live on MemberEligibility, forming a member-movement \"waterfall\" analysis. They resolve their reporting month using MIN/MAX(MemberEnrollmentFact[EnrollMonth]), so they rely on the MemberEnrollmentFact ↔ MemberEligibility relationship for time context even though they're stored on the eligibility table."
        ),
        measTable,

        h1("5. Notable Design Points"),
        label(
          "Member data is split across three dimensions",
          "MemberContact, MemberDemographics, and MemberHeader all key on EnterpriseMemberID rather than being one wide member table — likely separating PII/contact, demographic, and cross-system-ID concerns (or a legacy import artifact)."
        ),
        label(
          "Business logic lives in SQL, not DAX",
          "County flags, age bands, tenure buckets, APTC flags, and condition-flag pivots are computed in the native partition queries (M/SQL), not as DAX calculated columns."
        ),
        label(
          "Cross-server dependency",
          "MemberContact joins DRSVWHSQL01.RASTADATA.dbo.ZipCounty and CareMgtFlags reads from DRSVWHSQL01.MEDW.dbo.dim_ConditionFlags — both outside the declared EADW data source. The SSAS service account (Process role) needs read access to DRSVWHSQL01 for these two partitions to refresh successfully."
        ),
        label(
          "Single calculated column outside the dimensions",
          "MemberEnrollmentFact[Year] is a DAX calculated column (YEAR(MemberEnrollmentFact[EnrollMonth])) — the only DAX calculated column in the model; everything else is computed upstream in SQL."
        ),

        h1("6. Security Roles"),
        p("Access is controlled by static roles — there is no row-level security (RLS) filter expression defined anywhere in the model."),
        roleTable,
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        calloutBox("Security note", [
          "The ReadAll role grants read access to Everyone with no RLS row filter. Any sensitive fields (SSN, MBI, HIC, DOB, address) in MemberHeader, MemberDemographics, and MemberContact are visible to all readers of this model.",
        ]),

        h1("7. Quick Reference Summary"),
        bullet("Model type: SSAS Tabular (compatibility level 1200)"),
        bullet("Pattern: Star schema — 1 fact table, 8 dimensions, all bidirectional relationships"),
        bullet("Fact table: MemberEnrollmentFact"),
        bullet("Measures: defined only on MemberEligibility (member movement / waterfall)"),
        bullet("External dependency: DRSVWHSQL01 (linked server) for 2 of 9 tables"),
        bullet("Security: role-based only, no RLS — ReadAll is open to Everyone"),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("Membership_Dashboard_Design.docx", buf);
  console.log("written");
});
