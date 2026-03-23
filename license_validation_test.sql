-- ============================================================
-- TEST SCRIPT for License Validation Logic
-- Run this in SSMS to verify all cases are caught correctly
-- ============================================================

WITH TestData AS (
    SELECT 'Test 1 - All valid'             AS TestName, 'LIC123'             AS StateLicenseNumber, 'TX'  AS StateLicenseState, 'Active'             AS StateLicenseStatus
    UNION ALL
    SELECT 'Test 2 - Number is NULL',                     NULL,                                       'TX',                     'Active'
    UNION ALL
    SELECT 'Test 3 - Number is empty string',             '',                                          'TX',                     'Active'
    UNION ALL
    SELECT 'Test 4 - Number is spaces only',              '   ',                                       'TX',                     'Active'
    UNION ALL
    SELECT 'Test 5 - Number is NO VALUE SPECIFIED',       'NO VALUE SPECIFIED',                        'TX',                     'Active'
    UNION ALL
    SELECT 'Test 6 - Number is no value specified (lower)','no value specified',                       'TX',                     'Active'
    UNION ALL
    SELECT 'Test 7 - State is NULL',                      'LIC123',                                    NULL,                     'Active'
    UNION ALL
    SELECT 'Test 8 - State is NO VALUE SPECIFIED',        'LIC123',                                    'NO VALUE SPECIFIED',     'Active'
    UNION ALL
    SELECT 'Test 9 - Status is NULL',                     'LIC123',                                    'TX',                     NULL
    UNION ALL
    SELECT 'Test 10 - Status is NO VALUE SPECIFIED',      'LIC123',                                    'TX',                     'NO VALUE SPECIFIED'
    UNION ALL
    SELECT 'Test 11 - All are NO VALUE SPECIFIED',        'NO VALUE SPECIFIED',                        'NO VALUE SPECIFIED',     'NO VALUE SPECIFIED'
    UNION ALL
    SELECT 'Test 12 - All are NULL',                      NULL,                                        NULL,                     NULL
)

SELECT
    TestName,
    StateLicenseNumber,
    StateLicenseState,
    StateLicenseStatus,

    -- Result CASE
    CASE
        WHEN NULLIF(LTRIM(RTRIM(StateLicenseNumber)), '') IS NULL
            OR UPPER(LTRIM(RTRIM(StateLicenseNumber))) = 'NO VALUE SPECIFIED'
            OR NULLIF(LTRIM(RTRIM(StateLicenseState)), '') IS NULL
            OR UPPER(LTRIM(RTRIM(StateLicenseState))) = 'NO VALUE SPECIFIED'
            OR NULLIF(LTRIM(RTRIM(StateLicenseStatus)), '') IS NULL
            OR UPPER(LTRIM(RTRIM(StateLicenseStatus))) = 'NO VALUE SPECIFIED'
            THEN 'Fail'
        ELSE 'Pass'
    END AS Result,

    -- ErrorCategory CASE
    CASE
        WHEN NULLIF(LTRIM(RTRIM(StateLicenseNumber)), '') IS NULL
            OR UPPER(LTRIM(RTRIM(StateLicenseNumber))) = 'NO VALUE SPECIFIED'
            OR NULLIF(LTRIM(RTRIM(StateLicenseState)), '') IS NULL
            OR UPPER(LTRIM(RTRIM(StateLicenseState))) = 'NO VALUE SPECIFIED'
            OR NULLIF(LTRIM(RTRIM(StateLicenseStatus)), '') IS NULL
            OR UPPER(LTRIM(RTRIM(StateLicenseStatus))) = 'NO VALUE SPECIFIED'
            THEN 'Missing License #'
        ELSE 'No Error'
    END AS ErrorCategory,

    -- Expected result for easy verification
    CASE
        WHEN TestName = 'Test 1 - All valid' THEN 'EXPECT: Pass / No Error'
        ELSE                                      'EXPECT: Fail / Missing License #'
    END AS Expected

FROM TestData
ORDER BY TestName;
