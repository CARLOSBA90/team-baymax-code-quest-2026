-- Progress keeps two decimals so early progress is visible (1 of 390 lessons = 0.25 %).
-- Existing integer values are preserved; the 0..100 check constraint still applies.
ALTER TABLE "progress" ALTER COLUMN "percentage" SET DATA TYPE DOUBLE PRECISION;
