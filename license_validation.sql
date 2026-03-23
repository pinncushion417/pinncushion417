-- ============================================================
-- License Validation: Add to BOTH CASE statements
-- Rule: If any part of ProviderLicenses is NULL or empty string
--       ("NO VALUE SPECIFIED"), flag as Fail with 'Missing License #'
-- ============================================================

-- [ProviderLicenses] is built from three Cact columns:
--   Cact.StateLicenseNumber   (state license number)
--   Cact.StateLicenseState    (state)
--   Cact.StateLicenseStatus   (state status)

-- ============================================================
-- 1) In the Result CASE statement
--    Add this WHEN block BEFORE the existing: ELSE 'Pass'
-- ============================================================
/*
    WHEN NULLIF(LTRIM(RTRIM(Cact.StateLicenseNumber)), '') IS NULL
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseState)), '') IS NULL
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseStatus)), '') IS NULL
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
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseState)), '') IS NULL
        OR NULLIF(LTRIM(RTRIM(Cact.StateLicenseStatus)), '') IS NULL
        THEN 'Missing License #'
    ELSE 'No Error'
END
*/

-- ============================================================
-- NOTES:
--   NULLIF(LTRIM(RTRIM(col)), '') catches both:
--     - Actual NULL values
--     - Empty or whitespace-only strings (NO VALUE SPECIFIED)
--   This matches the spec: "If Value = NULL or NO VALUE SPECIFIED
--   place on Error Report"
-- ============================================================
