-- ============================================================
-- Column BG - PCPAcceptingNewPatients
--
-- SPEC:
--   Value = Y  if Cactus/MDM has Open Panel OR Accepting New Patients
--              AND Column BF (PCPFlag) = Y
--   Value = N  if provider record has Closed Panel OR Not Accepting New Patients
--              → set N and EXCLUDE from Submission File
--
-- ERROR CATEGORY: PCP Not Accepting New Patients
-- ============================================================

-- ============================================================
-- CORRECTED CASE statement for [PCPAcceptingNewPatients]
-- ============================================================
/*
    CASE
        WHEN (
                prap.PanelStatusCode = 'Open Panel'
             OR prap.PanelStatusCode = 'Accepting New Patients'
             )
             AND PRP.PCPFlag = 'Y'
        THEN 'Y'
        ELSE 'N'
    END AS [PCPAcceptingNewPatients]
*/

-- ============================================================
-- EXCLUSION from Submission File
-- Add this to the WHERE clause (or a wrapping filter) to
-- exclude records where PCPAcceptingNewPatients = N
-- ============================================================
/*
    -- In WHERE clause:
    AND NOT (
        prap.PanelStatusCode IN ('Closed Panel', 'Not Accepting New Patients')
    )

    -- OR equivalently, filter after computing the column:
    WHERE [PCPAcceptingNewPatients] = 'Y'
*/

-- ============================================================
-- WHAT CHANGED vs. the old query:
--
--   REMOVED:
--     - Inner CASE checking SPCODE.[Name] IN ('Family Medicine', ...)
--       That specialty list check belongs to a different column,
--       not to PCPAcceptingNewPatients.
--
--   ADDED:
--     - OR prap.PanelStatusCode = 'Accepting New Patients'
--       (spec requires Open Panel OR Accepting New Patients)
--
--     - AND PRP.PCPFlag = 'Y'
--       (spec requires column BF = Y as a second condition)
--
--   UNCHANGED:
--     - ELSE 'N' END  (Closed Panel / Not Accepting → N)
-- ============================================================
