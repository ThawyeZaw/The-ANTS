-- 0020_topics_extras.sql
-- Subtopic backfill for WME03, WST03 and Psychology WPS01-04

UPDATE topics SET subtopics='["1.1 Kinematics of a particle moving in a straight line when the acceleration"]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-01';
UPDATE topics SET subtopics='["2.1 Elastic strings and springs. Hooke’s law.", "2.2 Energy stored in an elastic string or spring."]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-02';
UPDATE topics SET subtopics='["3.1 Newton’s laws of motion, for a particle moving in one dimension,", "3.2 Simple harmonic motion. Proof that a particle moves with simple harmonic motion in", "3.3 Oscillations of a particle attached to the end of an elastic string or"]', subtopics_count=3, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-03';
UPDATE topics SET subtopics='["4.1 Angular speed.", "4.2 Radial acceleration in circular motion. The forms rω 2 and", "4.3 Uniform motion of a particle moving in a horizontal circle.", "4.4 Motion of a particle in a vertical circle."]', subtopics_count=4, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-04';
UPDATE topics SET subtopics='["1.1 Distribution of linear combinations of independent Normal random"]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-01';
UPDATE topics SET subtopics='["2.1 Methods for collecting data. Simple random sampling. Use of random", "2.2 Other methods of sampling: stratified, systematic, quota."]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-02';
UPDATE topics SET subtopics='["4.1 The null and alternative hypotheses. The use of", "4.2 Degrees of freedom. Students will be expected to determine the degrees of"]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-04';
UPDATE topics SET subtopics='["5.1 Spearman’s rank correlation coefficient, its use, interpretation", "5.2 Testing the hypothesis that a correlation is zero."]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-05';
