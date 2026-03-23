-- ============================================================
-- Column BG - PCPAcceptingNewPatients
--
-- SPEC:
--   Value = Y  if PanelStatusCode = 'Open Panel'
--   Value = N  if PanelStatusCode = 'Closed Panel', 'No Value Specified', or NULL
--              → set N and EXCLUDE from Submission File
--
-- ERROR CATEGORY: PCP Not Accepting New Patients
-- ============================================================

-- ============================================================
-- ACTUAL PanelStatusCode values in the data (verified):
--   1. No Value Specified  → N (exclude)
--   2. Closed Panel        → N (exclude)
--   3. NULL                → N (exclude)
--   4. Open Panel          → Y
-- ============================================================

-- ============================================================
-- CORRECTED CASE statement for [PCPAcceptingNewPatients]
-- ============================================================
/*
    , [PCPAcceptingNewPatients]
        = CASE
            WHEN prap.PanelStatusCode = 'Open Panel'
            THEN 'Y'
            ELSE 'N'
          END
*/

-- ============================================================
-- EXCLUSION from Submission File
-- Add to WHERE clause to exclude N records:
-- ============================================================
/*
    AND prap.PanelStatusCode = 'Open Panel'
*/

-- ============================================================
-- WHAT CHANGED vs. the old query:
--
--   REMOVED:
--     - Nested CASE checking SPCODE.[Name] IN ('Family Medicine', ...)
--       That specialty list belongs to [PCPStatus], not here.
--     - AND PRP.PCPFlag = 'Y'  (that column does not exist)
--
--   RESULT:
--     Open Panel = Y, everything else = N
-- ============================================================
