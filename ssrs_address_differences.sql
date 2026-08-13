-- ============================================================
-- SSRS Report: Address Differences Across Three Sources
--
-- DESIGN (one stored procedure, five steps):
--   1) Stage + standardize each source into its own temp table
--   2) Build a master ID list with UNION (all IDs from all sources)
--   3) LEFT JOIN each source back to the master list
--   4) Compare standardized values, flag the difference
--   5) Reload a permanent reporting table with a LoadDate stamp
--
-- SSRS reads the permanent table, NOT the three sources.
--
-- >>> PLACEHOLDERS: every <angle_bracket> name below must be
--     replaced with your real table / column names. Nothing here
--     assumes a schema you have not given me.
-- ============================================================


-- ============================================================
-- ONE-TIME: permanent reporting table
-- Truncate-and-reload each run, so it always holds one snapshot.
-- ============================================================
/*
CREATE TABLE dbo.rpt_AddressDifference
(
      EntityID          <your_id_datatype>  NOT NULL
    , InSourceA         BIT           NOT NULL
    , InSourceB         BIT           NOT NULL
    , InSourceC         BIT           NOT NULL
    -- raw values, shown on the report so users see what they'd see in the system
    , A_Address1        VARCHAR(200)  NULL
    , A_City            VARCHAR(100)  NULL
    , A_State           VARCHAR(10)   NULL
    , A_Zip             VARCHAR(20)   NULL
    , B_Address1        VARCHAR(200)  NULL
    , B_City            VARCHAR(100)  NULL
    , B_State           VARCHAR(10)   NULL
    , B_Zip             VARCHAR(20)   NULL
    , C_Address1        VARCHAR(200)  NULL
    , C_City            VARCHAR(100)  NULL
    , C_State           VARCHAR(10)   NULL
    , C_Zip             VARCHAR(20)   NULL
    -- comparison result
    , MatchStatus       VARCHAR(30)   NOT NULL
    , LoadDate          DATETIME      NOT NULL
    , CONSTRAINT PK_rpt_AddressDifference PRIMARY KEY CLUSTERED (EntityID)
);
*/


-- ============================================================
-- PROCEDURE
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.usp_Load_AddressDifference
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LoadDate DATETIME = GETDATE();   -- one stamp for the whole run

    -- ========================================================
    -- 1) SOURCE A - stage and standardize in a single pass.
    --    CROSS APPLY runs the cleanup functions ONCE per row and
    --    names the results, so no function is repeated later.
    -- ========================================================
    IF OBJECT_ID('tempdb..#SourceA') IS NOT NULL DROP TABLE #SourceA;

    SELECT
          EntityID     = a.<your_id_column>
        -- raw, for display on the report
        , Address1_Raw = a.<your_address1_column>
        , City_Raw     = a.<your_city_column>
        , State_Raw    = a.<your_state_column>
        , Zip_Raw      = a.<your_zip_column>
        -- standardized, for comparison only
        , Address1_Std = std.Address1
        , City_Std     = std.City
        , State_Std    = std.State
        , Zip_Std      = std.Zip
    INTO #SourceA
    FROM <SourceA_Table> AS a
    CROSS APPLY
    (
        -- the ONE place address cleanup rules live for this source
        SELECT
              Address1 = UPPER(LTRIM(RTRIM(REPLACE(REPLACE(a.<your_address1_column>, '.', ''), ',', ''))))
            , City     = UPPER(LTRIM(RTRIM(a.<your_city_column>)))
            , State    = UPPER(LTRIM(RTRIM(a.<your_state_column>)))
            , Zip      = LEFT(LTRIM(RTRIM(a.<your_zip_column>)), 5)   -- 5-digit compare
    ) AS std;

    -- ========================================================
    -- 2) SOURCE B - same pattern
    -- ========================================================
    IF OBJECT_ID('tempdb..#SourceB') IS NOT NULL DROP TABLE #SourceB;

    SELECT
          EntityID     = b.<your_id_column>
        , Address1_Raw = b.<your_address1_column>
        , City_Raw     = b.<your_city_column>
        , State_Raw    = b.<your_state_column>
        , Zip_Raw      = b.<your_zip_column>
        , Address1_Std = std.Address1
        , City_Std     = std.City
        , State_Std    = std.State
        , Zip_Std      = std.Zip
    INTO #SourceB
    FROM <SourceB_Table> AS b
    CROSS APPLY
    (
        SELECT
              Address1 = UPPER(LTRIM(RTRIM(REPLACE(REPLACE(b.<your_address1_column>, '.', ''), ',', ''))))
            , City     = UPPER(LTRIM(RTRIM(b.<your_city_column>)))
            , State    = UPPER(LTRIM(RTRIM(b.<your_state_column>)))
            , Zip      = LEFT(LTRIM(RTRIM(b.<your_zip_column>)), 5)
    ) AS std;

    -- ========================================================
    -- 3) SOURCE C - same pattern
    -- ========================================================
    IF OBJECT_ID('tempdb..#SourceC') IS NOT NULL DROP TABLE #SourceC;

    SELECT
          EntityID     = c.<your_id_column>
        , Address1_Raw = c.<your_address1_column>
        , City_Raw     = c.<your_city_column>
        , State_Raw    = c.<your_state_column>
        , Zip_Raw      = c.<your_zip_column>
        , Address1_Std = std.Address1
        , City_Std     = std.City
        , State_Std    = std.State
        , Zip_Std      = std.Zip
    INTO #SourceC
    FROM <SourceC_Table> AS c
    CROSS APPLY
    (
        SELECT
              Address1 = UPPER(LTRIM(RTRIM(REPLACE(REPLACE(c.<your_address1_column>, '.', ''), ',', ''))))
            , City     = UPPER(LTRIM(RTRIM(c.<your_city_column>)))
            , State    = UPPER(LTRIM(RTRIM(c.<your_state_column>)))
            , Zip      = LEFT(LTRIM(RTRIM(c.<your_zip_column>)), 5)
    ) AS std;

    -- ========================================================
    -- 4) MASTER ID LIST
    --    UNION (not UNION ALL) gives one row per ID across all
    --    three sources. This is what keeps a record that exists
    --    in only one source from being dropped.
    -- ========================================================
    IF OBJECT_ID('tempdb..#MasterID') IS NOT NULL DROP TABLE #MasterID;

    SELECT u.EntityID
    INTO #MasterID
    FROM
    (
        SELECT EntityID FROM #SourceA
        UNION
        SELECT EntityID FROM #SourceB
        UNION
        SELECT EntityID FROM #SourceC
    ) AS u;

    -- ========================================================
    -- 5) COMPARE AND LOAD
    --    LEFT JOIN from the master list: a source that is missing
    --    the ID simply comes back NULL instead of losing the row.
    --    A second CROSS APPLY builds one comparison key per source
    --    so the CASE below stays short and readable.
    -- ========================================================
    TRUNCATE TABLE dbo.rpt_AddressDifference;

    INSERT INTO dbo.rpt_AddressDifference
    (
          EntityID, InSourceA, InSourceB, InSourceC
        , A_Address1, A_City, A_State, A_Zip
        , B_Address1, B_City, B_State, B_Zip
        , C_Address1, C_City, C_State, C_Zip
        , MatchStatus, LoadDate
    )
    SELECT
          m.EntityID
        , InSourceA = CASE WHEN a.EntityID IS NULL THEN 0 ELSE 1 END
        , InSourceB = CASE WHEN b.EntityID IS NULL THEN 0 ELSE 1 END
        , InSourceC = CASE WHEN c.EntityID IS NULL THEN 0 ELSE 1 END

        , a.Address1_Raw, a.City_Raw, a.State_Raw, a.Zip_Raw
        , b.Address1_Raw, b.City_Raw, b.State_Raw, b.Zip_Raw
        , c.Address1_Raw, c.City_Raw, c.State_Raw, c.Zip_Raw

        , MatchStatus =
            CASE
                WHEN a.EntityID IS NULL OR b.EntityID IS NULL OR c.EntityID IS NULL
                    THEN 'Missing From A Source'
                WHEN k.KeyA = k.KeyB AND k.KeyA = k.KeyC
                    THEN 'Match'
                ELSE 'Address Mismatch'
            END

        , LoadDate = @LoadDate
    FROM #MasterID AS m
    LEFT JOIN #SourceA AS a ON a.EntityID = m.EntityID
    LEFT JOIN #SourceB AS b ON b.EntityID = m.EntityID
    LEFT JOIN #SourceC AS c ON c.EntityID = m.EntityID
    CROSS APPLY
    (
        -- build the comparison key once per row instead of
        -- repeating four column comparisons three times
        SELECT
              KeyA = CONCAT(a.Address1_Std, '|', a.City_Std, '|', a.State_Std, '|', a.Zip_Std)
            , KeyB = CONCAT(b.Address1_Std, '|', b.City_Std, '|', b.State_Std, '|', b.Zip_Std)
            , KeyC = CONCAT(c.Address1_Std, '|', c.City_Std, '|', c.State_Std, '|', c.Zip_Std)
    ) AS k;

    -- Note: all rows are loaded, including matches. SSRS filters to
    -- differences with a parameter, and the same table doubles as a
    -- full audit of what was compared.

END
GO


-- ============================================================
-- SSRS DATASETS
--
--   Dataset 1 (report body):
--     SELECT * FROM dbo.rpt_AddressDifference
--     WHERE MatchStatus <> 'Match'      -- or drive by parameter
--     ORDER BY EntityID;
--
--   Dataset 2 (header "Data as of" textbox):
--     SELECT LastRefresh = MAX(LoadDate) FROM dbo.rpt_AddressDifference;
--
-- Do NOT use Globals!ExecutionTime for the refresh date - that is
-- when the report was rendered, not when the data was pulled.
-- ============================================================
