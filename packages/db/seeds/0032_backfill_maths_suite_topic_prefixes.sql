-- 0032_backfill_maths_suite_topic_prefixes.sql
-- Prefixes every Mathematics Suite topic name with its unit syllabus code.
--
-- Purpose: The TopicTracker page filters visible topics by checking whether the
--   first word of `topic.name` matches the active unitCode (e.g. "WMA11").
--   Before this migration, names were plain ("Algebra and functions"). After
--   this migration they become "WMA11 - Algebra and functions".
--
-- Format: "<SYLLABUS_CODE> - <Original Name>"
-- Safe to re-run: the WHERE clause guards against double-prefixing.

-- ─── WMA11 · Pure Mathematics 1 ───────────────────────────────────────────
UPDATE topics SET name = 'WMA11 - Algebra and functions',                        updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure1-01' AND name NOT LIKE 'WMA11%';
UPDATE topics SET name = 'WMA11 - Coordinate geometry in the (x, y) plane',     updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure1-02' AND name NOT LIKE 'WMA11%';
UPDATE topics SET name = 'WMA11 - Trigonometry',                                 updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure1-03' AND name NOT LIKE 'WMA11%';
UPDATE topics SET name = 'WMA11 - Differentiation',                              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure1-04' AND name NOT LIKE 'WMA11%';
UPDATE topics SET name = 'WMA11 - Integration',                                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure1-05' AND name NOT LIKE 'WMA11%';

-- ─── WMA12 · Pure Mathematics 2 ───────────────────────────────────────────
UPDATE topics SET name = 'WMA12 - Proof and algebra',                            updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure2-01' AND name NOT LIKE 'WMA12%';
UPDATE topics SET name = 'WMA12 - Coordinate geometry of circles',               updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure2-02' AND name NOT LIKE 'WMA12%';
UPDATE topics SET name = 'WMA12 - Sequences and series',                         updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure2-03' AND name NOT LIKE 'WMA12%';
UPDATE topics SET name = 'WMA12 - Trigonometry and radian measure',              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure2-04' AND name NOT LIKE 'WMA12%';
UPDATE topics SET name = 'WMA12 - Exponentials and logarithms',                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure2-05' AND name NOT LIKE 'WMA12%';
UPDATE topics SET name = 'WMA12 - Differentiation and integration',              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure2-06' AND name NOT LIKE 'WMA12%';

-- ─── WMA13 · Pure Mathematics 3 ───────────────────────────────────────────
UPDATE topics SET name = 'WMA13 - Algebra and functions',                        updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure3-01' AND name NOT LIKE 'WMA13%';
UPDATE topics SET name = 'WMA13 - Trigonometric functions and identities',       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure3-02' AND name NOT LIKE 'WMA13%';
UPDATE topics SET name = 'WMA13 - Differentiation',                              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure3-03' AND name NOT LIKE 'WMA13%';
UPDATE topics SET name = 'WMA13 - Integration',                                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure3-04' AND name NOT LIKE 'WMA13%';
UPDATE topics SET name = 'WMA13 - Numerical methods',                            updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure3-05' AND name NOT LIKE 'WMA13%';

-- ─── WMA14 · Pure Mathematics 4 ───────────────────────────────────────────
UPDATE topics SET name = 'WMA14 - Proof by contradiction',                       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure4-01' AND name NOT LIKE 'WMA14%';
UPDATE topics SET name = 'WMA14 - Algebra and binomial expansion',               updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure4-02' AND name NOT LIKE 'WMA14%';
UPDATE topics SET name = 'WMA14 - Coordinate geometry and parametric equations', updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure4-03' AND name NOT LIKE 'WMA14%';
UPDATE topics SET name = 'WMA14 - Differentiation and integration',              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure4-04' AND name NOT LIKE 'WMA14%';
UPDATE topics SET name = 'WMA14 - Differential equations',                       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure4-05' AND name NOT LIKE 'WMA14%';
UPDATE topics SET name = 'WMA14 - Vectors in three dimensions',                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-pure4-06' AND name NOT LIKE 'WMA14%';

-- ─── WFM01 · Further Pure Mathematics 1 ───────────────────────────────────
UPDATE topics SET name = 'WFM01 - Complex numbers',                              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath1-01' AND name NOT LIKE 'WFM01%';
UPDATE topics SET name = 'WFM01 - Roots of quadratic and cubic equations',       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath1-02' AND name NOT LIKE 'WFM01%';
UPDATE topics SET name = 'WFM01 - Numerical solutions of equations',             updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath1-03' AND name NOT LIKE 'WFM01%';
UPDATE topics SET name = 'WFM01 - Coordinate systems (Parabolas and Hyperbolas)',updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath1-04' AND name NOT LIKE 'WFM01%';
UPDATE topics SET name = 'WFM01 - Matrix algebra',                               updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath1-05' AND name NOT LIKE 'WFM01%';
UPDATE topics SET name = 'WFM01 - Series',                                       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath1-06' AND name NOT LIKE 'WFM01%';
UPDATE topics SET name = 'WFM01 - Proof by mathematical induction',              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath1-07' AND name NOT LIKE 'WFM01%';

-- ─── WFM02 · Further Pure Mathematics 2 ───────────────────────────────────
UPDATE topics SET name = 'WFM02 - Inequalities',                                 updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath2-01' AND name NOT LIKE 'WFM02%';
UPDATE topics SET name = 'WFM02 - Series and method of differences',             updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath2-02' AND name NOT LIKE 'WFM02%';
UPDATE topics SET name = 'WFM02 - Further complex numbers',                      updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath2-03' AND name NOT LIKE 'WFM02%';
UPDATE topics SET name = 'WFM02 - First and second order differential equations',updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath2-04' AND name NOT LIKE 'WFM02%';
UPDATE topics SET name = 'WFM02 - Maclaurin and Taylor series',                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath2-05' AND name NOT LIKE 'WFM02%';
UPDATE topics SET name = 'WFM02 - Polar coordinates',                            updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath2-06' AND name NOT LIKE 'WFM02%';

-- ─── WFM03 · Further Pure Mathematics 3 ───────────────────────────────────
UPDATE topics SET name = 'WFM03 - Hyperbolic functions',                         updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath3-01' AND name NOT LIKE 'WFM03%';
UPDATE topics SET name = 'WFM03 - Further coordinate systems',                   updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath3-02' AND name NOT LIKE 'WFM03%';
UPDATE topics SET name = 'WFM03 - Differentiation and integration',              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath3-03' AND name NOT LIKE 'WFM03%';
UPDATE topics SET name = 'WFM03 - Vectors',                                      updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath3-04' AND name NOT LIKE 'WFM03%';
UPDATE topics SET name = 'WFM03 - Further matrix algebra',                       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-fmath3-05' AND name NOT LIKE 'WFM03%';

-- ─── WME01 · Mechanics 1 ──────────────────────────────────────────────────
UPDATE topics SET name = 'WME01 - Mathematical models in mechanics',             updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech1-01' AND name NOT LIKE 'WME01%';
UPDATE topics SET name = 'WME01 - Kinematics in a straight line',                updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech1-02' AND name NOT LIKE 'WME01%';
UPDATE topics SET name = 'WME01 - Dynamics of a particle',                       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech1-03' AND name NOT LIKE 'WME01%';
UPDATE topics SET name = 'WME01 - Statics of a particle',                        updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech1-04' AND name NOT LIKE 'WME01%';
UPDATE topics SET name = 'WME01 - Moments',                                      updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech1-05' AND name NOT LIKE 'WME01%';

-- ─── WME02 · Mechanics 2 ──────────────────────────────────────────────────
UPDATE topics SET name = 'WME02 - Kinematics in 2D and projectiles',            updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech2-01' AND name NOT LIKE 'WME02%';
UPDATE topics SET name = 'WME02 - Centres of mass',                              updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech2-02' AND name NOT LIKE 'WME02%';
UPDATE topics SET name = 'WME02 - Work, energy and power',                       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech2-03' AND name NOT LIKE 'WME02%';
UPDATE topics SET name = 'WME02 - Collisions and restitution',                   updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech2-04' AND name NOT LIKE 'WME02%';
UPDATE topics SET name = 'WME02 - Statics of rigid bodies',                      updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech2-05' AND name NOT LIKE 'WME02%';

-- ─── WME03 · Mechanics 3 ──────────────────────────────────────────────────
UPDATE topics SET name = 'WME03 - Further kinematics',                           updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech3-01' AND name NOT LIKE 'WME03%';
UPDATE topics SET name = 'WME03 - Elastic strings and springs',                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech3-02' AND name NOT LIKE 'WME03%';
UPDATE topics SET name = 'WME03 - Further dynamics and simple harmonic motion',  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech3-03' AND name NOT LIKE 'WME03%';
UPDATE topics SET name = 'WME03 - Motion in a vertical circle',                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech3-04' AND name NOT LIKE 'WME03%';
UPDATE topics SET name = 'WME03 - Centres of mass of solids of revolution',      updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-mech3-05' AND name NOT LIKE 'WME03%';

-- ─── WST01 · Statistics 1 ─────────────────────────────────────────────────
UPDATE topics SET name = 'WST01 - Representation and summary of data',           updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat1-01' AND name NOT LIKE 'WST01%';
UPDATE topics SET name = 'WST01 - Probability',                                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat1-02' AND name NOT LIKE 'WST01%';
UPDATE topics SET name = 'WST01 - Correlation and regression',                   updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat1-03' AND name NOT LIKE 'WST01%';
UPDATE topics SET name = 'WST01 - Discrete random variables',                    updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat1-04' AND name NOT LIKE 'WST01%';
UPDATE topics SET name = 'WST01 - The Normal distribution',                      updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat1-05' AND name NOT LIKE 'WST01%';

-- ─── WST02 · Statistics 2 ─────────────────────────────────────────────────
UPDATE topics SET name = 'WST02 - The Binomial and Poisson distributions',       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat2-01' AND name NOT LIKE 'WST02%';
UPDATE topics SET name = 'WST02 - Continuous random variables',                  updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat2-02' AND name NOT LIKE 'WST02%';
UPDATE topics SET name = 'WST02 - Continuous distributions',                     updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat2-03' AND name NOT LIKE 'WST02%';
UPDATE topics SET name = 'WST02 - Hypothesis testing',                           updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat2-04' AND name NOT LIKE 'WST02%';

-- ─── WST03 · Statistics 3 ─────────────────────────────────────────────────
UPDATE topics SET name = 'WST03 - Combinations of random variables',             updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat3-01' AND name NOT LIKE 'WST03%';
UPDATE topics SET name = 'WST03 - Sampling and estimation',                      updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat3-02' AND name NOT LIKE 'WST03%';
UPDATE topics SET name = 'WST03 - Hypothesis tests on mean and variance',        updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat3-03' AND name NOT LIKE 'WST03%';
UPDATE topics SET name = 'WST03 - Goodness of fit and contingency tables',       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat3-04' AND name NOT LIKE 'WST03%';
UPDATE topics SET name = 'WST03 - Rank correlation',                             updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-stat3-05' AND name NOT LIKE 'WST03%';

-- ─── WDM11 · Decision Mathematics 1 ──────────────────────────────────────
UPDATE topics SET name = 'WDM11 - Algorithms',                                   updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-dec1-01' AND name NOT LIKE 'WDM11%';
UPDATE topics SET name = 'WDM11 - Algorithms on graphs',                         updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-dec1-02' AND name NOT LIKE 'WDM11%';
UPDATE topics SET name = 'WDM11 - The route inspection problem (Chinese Postman)',updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-dec1-03' AND name NOT LIKE 'WDM11%';
UPDATE topics SET name = 'WDM11 - Critical path analysis',                       updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-dec1-04' AND name NOT LIKE 'WDM11%';
UPDATE topics SET name = 'WDM11 - Linear programming',                           updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-dec1-05' AND name NOT LIKE 'WDM11%';
UPDATE topics SET name = 'WDM11 - Matchings',                                    updated_at = strftime('%s','now')*1000 WHERE id = 'topic-edx-ial-dec1-06' AND name NOT LIKE 'WDM11%';
