"""Build verified Oct/Nov 2026 exams countdown seed from curated rows."""
from pathlib import Path

OUT = Path(__file__).with_name("0006_exams_w26_countdown.sql")
CREATED = "strftime('%s', 'now') * 1000"

# (id, subject_id, curriculum_id, title, board, qual, code, season, series, paper, date_ms, duration, marks)
ROWS = [
  # CAIE IGCSE — durations for 0580 corrected to official syllabus times
  ("exam-0580-w26-p12", "subj-caie-igcse-maths", "curr-caie-igcse", "Mathematics (Without Coursework) Core P12", "CAIE", "IGCSE", "0580", "Oct/Nov", "w26", "12", 1791417600000, 60, 56),
  ("exam-0580-w26-p22", "subj-caie-igcse-maths", "curr-caie-igcse", "Mathematics (Without Coursework) Extended P22", "CAIE", "IGCSE", "0580", "Oct/Nov", "w26", "22", 1791417600000, 90, 70),
  ("exam-0580-w26-p32", "subj-caie-igcse-maths", "curr-caie-igcse", "Mathematics (Without Coursework) Core P32", "CAIE", "IGCSE", "0580", "Oct/Nov", "w26", "32", 1791936000000, 120, 104),
  ("exam-0580-w26-p42", "subj-caie-igcse-maths", "curr-caie-igcse", "Mathematics (Without Coursework) Extended P42", "CAIE", "IGCSE", "0580", "Oct/Nov", "w26", "42", 1791936000000, 150, 130),
  ("exam-0606-w26-p12", "subj-caie-igcse-addmaths", "curr-caie-igcse", "Additional Mathematics P12", "CAIE", "IGCSE", "0606", "Oct/Nov", "w26", "12", 1790726400000, 120, 80),
  ("exam-0606-w26-p22", "subj-caie-igcse-addmaths", "curr-caie-igcse", "Additional Mathematics P22", "CAIE", "IGCSE", "0606", "Oct/Nov", "w26", "22", 1791244800000, 120, 80),
  ("exam-0625-w26-p32", "subj-caie-igcse-phys", "curr-caie-igcse", "Physics (Theory - Core) P32", "CAIE", "IGCSE", "0625", "Oct/Nov", "w26", "32", 1791331200000, 75, 80),
  ("exam-0625-w26-p42", "subj-caie-igcse-phys", "curr-caie-igcse", "Physics (Theory - Extended) P42", "CAIE", "IGCSE", "0625", "Oct/Nov", "w26", "42", 1791331200000, 75, 80),
  ("exam-0625-w26-p52", "subj-caie-igcse-phys", "curr-caie-igcse", "Physics (Practical) P52", "CAIE", "IGCSE", "0625", "Oct/Nov", "w26", "52", 1792454400000, 75, 40),
  ("exam-0625-w26-p62", "subj-caie-igcse-phys", "curr-caie-igcse", "Physics (Alternative to Practical) P62", "CAIE", "IGCSE", "0625", "Oct/Nov", "w26", "62", 1792454400000, 60, 40),
  ("exam-0625-w26-p12", "subj-caie-igcse-phys", "curr-caie-igcse", "Physics (Multiple Choice - Core) P12", "CAIE", "IGCSE", "0625", "Oct/Nov", "w26", "12", 1793836800000, 45, 40),
  ("exam-0625-w26-p22", "subj-caie-igcse-phys", "curr-caie-igcse", "Physics (Multiple Choice - Extended) P22", "CAIE", "IGCSE", "0625", "Oct/Nov", "w26", "22", 1793836800000, 45, 40),
  ("exam-0620-w26-p32", "subj-caie-igcse-chem", "curr-caie-igcse", "Chemistry (Theory - Core) P32", "CAIE", "IGCSE", "0620", "Oct/Nov", "w26", "32", 1791763200000, 75, 80),
  ("exam-0620-w26-p42", "subj-caie-igcse-chem", "curr-caie-igcse", "Chemistry (Theory - Extended) P42", "CAIE", "IGCSE", "0620", "Oct/Nov", "w26", "42", 1791763200000, 75, 80),
  ("exam-0620-w26-p52", "subj-caie-igcse-chem", "curr-caie-igcse", "Chemistry (Practical) P52", "CAIE", "IGCSE", "0620", "Oct/Nov", "w26", "52", 1792022400000, 75, 40),
  ("exam-0620-w26-p62", "subj-caie-igcse-chem", "curr-caie-igcse", "Chemistry (Alternative to Practical) P62", "CAIE", "IGCSE", "0620", "Oct/Nov", "w26", "62", 1792022400000, 60, 40),
  ("exam-0620-w26-p12", "subj-caie-igcse-chem", "curr-caie-igcse", "Chemistry (Multiple Choice - Core) P12", "CAIE", "IGCSE", "0620", "Oct/Nov", "w26", "12", 1794441600000, 45, 40),
  ("exam-0620-w26-p22", "subj-caie-igcse-chem", "curr-caie-igcse", "Chemistry (Multiple Choice - Extended) P22", "CAIE", "IGCSE", "0620", "Oct/Nov", "w26", "22", 1794441600000, 45, 40),
  ("exam-0610-w26-p52", "subj-caie-igcse-bio", "curr-caie-igcse", "Biology (Practical) P52", "CAIE", "IGCSE", "0610", "Oct/Nov", "w26", "52", 1791849600000, 75, 40),
  ("exam-0610-w26-p62", "subj-caie-igcse-bio", "curr-caie-igcse", "Biology (Alternative to Practical) P62", "CAIE", "IGCSE", "0610", "Oct/Nov", "w26", "62", 1791849600000, 60, 40),
  ("exam-0610-w26-p32", "subj-caie-igcse-bio", "curr-caie-igcse", "Biology (Theory - Core) P32", "CAIE", "IGCSE", "0610", "Oct/Nov", "w26", "32", 1792108800000, 75, 80),
  ("exam-0610-w26-p42", "subj-caie-igcse-bio", "curr-caie-igcse", "Biology (Theory - Extended) P42", "CAIE", "IGCSE", "0610", "Oct/Nov", "w26", "42", 1792108800000, 75, 80),
  ("exam-0610-w26-p12", "subj-caie-igcse-bio", "curr-caie-igcse", "Biology (Multiple Choice - Core) P12", "CAIE", "IGCSE", "0610", "Oct/Nov", "w26", "12", 1794268800000, 45, 40),
  ("exam-0610-w26-p22", "subj-caie-igcse-bio", "curr-caie-igcse", "Biology (Multiple Choice - Extended) P22", "CAIE", "IGCSE", "0610", "Oct/Nov", "w26", "22", 1794268800000, 45, 40),
  ("exam-0478-w26-p12", "subj-caie-igcse-cs", "curr-caie-igcse", "Computer Science (Theory) P12", "CAIE", "IGCSE", "0478", "Oct/Nov", "w26", "12", 1791504000000, 105, 75),
  ("exam-0478-w26-p22", "subj-caie-igcse-cs", "curr-caie-igcse", "Computer Science (Algorithms/Programming) P22", "CAIE", "IGCSE", "0478", "Oct/Nov", "w26", "22", 1792368000000, 105, 75),
  ("exam-0417-w26-p02", "subj-caie-igcse-ict", "curr-caie-igcse", "Information & Communication Technology Practical 02", "CAIE", "IGCSE", "0417", "Oct/Nov", "w26", "02", 1790208000000, 150, 80),
  ("exam-0417-w26-p03", "subj-caie-igcse-ict", "curr-caie-igcse", "Information & Communication Technology Practical 03", "CAIE", "IGCSE", "0417", "Oct/Nov", "w26", "03", 1790726400000, 150, 80),
  ("exam-0417-w26-p12", "subj-caie-igcse-ict", "curr-caie-igcse", "Information & Communication Technology Theory P12", "CAIE", "IGCSE", "0417", "Oct/Nov", "w26", "12", 1791849600000, 90, 80),
  # Fixed subject_id: eng-lang -> eng-first (matches grade-threshold seed)
  ("exam-0500-w26-p12", "subj-caie-igcse-eng-first", "curr-caie-igcse", "First Language English (Reading) P12", "CAIE", "IGCSE", "0500", "Oct/Nov", "w26", "12", 1791158400000, 120, 80),
  ("exam-0500-w26-p22", "subj-caie-igcse-eng-first", "curr-caie-igcse", "First Language English (Directed Writing & Comp) P22", "CAIE", "IGCSE", "0500", "Oct/Nov", "w26", "22", 1791331200000, 120, 80),
  ("exam-0510-w26-p12", "subj-caie-igcse-esl", "curr-caie-igcse", "English as a Second Language (Reading & Writing) P12", "CAIE", "IGCSE", "0510", "Oct/Nov", "w26", "12", 1790640000000, 120, 60),
  ("exam-0510-w26-p22", "subj-caie-igcse-esl", "curr-caie-igcse", "English as a Second Language (Listening) P22", "CAIE", "IGCSE", "0510", "Oct/Nov", "w26", "22", 1792540800000, 50, 40),
  ("exam-0455-w26-p22", "subj-caie-igcse-econ", "curr-caie-igcse", "Economics (Structured Questions) P22", "CAIE", "IGCSE", "0455", "Oct/Nov", "w26", "22", 1792454400000, 135, 90),
  ("exam-0455-w26-p12", "subj-caie-igcse-econ", "curr-caie-igcse", "Economics (Multiple Choice) P12", "CAIE", "IGCSE", "0455", "Oct/Nov", "w26", "12", 1793750400000, 45, 30),
  ("exam-0450-w26-p12", "subj-caie-igcse-biz", "curr-caie-igcse", "Business Studies (Short Answer/Data Response) P12", "CAIE", "IGCSE", "0450", "Oct/Nov", "w26", "12", 1791244800000, 90, 80),
  ("exam-0450-w26-p22", "subj-caie-igcse-biz", "curr-caie-igcse", "Business Studies (Case Study) P22", "CAIE", "IGCSE", "0450", "Oct/Nov", "w26", "22", 1792108800000, 90, 80),
  ("exam-0452-w26-p22", "subj-caie-igcse-acc", "curr-caie-igcse", "Accounting (Structured) P22", "CAIE", "IGCSE", "0452", "Oct/Nov", "w26", "22", 1791417600000, 105, 100),
  ("exam-0452-w26-p12", "subj-caie-igcse-acc", "curr-caie-igcse", "Accounting (Multiple Choice) P12", "CAIE", "IGCSE", "0452", "Oct/Nov", "w26", "12", 1793923200000, 75, 35),
  # CAIE A Level
  ("exam-9709-w26-p12", "subj-caie-al-maths", "curr-caie-alevel", "Mathematics (Pure Mathematics 1) P12", "CAIE", "A Level", "9709", "Oct/Nov", "w26", "12", 1790726400000, 110, 75),
  ("exam-9709-w26-p52", "subj-caie-al-maths", "curr-caie-alevel", "Mathematics (Probability & Statistics 1) P52", "CAIE", "A Level", "9709", "Oct/Nov", "w26", "52", 1791331200000, 75, 50),
  ("exam-9709-w26-p22", "subj-caie-al-maths", "curr-caie-alevel", "Mathematics (Pure Mathematics 2) P22", "CAIE", "A Level", "9709", "Oct/Nov", "w26", "22", 1791849600000, 75, 50),
  ("exam-9709-w26-p42", "subj-caie-al-maths", "curr-caie-alevel", "Mathematics (Mechanics) P42", "CAIE", "A Level", "9709", "Oct/Nov", "w26", "42", 1791849600000, 75, 50),
  ("exam-9709-w26-p62", "subj-caie-al-maths", "curr-caie-alevel", "Mathematics (Probability & Statistics 2) P62", "CAIE", "A Level", "9709", "Oct/Nov", "w26", "62", 1791849600000, 75, 50),
  ("exam-9709-w26-p32", "subj-caie-al-maths", "curr-caie-alevel", "Mathematics (Pure Mathematics 3) P32", "CAIE", "A Level", "9709", "Oct/Nov", "w26", "32", 1792022400000, 110, 75),
  ("exam-9702-w26-p33", "subj-caie-al-phys", "curr-caie-alevel", "Physics (Practical - Advanced) P33", "CAIE", "A Level", "9702", "Oct/Nov", "w26", "33", 1791417600000, 120, 40),
  ("exam-9702-w26-p42", "subj-caie-al-phys", "curr-caie-alevel", "Physics (A Level Structured Questions) P42", "CAIE", "A Level", "9702", "Oct/Nov", "w26", "42", 1791763200000, 120, 100),
  ("exam-9702-w26-p22", "subj-caie-al-phys", "curr-caie-alevel", "Physics (AS Level Structured Questions) P22", "CAIE", "A Level", "9702", "Oct/Nov", "w26", "22", 1791936000000, 75, 60),
  ("exam-9702-w26-p52", "subj-caie-al-phys", "curr-caie-alevel", "Physics (Planning, Analysis and Evaluation) P52", "CAIE", "A Level", "9702", "Oct/Nov", "w26", "52", 1791936000000, 75, 30),
  ("exam-9702-w26-p34", "subj-caie-al-phys", "curr-caie-alevel", "Physics (Practical - Advanced) P34", "CAIE", "A Level", "9702", "Oct/Nov", "w26", "34", 1792627200000, 120, 40),
  ("exam-9702-w26-p12", "subj-caie-al-phys", "curr-caie-alevel", "Physics (Multiple Choice) P12", "CAIE", "A Level", "9702", "Oct/Nov", "w26", "12", 1794268800000, 75, 40),
  ("exam-9701-w26-p33", "subj-caie-al-chem", "curr-caie-alevel", "Chemistry (Practical - Advanced) P33", "CAIE", "A Level", "9701", "Oct/Nov", "w26", "33", 1790640000000, 120, 40),
  ("exam-9701-w26-p22", "subj-caie-al-chem", "curr-caie-alevel", "Chemistry (AS Level Structured Questions) P22", "CAIE", "A Level", "9701", "Oct/Nov", "w26", "22", 1791504000000, 75, 60),
  ("exam-9701-w26-p52", "subj-caie-al-chem", "curr-caie-alevel", "Chemistry (Planning, Analysis and Evaluation) P52", "CAIE", "A Level", "9701", "Oct/Nov", "w26", "52", 1791504000000, 75, 30),
  ("exam-9701-w26-p42", "subj-caie-al-chem", "curr-caie-alevel", "Chemistry (A Level Structured Questions) P42", "CAIE", "A Level", "9701", "Oct/Nov", "w26", "42", 1792108800000, 120, 100),
  ("exam-9701-w26-p34", "subj-caie-al-chem", "curr-caie-alevel", "Chemistry (Practical - Advanced) P34", "CAIE", "A Level", "9701", "Oct/Nov", "w26", "34", 1793059200000, 120, 40),
  ("exam-9701-w26-p12", "subj-caie-al-chem", "curr-caie-alevel", "Chemistry (Multiple Choice) P12", "CAIE", "A Level", "9701", "Oct/Nov", "w26", "12", 1794528000000, 75, 40),
  ("exam-9700-w26-p33", "subj-caie-al-bio", "curr-caie-alevel", "Biology (Practical - Advanced) P33", "CAIE", "A Level", "9700", "Oct/Nov", "w26", "33", 1791244800000, 120, 40),
  ("exam-9700-w26-p22", "subj-caie-al-bio", "curr-caie-alevel", "Biology (AS Level Structured Questions) P22", "CAIE", "A Level", "9700", "Oct/Nov", "w26", "22", 1792454400000, 75, 60),
  ("exam-9700-w26-p52", "subj-caie-al-bio", "curr-caie-alevel", "Biology (Planning, Analysis and Evaluation) P52", "CAIE", "A Level", "9700", "Oct/Nov", "w26", "52", 1792454400000, 75, 30),
  ("exam-9700-w26-p42", "subj-caie-al-bio", "curr-caie-alevel", "Biology (A Level Structured Questions) P42", "CAIE", "A Level", "9700", "Oct/Nov", "w26", "42", 1792713600000, 120, 100),
  ("exam-9700-w26-p34", "subj-caie-al-bio", "curr-caie-alevel", "Biology (Practical - Advanced) P34", "CAIE", "A Level", "9700", "Oct/Nov", "w26", "34", 1793232000000, 120, 40),
  ("exam-9700-w26-p12", "subj-caie-al-bio", "curr-caie-alevel", "Biology (Multiple Choice) P12", "CAIE", "A Level", "9700", "Oct/Nov", "w26", "12", 1794441600000, 75, 40),
  ("exam-9618-w26-p12", "subj-caie-al-cs", "curr-caie-alevel", "Computer Science (Theory Fundamentals) P12", "CAIE", "A Level", "9618", "Oct/Nov", "w26", "12", 1791504000000, 90, 75),
  ("exam-9618-w26-p22", "subj-caie-al-cs", "curr-caie-alevel", "Computer Science (Problem-solving & Programming Skills) P22", "CAIE", "A Level", "9618", "Oct/Nov", "w26", "22", 1791936000000, 120, 75),
  ("exam-9618-w26-p32", "subj-caie-al-cs", "curr-caie-alevel", "Computer Science (Advanced Theory) P32", "CAIE", "A Level", "9618", "Oct/Nov", "w26", "32", 1792454400000, 90, 75),
  ("exam-9618-w26-p42", "subj-caie-al-cs", "curr-caie-alevel", "Computer Science (Practical) P42", "CAIE", "A Level", "9618", "Oct/Nov", "w26", "42", 1793232000000, 150, 75),
  ("exam-9708-w26-p22", "subj-caie-al-econ", "curr-caie-alevel", "Economics (AS Level Data Response and Essays) P22", "CAIE", "A Level", "9708", "Oct/Nov", "w26", "22", 1791244800000, 120, 60),
  ("exam-9708-w26-p42", "subj-caie-al-econ", "curr-caie-alevel", "Economics (A Level Data Response and Essays) P42", "CAIE", "A Level", "9708", "Oct/Nov", "w26", "42", 1791849600000, 120, 60),
  ("exam-9708-w26-p12", "subj-caie-al-econ", "curr-caie-alevel", "Economics (AS Level Multiple Choice) P12", "CAIE", "A Level", "9708", "Oct/Nov", "w26", "12", 1793836800000, 60, 30),
  ("exam-9708-w26-p32", "subj-caie-al-econ", "curr-caie-alevel", "Economics (A Level Multiple Choice) P32", "CAIE", "A Level", "9708", "Oct/Nov", "w26", "32", 1794355200000, 75, 30),
  # Edexcel IGCSE
  ("exam-4ma1-w26-p1h", "subj-edx-igcse-maths-a", "curr-edexcel-igcse", "Mathematics A Higher Tier Paper 1H", "Edexcel", "IGCSE", "4MA1", "November", "w26", "1H", 1793750400000, 120, 100),
  ("exam-4ma1-w26-p2h", "subj-edx-igcse-maths-a", "curr-edexcel-igcse", "Mathematics A Higher Tier Paper 2H", "Edexcel", "IGCSE", "4MA1", "November", "w26", "2H", 1793923200000, 120, 100),
  ("exam-4pm1-w26-p01", "subj-edx-igcse-fmaths", "curr-edexcel-igcse", "Further Pure Mathematics Paper 1", "Edexcel", "IGCSE", "4PM1", "November", "w26", "01", 1793318400000, 120, 100),
  ("exam-4pm1-w26-p02", "subj-edx-igcse-fmaths", "curr-edexcel-igcse", "Further Pure Mathematics Paper 2", "Edexcel", "IGCSE", "4PM1", "November", "w26", "02", 1794268800000, 120, 100),
  ("exam-4ph1-w26-p1p", "subj-edx-igcse-phys", "curr-edexcel-igcse", "Physics Paper 1P", "Edexcel", "IGCSE", "4PH1", "November", "w26", "1P", 1794355200000, 120, 110),
  ("exam-4ph1-w26-p2p", "subj-edx-igcse-phys", "curr-edexcel-igcse", "Physics Paper 2P", "Edexcel", "IGCSE", "4PH1", "November", "w26", "2P", 1794960000000, 75, 70),
  ("exam-4ch1-w26-p1c", "subj-edx-igcse-chem", "curr-edexcel-igcse", "Chemistry Paper 1C", "Edexcel", "IGCSE", "4CH1", "November", "w26", "1C", 1794182400000, 120, 110),
  ("exam-4ch1-w26-p2c", "subj-edx-igcse-chem", "curr-edexcel-igcse", "Chemistry Paper 2C", "Edexcel", "IGCSE", "4CH1", "November", "w26", "2C", 1794787200000, 75, 70),
  ("exam-4bi1-w26-p1b", "subj-edx-igcse-bio", "curr-edexcel-igcse", "Biology Paper 1B", "Edexcel", "IGCSE", "4BI1", "November", "w26", "1B", 1793577600000, 120, 110),
  ("exam-4bi1-w26-p2b", "subj-edx-igcse-bio", "curr-edexcel-igcse", "Biology Paper 2B", "Edexcel", "IGCSE", "4BI1", "November", "w26", "2B", 1794528000000, 75, 70),
  ("exam-4it1-w26-p01", "subj-edx-igcse-ict", "curr-edexcel-igcse", "ICT Paper 1: Written Paper", "Edexcel", "IGCSE", "4IT1", "November", "w26", "01", 1793923200000, 90, 100),
  ("exam-4it1-w26-p02", "subj-edx-igcse-ict", "curr-edexcel-igcse", "ICT Paper 2: Practical Exam", "Edexcel", "IGCSE", "4IT1", "November", "w26", "02", 1794182400000, 180, 100),
  ("exam-4bs1-w26-p01", "subj-edx-igcse-biz", "curr-edexcel-igcse", "Business Paper 1: Investigating small businesses", "Edexcel", "IGCSE", "4BS1", "November", "w26", "01", 1794268800000, 90, 80),
  ("exam-4bs1-w26-p02", "subj-edx-igcse-biz", "curr-edexcel-igcse", "Business Paper 2: Investigating large businesses", "Edexcel", "IGCSE", "4BS1", "November", "w26", "02", 1794873600000, 90, 80),
  ("exam-4ec1-w26-p01", "subj-edx-igcse-econ", "curr-edexcel-igcse", "Economics Paper 1: Microeconomics and Business Economics", "Edexcel", "IGCSE", "4EC1", "November", "w26", "01", 1794355200000, 90, 80),
  ("exam-4ec1-w26-p02", "subj-edx-igcse-econ", "curr-edexcel-igcse", "Economics Paper 2: Macroeconomics and the Global Economy", "Edexcel", "IGCSE", "4EC1", "November", "w26", "02", 1795046400000, 90, 80),
  ("exam-4ac1-w26-p01", "subj-edx-igcse-acc", "curr-edexcel-igcse", "Accounting Paper 1: Introduction to Bookkeeping & Accounting", "Edexcel", "IGCSE", "4AC1", "November", "w26", "01", 1793145600000, 120, 100),
  ("exam-4ac1-w26-p02", "subj-edx-igcse-acc", "curr-edexcel-igcse", "Accounting Paper 2: Financial Statements", "Edexcel", "IGCSE", "4AC1", "November", "w26", "02", 1793836800000, 75, 50),
  ("exam-4ea1-w26-p01", "subj-edx-igcse-eng-a", "curr-edexcel-igcse", "English Language A Paper 1: Non-fiction Texts", "Edexcel", "IGCSE", "4EA1", "November", "w26", "01", 1793664000000, 135, 90),
  ("exam-4ea1-w26-p02", "subj-edx-igcse-eng-a", "curr-edexcel-igcse", "English Language A Paper 2: Poetry and Prose Texts", "Edexcel", "IGCSE", "4EA1", "November", "w26", "02", 1793836800000, 90, 60),
  # Edexcel IAL
  ("exam-wma11-w26-p01", "subj-edx-ial-pure1", "curr-edexcel-ial", "Pure Mathematics 1", "Edexcel", "IAL", "WMA11", "October", "w26", "01", 1791504000000, 90, 75),
  ("exam-wme01-w26-p01", "subj-edx-ial-mech1", "curr-edexcel-ial", "Mechanics M1", "Edexcel", "IAL", "WME01", "October", "w26", "01", 1791849600000, 90, 75),
  ("exam-wma12-w26-p01", "subj-edx-ial-pure2", "curr-edexcel-ial", "Pure Mathematics 2", "Edexcel", "IAL", "WMA12", "October", "w26", "01", 1792022400000, 90, 75),
  ("exam-wst01-w26-p01", "subj-edx-ial-stat1", "curr-edexcel-ial", "Statistics S1", "Edexcel", "IAL", "WST01", "October", "w26", "01", 1792368000000, 90, 75),
  ("exam-wma13-w26-p01", "subj-edx-ial-pure3", "curr-edexcel-ial", "Pure Mathematics 3", "Edexcel", "IAL", "WMA13", "October", "w26", "01", 1792540800000, 90, 75),
  ("exam-wme02-w26-p01", "subj-edx-ial-mech2", "curr-edexcel-ial", "Mechanics M2", "Edexcel", "IAL", "WME02", "October", "w26", "01", 1792627200000, 90, 75),
  ("exam-wst02-w26-p01", "subj-edx-ial-stat2", "curr-edexcel-ial", "Statistics S2", "Edexcel", "IAL", "WST02", "October", "w26", "01", 1792972800000, 90, 75),
  ("exam-wma14-w26-p01", "subj-edx-ial-pure4", "curr-edexcel-ial", "Pure Mathematics 4", "Edexcel", "IAL", "WMA14", "October", "w26", "01", 1793145600000, 90, 75),
  ("exam-wph11-w26-p01", "subj-edx-ial-phys1", "curr-edexcel-ial", "Physics Unit 1: Mechanics and Materials", "Edexcel", "IAL", "WPH11", "October", "w26", "01", 1791417600000, 90, 80),
  ("exam-wph12-w26-p01", "subj-edx-ial-phys2", "curr-edexcel-ial", "Physics Unit 2: Waves and Electricity", "Edexcel", "IAL", "WPH12", "October", "w26", "01", 1792022400000, 90, 80),
  ("exam-wph13-w26-p01", "subj-edx-ial-phys3", "curr-edexcel-ial", "Physics Unit 3: Practical Skills in Physics I", "Edexcel", "IAL", "WPH13", "October", "w26", "01", 1792368000000, 80, 50),
  ("exam-wph14-w26-p01", "subj-edx-ial-phys4", "curr-edexcel-ial", "Physics Unit 4: Further Mechanics, Fields & Particles", "Edexcel", "IAL", "WPH14", "October", "w26", "01", 1792540800000, 105, 90),
  ("exam-wph15-w26-p01", "subj-edx-ial-phys5", "curr-edexcel-ial", "Physics Unit 5: Thermodynamics, Radiation & Oscillations", "Edexcel", "IAL", "WPH15", "October", "w26", "01", 1793145600000, 105, 90),
  ("exam-wph16-w26-p01", "subj-edx-ial-phys6", "curr-edexcel-ial", "Physics Unit 6: Practical Skills in Physics II", "Edexcel", "IAL", "WPH16", "October", "w26", "01", 1793318400000, 80, 50),
  ("exam-wch11-w26-p01", "subj-edx-ial-chem1", "curr-edexcel-ial", "Chemistry Unit 1: Structure, Bonding & Intro Organic", "Edexcel", "IAL", "WCH11", "October", "w26", "01", 1791504000000, 90, 80),
  ("exam-wch12-w26-p01", "subj-edx-ial-chem2", "curr-edexcel-ial", "Chemistry Unit 2: Energetics, Group Chemistry & Halogenoalkanes", "Edexcel", "IAL", "WCH12", "October", "w26", "01", 1791849600000, 90, 80),
  ("exam-wch13-w26-p01", "subj-edx-ial-chem3", "curr-edexcel-ial", "Chemistry Unit 3: Practical Skills in Chemistry I", "Edexcel", "IAL", "WCH13", "October", "w26", "01", 1792454400000, 80, 50),
  ("exam-wch14-w26-p01", "subj-edx-ial-chem4", "curr-edexcel-ial", "Chemistry Unit 4: Rates, Equilibria & Further Organic", "Edexcel", "IAL", "WCH14", "October", "w26", "01", 1792627200000, 105, 90),
  ("exam-wch15-w26-p01", "subj-edx-ial-chem5", "curr-edexcel-ial", "Chemistry Unit 5: Transition Metals & Organic Nitrogen", "Edexcel", "IAL", "WCH15", "October", "w26", "01", 1792972800000, 105, 90),
  ("exam-wch16-w26-p01", "subj-edx-ial-chem6", "curr-edexcel-ial", "Chemistry Unit 6: Practical Skills in Chemistry II", "Edexcel", "IAL", "WCH16", "October", "w26", "01", 1793232000000, 80, 50),
  ("exam-wbi11-w26-p01", "subj-edx-ial-bio1", "curr-edexcel-ial", "Biology Unit 1: Molecules, Diet, Transport & Health", "Edexcel", "IAL", "WBI11", "October", "w26", "01", 1791763200000, 90, 80),
  ("exam-wbi12-w26-p01", "subj-edx-ial-bio2", "curr-edexcel-ial", "Biology Unit 2: Cells, Development & Biodiversity", "Edexcel", "IAL", "WBI12", "October", "w26", "01", 1791936000000, 90, 80),
  ("exam-wbi13-w26-p01", "subj-edx-ial-bio3", "curr-edexcel-ial", "Biology Unit 3: Practical Skills in Biology I", "Edexcel", "IAL", "WBI13", "October", "w26", "01", 1792108800000, 80, 50),
  ("exam-wbi14-w26-p01", "subj-edx-ial-bio4", "curr-edexcel-ial", "Biology Unit 4: Energy, Environment & Microbiology", "Edexcel", "IAL", "WBI14", "October", "w26", "01", 1792713600000, 105, 90),
  ("exam-wbi15-w26-p01", "subj-edx-ial-bio5", "curr-edexcel-ial", "Biology Unit 5: Respiration, Coordination & Gene Tech", "Edexcel", "IAL", "WBI15", "October", "w26", "01", 1793059200000, 105, 90),
  ("exam-wbi16-w26-p01", "subj-edx-ial-bio6", "curr-edexcel-ial", "Biology Unit 6: Practical Skills in Biology II", "Edexcel", "IAL", "WBI16", "October", "w26", "01", 1793232000000, 80, 50),
  ("exam-wec11-w26-p01", "subj-edx-ial-econ1", "curr-edexcel-ial", "Economics Unit 1: Markets in Action", "Edexcel", "IAL", "WEC11", "October", "w26", "01", 1791763200000, 105, 80),
  ("exam-wec12-w26-p01", "subj-edx-ial-econ2", "curr-edexcel-ial", "Economics Unit 2: Macroeconomic Performance", "Edexcel", "IAL", "WEC12", "October", "w26", "01", 1792108800000, 105, 80),
  ("exam-wec13-w26-p01", "subj-edx-ial-econ3", "curr-edexcel-ial", "Economics Unit 3: Business Behaviour", "Edexcel", "IAL", "WEC13", "October", "w26", "01", 1792713600000, 120, 80),
  ("exam-wec14-w26-p01", "subj-edx-ial-econ4", "curr-edexcel-ial", "Economics Unit 4: Global Economy", "Edexcel", "IAL", "WEC14", "October", "w26", "01", 1793318400000, 120, 80),
  ("exam-wbs11-w26-p01", "subj-edx-ial-biz1", "curr-edexcel-ial", "Business Unit 1: Marketing and People", "Edexcel", "IAL", "WBS11", "October", "w26", "01", 1791417600000, 120, 80),
  ("exam-wbs12-w26-p01", "subj-edx-ial-biz2", "curr-edexcel-ial", "Business Unit 2: Managing Business Activities", "Edexcel", "IAL", "WBS12", "October", "w26", "01", 1791936000000, 120, 80),
  ("exam-wbs13-w26-p01", "subj-edx-ial-biz3", "curr-edexcel-ial", "Business Unit 3: Business Decisions and Strategy", "Edexcel", "IAL", "WBS13", "October", "w26", "01", 1792454400000, 120, 80),
  ("exam-wbs14-w26-p01", "subj-edx-ial-biz4", "curr-edexcel-ial", "Business Unit 4: Global Business", "Edexcel", "IAL", "WBS14", "October", "w26", "01", 1793059200000, 120, 80),
  ("exam-wac11-w26-p01", "subj-edx-ial-acc1", "curr-edexcel-ial", "Accounting Unit 1: Accounting System & Costing", "Edexcel", "IAL", "WAC11", "October", "w26", "01", 1792454400000, 180, 100),
  ("exam-wac12-w26-p01", "subj-edx-ial-acc2", "curr-edexcel-ial", "Accounting Unit 2: Corporate & Management Accounting", "Edexcel", "IAL", "WAC12", "October", "w26", "01", 1793059200000, 180, 100),
]


def esc(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main():
    lines = []
    cols = "(id, subject_id, curriculum_id, title, exam_board, qualification_type, syllabus_code, season, series, paper_number, exam_date, duration_minutes, total_marks, created_at)"
    chunk = []
    for row in ROWS:
        eid, sid, cid, title, board, qual, code, season, series, paper, date_ms, dur, marks = row
        chunk.append(
            "("
            + ", ".join(
                [
                    esc(eid),
                    esc(sid),
                    esc(cid),
                    esc(title),
                    esc(board),
                    esc(qual),
                    esc(code),
                    esc(season),
                    esc(series),
                    esc(paper),
                    str(date_ms),
                    str(dur),
                    str(marks),
                    CREATED,
                ]
            )
            + ")"
        )
        if len(chunk) >= 20:
            lines.append(f"INSERT OR IGNORE INTO exams {cols} VALUES\n" + ",\n".join(chunk) + ";\n")
            chunk = []
    if chunk:
        lines.append(f"INSERT OR IGNORE INTO exams {cols} VALUES\n" + ",\n".join(chunk) + ";\n")
    OUT.write_text("".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} rows={len(ROWS)}")


if __name__ == "__main__":
    main()
