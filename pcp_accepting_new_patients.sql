-- ============================================================
-- Column BG - PCPAcceptingNewPatients
--
-- SPEC:
--   Value = Y  if PanelStatusCode = 'Open Panel' AND PCPFlag = 'Y'
--   Value = N  if PanelStatusCode = 'Closed Panel', 'No Value Specified', or NULL
--              → set N and EXCLUDE from Submission File
--
-- NOTE: [PCPStatus] (the column above this one) correctly uses the
--       specialty list (SPCODE.[Name] IN ...). Do NOT copy that logic here.
--
-- ERROR CATEGORY: PCP Not Accepting New Patients
-- ============================================================

-- ============================================================
-- ACTUAL PanelStatusCode values in the data (verified):
--   1. No Value Specified
--   2. Closed Panel
--   3. NULL
--   4. Open Panel
--
-- NOTE: 'Accepting New Patients' does NOT exist as a value.
--       Only 'Open Panel' qualifies for Y.
-- ============================================================

-- ============================================================
-- CORRECTED CASE statement for [PCPAcceptingNewPatients]
-- ============================================================
/*
    CASE
        WHEN prap.PanelStatusCode = 'Open Panel'
             AND PRP.PCPFlag = 'Y'
        THEN 'Y'
        ELSE 'N'
    END AS [PCPAcceptingNewPatients]
*/

-- ============================================================
-- EXCLUSION from Submission File
-- Records where PCPAcceptingNewPatients = N must be excluded.
-- These are records where PanelStatusCode is:
--   'Closed Panel', 'No Value Specified', or NULL
-- ============================================================
/*
    -- Add to WHERE clause:
    AND prap.PanelStatusCode = 'Open Panel'
    AND PRP.PCPFlag = 'Y'
*/

-- ============================================================
-- WHAT CHANGED vs. the old query:
--
--   REMOVED:
--     - Inner CASE checking SPCODE.[Name] IN ('Family Medicine', ...)
--       That specialty list check belongs to a different column.
--     - OR prap.PanelStatusCode = 'Accepting New Patients'
--       That value does not exist in the data.
--
--   ADDED:
--     - AND PRP.PCPFlag = 'Y'
--       (spec requires column BF = Y as a second condition)
--
--   UNCHANGED:
--     - ELSE 'N' END  (Closed Panel / No Value Specified / NULL → N)
-- ============================================================
