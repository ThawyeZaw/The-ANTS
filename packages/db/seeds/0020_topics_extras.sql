-- 0020_topics_extras.sql
-- Subtopic backfill for WME03, WST03 and Psychology WPS01-04

UPDATE topics SET subtopics='[{"code": "1.1", "title": "Kinematics of a particle moving in a straight line when the acceleration"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-01';
UPDATE topics SET subtopics='[{"code": "2.1", "title": "Elastic strings and springs. Hooke’s law."}, {"code": "2.2", "title": "Energy stored in an elastic string or spring."}]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-02';
UPDATE topics SET subtopics='[{"code": "3.1", "title": "Newton’s laws of motion, for a particle moving in one dimension,"}, {"code": "3.2", "title": "Simple harmonic motion. Proof that a particle moves with simple harmonic motion in"}, {"code": "3.3", "title": "Oscillations of a particle attached to the end of an elastic string or"}]', subtopics_count=3, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-03';
UPDATE topics SET subtopics='[{"code": "4.1", "title": "Angular speed."}, {"code": "4.2", "title": "Radial acceleration in circular motion. The forms rω 2 and"}, {"code": "4.3", "title": "Uniform motion of a particle moving in a horizontal circle."}, {"code": "4.4", "title": "Motion of a particle in a vertical circle."}]', subtopics_count=4, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-04';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-mech3-05';
UPDATE topics SET subtopics='[{"code": "1.1", "title": "Distribution of linear combinations of independent Normal random"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-01';
UPDATE topics SET subtopics='[{"code": "2.1", "title": "Methods for collecting data. Simple random sampling. Use of random"}, {"code": "2.2", "title": "Other methods of sampling: stratified, systematic, quota."}]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-02';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-03';
UPDATE topics SET subtopics='[{"code": "4.1", "title": "The null and alternative hypotheses. The use of"}, {"code": "4.2", "title": "Degrees of freedom. Students will be expected to determine the degrees of"}]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-04';
UPDATE topics SET subtopics='[{"code": "5.1", "title": "Spearman’s rank correlation coefficient, its use, interpretation"}, {"code": "5.2", "title": "Testing the hypothesis that a correlation is zero."}]', subtopics_count=2, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-stat3-05';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych1-01';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych1-02';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych2-01';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych2-02';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych3-01';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych3-02';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych4-01';
UPDATE topics SET subtopics='[{"code": "", "title": "Coming soon"}]', subtopics_count=1, updated_at=strftime('%s','now')*1000 WHERE id='topic-edx-ial-psych4-02';
