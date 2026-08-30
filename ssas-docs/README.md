# SSAS Tabular Model Design References

Word design-reference documents for two SSAS Tabular models, plus the Node.js
scripts (`docx` npm package) that generate them.

- `membership-dashboard/` — `Membership_Dashboard_Design.docx`, covering the
  `Membership_Dashboard` model (single-fact star schema, member enrollment
  dashboard).
- `member-cube/` — `MemberCube_Design.docx`, covering the `MemberCube` model
  (fact-constellation claims/utilization data warehouse, `CHC_STAR` source).

## Regenerating a document after editing `build.js`

```bash
cd ssas-docs/<folder>
npm install docx   # only needed once per environment
node build.js
```

Each `build.js` writes the `.docx` in place in the same folder.
