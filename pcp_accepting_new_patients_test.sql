-- ============================================================
-- TEST SCRIPT for PCPAcceptingNewPatients Logic
-- Run this in SSMS to verify all cases produce correct results
-- ============================================================

WITH TestData AS (

    -- Y cases: Open Panel + valid specialty
    SELECT 'Test 01 - Open Panel + Family Medicine'                           AS TestName, 'Open Panel' AS PanelStatusCode, 'Family Medicine'                                          AS SpecialtyName
    UNION ALL
    SELECT 'Test 02 - Open Panel + Family Medicine~',                                      'Open Panel',                    'Family Medicine~'
    UNION ALL
    SELECT 'Test 03 - Open Panel + Gynecology',                                            'Open Panel',                    'Gynecology'
    UNION ALL
    SELECT 'Test 04 - Open Panel + Geriatrics',                                            'Open Panel',                    'Geriatrics'
    UNION ALL
    SELECT 'Test 05 - Open Panel + General Practice',                                      'Open Panel',                    'General Practice'
    UNION ALL
    SELECT 'Test 06 - Open Panel + Obstetrics',                                            'Open Panel',                    'Obstetrics'
    UNION ALL
    SELECT 'Test 07 - Open Panel + Obstetrics and Gynecology',                             'Open Panel',                    'Obstetrics and Gynecology'
    UNION ALL
    SELECT 'Test 08 - Open Panel + Internal Medicine',                                     'Open Panel',                    'Internal Medicine'
    UNION ALL
    SELECT 'Test 09 - Open Panel + Pediatrics',                                            'Open Panel',                    'Pediatrics'
    UNION ALL
    SELECT 'Test 10 - Open Panel + Genetics',                                              'Open Panel',                    'Genetics'
    UNION ALL
    SELECT 'Test 11 - Open Panel + Maternal and Fetal Medicine',                           'Open Panel',                    'Maternal and Fetal Medicine'
    UNION ALL
    SELECT 'Test 12 - Open Panel + Maternal and Fetal Medicine~',                          'Open Panel',                    'Maternal and Fetal Medicine~'
    UNION ALL
    SELECT 'Test 13 - Open Panel + Clinic / Group Practice',                               'Open Panel',                    'Clinic / Group Practice'
    UNION ALL
    SELECT 'Test 14 - Open Panel + Federally Qualified Health Centers (FQHC)',             'Open Panel',                    'Federally Qualified Health Centers (FQHC)'
    UNION ALL
    SELECT 'Test 15 - Open Panel + Rural Health Clinic (Provider) for Hospital Based RHCs','Open Panel',                    'Rural Health Clinic (Provider) for Hospital Based RHCs'
    UNION ALL
    SELECT 'Test 16 - Open Panel + Clinical Nurse Specialist',                             'Open Panel',                    'Clinical Nurse Specialist'
    UNION ALL
    SELECT 'Test 17 - Open Panel + Clinical Nurse Specialist~',                            'Open Panel',                    'Clinical Nurse Specialist~'
    UNION ALL
    SELECT 'Test 18 - Open Panel + Physicians Assistant',                                  'Open Panel',                    'Physicians Assistant'
    UNION ALL
    SELECT 'Test 19 - Open Panel + Physicians Assistant~',                                 'Open Panel',                    'Physicians Assistant~'

    -- N cases: Open Panel but specialty NOT in list
    UNION ALL
    SELECT 'Test 20 - Open Panel + invalid specialty',                                     'Open Panel',                    'Cardiology'
    UNION ALL
    SELECT 'Test 21 - Open Panel + NULL specialty',                                        'Open Panel',                    NULL

    -- N cases: bad PanelStatusCode (regardless of specialty)
    UNION ALL
    SELECT 'Test 22 - Closed Panel + valid specialty',                                     'Closed Panel',                  'Family Medicine'
    UNION ALL
    SELECT 'Test 23 - No Value Specified + valid specialty',                               'No Value Specified',             'Family Medicine'
    UNION ALL
    SELECT 'Test 24 - NULL PanelStatusCode + valid specialty',                             NULL,                            'Family Medicine'
    UNION ALL
    SELECT 'Test 25 - Closed Panel + invalid specialty',                                   'Closed Panel',                  'Cardiology'
    UNION ALL
    SELECT 'Test 26 - NULL PanelStatusCode + NULL specialty',                              NULL,                            NULL

)

SELECT
    TestName,
    PanelStatusCode,
    SpecialtyName,

    -- The logic under test
    CASE
        WHEN PanelStatusCode = 'Open Panel'
             AND SpecialtyName IN (
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
    END AS PCPAcceptingNewPatients,

    -- Expected
    CASE
        WHEN TestName LIKE 'Test 0%' OR TestName LIKE 'Test 1[0-9]%'
        THEN 'EXPECT: Y'
        ELSE 'EXPECT: N'
    END AS Expected

FROM TestData
ORDER BY TestName;
