-- ============================================================
-- License Validation: Add to BOTH CASE statements
-- Rule: If any part of ProviderLicenses is NULL, empty, or
--       contains the literal text 'NO VALUE SPECIFIED',
--       flag as Fail with error category 'Missing License #'
-- ============================================================

-- [ProviderLicenses] is built from three Cact columns:
--   Cact.StateLicenseNumber   (state license number)
--   Cact.StateLicenseState    (state)
--   Cact.StateLicenseStatus   (state status)

-- Helper: this pattern is used for each column to catch all 3 cases:
--   NULLIF(LTRIM(RTRIM(col)), '') IS NULL       --> catches NULL and empty/whitespace
--   UPPER(LTRIM(RTRIM(col))) = 'NO VALUE SPECIFIED'  --> catches literal text value

-- ============================================================
-- 1) In the Result CASE statement
--    Add this WHEN block BEFORE the existing: ELSE 'Pass'
-- ============================================================
/*
    WHEN NULLIF(LTRIM(RTRIM(Cact.StateLicenseNumber)), '') IS NULL
        OR UPPER(LTRIM(RTRIM(Cact.StateLicenseNumber))) = 'NO VALUE SPECIFIED'
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseState)), '') IS NULL
        OR UPPER(LTRIM(RTRIM(Cact.StateLicenseState))) = 'NO VALUE SPECIFIED'
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseStatus)), '') IS NULL
        OR UPPER(LTRIM(RTRIM(Cact.StateLicenseStatus))) = 'NO VALUE SPECIFIED'
        THEN 'Fail'
    ELSE 'Pass'
END
*/

-- ============================================================
-- 2) In the ErrorCategory CASE statement
--    Add this WHEN block BEFORE the existing: ELSE 'No Error'
-- ============================================================
/*
    WHEN NULLIF(LTRIM(RTRIM(Cact.StateLicenseNumber)), '') IS NULL
        OR UPPER(LTRIM(RTRIM(Cact.StateLicenseNumber))) = 'NO VALUE SPECIFIED'
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseState)), '') IS NULL
        OR UPPER(LTRIM(RTRIM(Cact.StateLicenseState))) = 'NO VALUE SPECIFIED'
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseStatus)), '') IS NULL
        OR UPPER(LTRIM(RTRIM(Cact.StateLicenseStatus))) = 'NO VALUE SPECIFIED'
        THEN 'Missing License #'
    ELSE 'No Error'
END
*/

-- ============================================================
-- WHAT EACH CHECK CATCHES:
--
--   NULLIF(LTRIM(RTRIM(col)), '') IS NULL
--     - col is NULL
--     - col is '' (empty string)
--     - col is '   ' (spaces only)
--
--   UPPER(LTRIM(RTRIM(col))) = 'NO VALUE SPECIFIED'
--     - col is 'NO VALUE SPECIFIED' (any casing, with/without spaces)
--
-- All three columns must pass for the record to avoid this error.
-- ============================================================
