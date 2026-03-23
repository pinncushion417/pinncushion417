-- ============================================================
-- Column BG - PCPAcceptingNewPatients
--
-- SPEC:
--   Value = Y  if PanelStatusCode = 'Open Panel'
--              AND Column BF (PCPStatus / specialty list) = Y
--   Value = N  otherwise → EXCLUDE from Submission File
--
-- "Column BF" = [PCPStatus], which is Y when SPCODE.[Name]
--   is in the approved specialty list.
--
-- ERROR CATEGORY: PCP Not Accepting New Patients
-- ============================================================

-- ============================================================
-- CORRECTED CASE statement for [PCPAcceptingNewPatients]
-- ============================================================
/*
    , [PCPAcceptingNewPatients]
        = CASE
            WHEN prap.PanelStatusCode = 'Open Panel'
                 AND SPCODE.[Name] IN (
                     'Family Medicine',
                     'Family Medicine~',
                     'Gynecology',
                     'Geriatrics',
                     'General Practice',
                     'Obstetrics',
                     'Obstetrics and Gynecology',
                     'Internal Medicine',
                     'Pediatrics',
                     'Genetics',
                     'Maternal and Fetal Medicine',
                     'Maternal and Fetal Medicine~',
                     'Clinic / Group Practice',
                     'Federally Qualified Health Centers (FQHC)',
                     'Rural Health Clinic (Provider) for Hospital Based RHCs',
                     'Clinical Nurse Specialist',
                     'Clinical Nurse Specialist~',
                     'Physicians Assistant',
                     'Physicians Assistant~'
                 )
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
    AND SPCODE.[Name] IN (
        'Family Medicine', 'Family Medicine~', 'Gynecology', ...
    )
*/
