"""Generate syllabus topic seeds and subtopic backfills from official PDFs."""
from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path

import pymupdf as fitz

ROOT = Path(__file__).resolve().parent
PDFS = ROOT / "pdfs"
MANIFEST = PDFS / "manifest.json"
VALIDATE = ROOT / "_validate_all_seeds.py"

OUT_CAIE_AL = ROOT / "0011_topics_caie_alevel.sql"
OUT_CAIE_IGCSE_BACKFILL = ROOT / "0017_backfill_caie_igcse_subtopics.sql"
OUT_EDX_IGCSE_BACKFILL = ROOT / "0018_backfill_edexcel_igcse_subtopics.sql"
OUT_EDX_IAL_BACKFILL = ROOT / "0019_backfill_edexcel_ial_subtopics.sql"
OUT_EXTRAS = ROOT / "0020_topics_extras.sql"
OUT_CAIE_AL_BACKFILL = ROOT / "0021_backfill_caie_alevel_subtopics.sql"

SEED_FILES = [
    OUT_CAIE_AL.name,
    OUT_CAIE_IGCSE_BACKFILL.name,
    OUT_EDX_IGCSE_BACKFILL.name,
    OUT_EDX_IAL_BACKFILL.name,
    OUT_EXTRAS.name,
    OUT_CAIE_AL_BACKFILL.name,
]

COMING_SOON_LABEL = "Coming soon"
COMING_SOON_SUBTOPICS = [COMING_SOON_LABEL]

CAIE_AL_DOC_IDS: dict[str, tuple[str, str]] = {
    "697427": ("9709", "subj-caie-al-maths"),
    "697357": ("9231", "subj-caie-al-fmaths"),
    "664563": ("9701", "subj-caie-al-chem"),
    "744622": ("9700", "subj-caie-al-bio"),
    "744626": ("9702", "subj-caie-al-phys"),
    "721397": ("9618", "subj-caie-al-cs"),
    "662482": ("9626", "subj-caie-al-it"),
    "697423": ("9708", "subj-caie-al-econ"),
    "697371": ("9609", "subj-caie-al-biz"),
    "697417": ("9706", "subj-caie-al-acc"),
    "721359": ("9093", "subj-caie-al-eng-lang"),
    "721410": ("9695", "subj-caie-al-lit"),
}

# Official syllabus/spec PDF not uploaded yet — leave placeholder subtopics.
SUBJECTS_COMING_SOON = {
    "subj-edx-ial-eng1",
    "subj-edx-ial-eng2",
    "subj-edx-ial-eng3",
    "subj-edx-ial-eng4",
    "subj-edx-ial-lit1",
    "subj-edx-ial-lit2",
    "subj-edx-ial-lit3",
    "subj-edx-ial-lit4",
}

CIE_DOC_IDS: dict[str, tuple[str, str]] = {
    "662466": ("0580", "subj-caie-igcse-maths"),
    "662470": ("0606", "subj-caie-igcse-addmaths"),
    "697139": ("0417", "subj-caie-igcse-ict"),
    "697146": ("0450", "subj-caie-igcse-biz"),
    "697167": ("0478", "subj-caie-igcse-cs"),
    "697203": ("0610", "subj-caie-igcse-bio"),
    "697205": ("0620", "subj-caie-igcse-chem"),
    "697209": ("0625", "subj-caie-igcse-phys"),
    "718141": ("0452", "subj-caie-igcse-acc"),
    "718148": ("0455", "subj-caie-igcse-econ"),
    "718783": ("0500", "subj-caie-igcse-eng-first"),
    "721337": ("0510", "subj-caie-igcse-esl"),
}

EDEXCEL_IGCSE_PDFS: dict[str, tuple[str, str]] = {
    "subj-edx-igcse-maths-a": ("4MA1", "international-gcse-in-mathematics-spec-a.pdf"),
    "subj-edx-igcse-maths-b": ("4MB1", "international-gcse-in-mathematics-spec-b.pdf"),
    "subj-edx-igcse-fmaths": ("4PM1", "international-gcse-in-further-pure-mathematics-spec.pdf"),
    "subj-edx-igcse-phys": ("4PH1", "international-gcse-physics-2017-specification.pdf"),
    "subj-edx-igcse-chem": ("4CH1", "international-gcse-chemistry-2017-specification.pdf"),
    "subj-edx-igcse-bio": ("4BI1", "international-gcse-biology-2017-specification1.pdf"),
    "subj-edx-igcse-human-bio": ("4HB1", "international-gcse-human-biology-2017-spec.pdf"),
    "subj-edx-igcse-cs": ("4CP0", "international-gcse-in-Computer-Science-Specification.pdf"),
    "subj-edx-igcse-ict": ("4IT1", "international-gcse-in-ict-spec.pdf"),
    "subj-edx-igcse-eng-b": ("4EB1", "international-gcse-english-lang-b-specification.pdf"),
    "subj-edx-igcse-esl": ("4ES1", "int-gcse-english-esl.pdf"),
    "subj-edx-igcse-econ": ("4EC1", "international-gcse-spec-9781446942789.pdf"),
    "subj-edx-igcse-biz": ("4BS1", "9781446942765-international-gcse-business-specification.pdf"),
    "subj-edx-igcse-acc": ("4AC1", "ig-accountancy-spec.pdf"),
}

EDEXCEL_IAL_PDF_UNITS: dict[str, tuple[str, list[tuple[str, str, list[str]]]]] = {
    "international-a-level-maths-spec.pdf": (
        "Edexcel/{}".format("international-a-level-maths-spec.pdf"),
        [
            ("subj-edx-ial-pure1", "P1", ["Pure Mathematics 1", "Unit P1"]),
            ("subj-edx-ial-pure2", "P2", ["Pure Mathematics 2", "Unit P2"]),
            ("subj-edx-ial-pure3", "P3", ["Pure Mathematics 3", "Unit P3"]),
            ("subj-edx-ial-pure4", "P4", ["Pure Mathematics 4", "Unit P4"]),
            ("subj-edx-ial-fmath1", "FP1", ["Further Pure Mathematics 1", "Unit FP1", "F1"]),
            ("subj-edx-ial-fmath2", "FP2", ["Further Pure Mathematics 2", "Unit FP2", "F2"]),
            ("subj-edx-ial-fmath3", "FP3", ["Further Pure Mathematics 3", "Unit FP3", "F3"]),
            ("subj-edx-ial-mech1", "M1", ["Mechanics 1", "Unit M1"]),
            ("subj-edx-ial-mech2", "M2", ["Mechanics 2", "Unit M2"]),
            ("subj-edx-ial-mech3", "M3", ["Mechanics 3", "Unit M3", "M3:"]),
            ("subj-edx-ial-stat1", "S1", ["Statistics 1", "Unit S1"]),
            ("subj-edx-ial-stat2", "S2", ["Statistics 2", "Unit S2"]),
            ("subj-edx-ial-stat3", "S3", ["Statistics 3", "Unit S3", "S3:"]),
            ("subj-edx-ial-dec1", "D1", ["Decision Mathematics 1", "Unit D1"]),
        ],
    ),
    "9781446957783_IAL_Physics_Iss3.pdf": (
        "Edexcel/9781446957783_IAL_Physics_Iss3.pdf",
        [(f"subj-edx-ial-phys{i}", f"U{i}", [f"Unit {i}", f"Physics Unit {i}"]) for i in range(1, 7)],
    ),
    "International-A-Level-Chemistry-Spec.pdf": (
        "Edexcel/International-A-Level-Chemistry-Spec.pdf",
        [(f"subj-edx-ial-chem{i}", f"U{i}", [f"Unit {i}"]) for i in range(1, 7)],
    ),
    "International-A-Level-Biology-Spec.pdf": (
        "Edexcel/International-A-Level-Biology-Spec.pdf",
        [(f"subj-edx-ial-bio{i}", f"U{i}", [f"Unit {i}"]) for i in range(1, 7)],
    ),
    "International-A-Level-Business-Spec.pdf": (
        "Edexcel/International-A-Level-Business-Spec.pdf",
        [(f"subj-edx-ial-biz{i}", f"U{i}", [f"Unit {i}"]) for i in range(1, 5)],
    ),
    "International-A-Level-Economics-spec.pdf": (
        "Edexcel/International-A-Level-Economics-spec.pdf",
        [(f"subj-edx-ial-econ{i}", f"U{i}", [f"Unit {i}"]) for i in range(1, 5)],
    ),
    "pearson-edexcel-ial-accounting-specification.pdf": (
        "Edexcel/pearson-edexcel-ial-accounting-specification.pdf",
        [(f"subj-edx-ial-acc{i}", f"U{i}", [f"Unit {i}"]) for i in range(1, 3)],
    ),
    "International-AL-Information-Technology-Spec.pdf": (
        "Edexcel/International-AL-Information-Technology-Spec.pdf",
        [(f"subj-edx-ial-it{i}", f"U{i}", [f"Unit {i}"]) for i in range(1, 5)],
    ),
    "ial-computer-science-specification.pdf": (
        "Edexcel/ial-computer-science-specification.pdf",
        [(f"subj-edx-ial-cs{i}", f"U{i}", [f"Unit {i}"]) for i in range(1, 5)],
    ),
    "ial-psychology-specification.pdf": (
        "Edexcel/ial-psychology-specification.pdf",
        [
            ("subj-edx-ial-psych1", "WPS01", ["Unit 1", "WPS01", "Social and cognitive psychology"]),
            ("subj-edx-ial-psych2", "WPS02", ["Unit 2", "WPS02", "Biological psychology"]),
            ("subj-edx-ial-psych3", "WPS03", ["Unit 3", "WPS03", "Applications of psychology"]),
            ("subj-edx-ial-psych4", "WPS04", ["Unit 4", "WPS04", "Clinical psychology"]),
        ],
    ),
}

EXTRAS_SUBJECTS = {
    "subj-edx-ial-mech3",
    "subj-edx-ial-stat3",
    "subj-edx-ial-psych1",
    "subj-edx-ial-psych2",
    "subj-edx-ial-psych3",
    "subj-edx-ial-psych4",
}

CAIE_ENGLISH_SUBTOPICS: dict[str, dict[str, list[str]]] = {
    "subj-caie-igcse-eng-first": {
        "Reading": [
            "R1 Demonstrate understanding of explicit meanings",
            "R2 Demonstrate understanding of implicit meanings and attitudes",
            "R3 Analyse, evaluate and develop facts, ideas and opinions",
            "R4 Demonstrate understanding of how writers achieve effects",
            "R5 Select and use information for specific purposes",
            "R6 Summarise and synthesise ideas from texts",
        ],
        "Writing": [
            "W1 Express what is thought, felt and imagined",
            "W2 Organise and convey facts, ideas and opinions",
            "W3 Demonstrate a varied vocabulary appropriate to context",
            "W4 Demonstrate effective sentence structures",
            "W5 Demonstrate understanding of audience, purpose and form",
            "W6 Demonstrate accuracy in spelling, punctuation and grammar",
        ],
        "Speaking and Listening": [
            "S1 Communicate clearly and fluently",
            "S2 Structure and present ideas coherently",
            "S3 Listen and respond appropriately",
            "S4 Use register suited to audience and purpose",
            "S5 Engage in discussion and exchange views",
            "S6 Speak with clarity, pace and expression",
        ],
    },
    "subj-caie-igcse-esl": {
        "Reading": [
            "R1 Identify main ideas and specific details",
            "R2 Understand gist and purpose of texts",
            "R3 Deduce meaning from context",
            "R4 Recognise attitude and opinion",
        ],
        "Writing": [
            "W1 Produce structured continuous writing",
            "W2 Use appropriate register and format",
            "W3 Organise ideas with cohesive devices",
            "W4 Use accurate grammar and vocabulary",
            "W5 Complete form-filling and note-making tasks",
        ],
        "Listening": [
            "L1 Identify gist and detail in spoken texts",
            "L2 Understand attitude and purpose",
            "L3 Follow announcements, interviews and discussions",
            "L4 Extract information for note completion",
        ],
        "Speaking": [
            "S1 Respond in a general interview",
            "S2 Deliver a short talk on a topic card",
            "S3 Discuss a theme with the examiner",
            "S4 Maintain interaction and intelligibility",
            "S5 Use appropriate pronunciation and intonation",
        ],
    },
}

# Edexcel IGCSE English specs use assessment objectives rather than numbered syllabus codes.
EDEXCEL_ENGLISH_SUBTOPICS: dict[str, dict[str, list[str]]] = {
    "subj-edx-igcse-eng-b": {
        "Reading: Non-fiction and Unseen Texts": [
            "AO1 Read and understand a variety of texts, selecting and interpreting information, ideas and perspectives",
            "AO2 Understand and analyse how writers use linguistic and structural devices to achieve their effects",
            "AO3 Explore links and connections between writers' ideas and perspectives, as well as how these are conveyed",
        ],
        "Directed Writing": [
            "AO1 Read and understand a variety of texts, selecting and interpreting information, ideas and perspectives",
            "AO4 Communicate effectively and imaginatively, adapting form, tone and register of writing for specific purposes and audiences",
            "AO5 Write clearly, using a range of vocabulary and sentence structures, with appropriate paragraphing and accurate spelling, grammar and punctuation",
        ],
        "Continuous Composition": [
            "AO4 Communicate effectively and imaginatively, adapting form, tone and register of writing for specific purposes and audiences",
            "AO5 Write clearly, using a range of vocabulary and sentence structures, with appropriate paragraphing and accurate spelling, grammar and punctuation",
        ],
    },
}

# Cambridge IGCSE 0478 topics 7, 9 and 10 use prose objectives (not N.M codes in the PDF extract).
CAIE_CS_0478_PROSE_SUBTOPICS: dict[int, list[str]] = {
    7: [
        "7.1 Understand the program development life cycle",
        "7.2 Decomposition and design methods for solutions",
        "7.3 Explain the purpose of a given algorithm",
        "7.4 Understand standard methods of solution",
        "7.5 Validation and verification checks on input data",
        "7.6 Suggest and apply suitable test data",
        "7.7 Complete a trace table for a dry-run of an algorithm",
        "7.8 Identify errors in algorithms and suggest corrections",
        "7.9 Write and amend algorithms using pseudocode, program code and flowcharts",
    ],
    9: [
        "9.1 Define a single-table database from given data storage requirements",
        "9.2 Suggest suitable basic data types",
        "9.3 Understand the purpose of a primary key and identify a suitable primary key",
        "9.4 Read, understand and complete SQL scripts to query data in a single database table",
    ],
    10: [
        "10.1 Identify and use the standard symbols for logic gates",
        "10.2 Define and understand the functions of logic gates",
        "10.3 Use logic gates to create logic circuits from a problem statement, logic expression or truth table",
    ],
}

CAIE_CS_0478_PDF_PREFIX = "697167"

CAIE_AL_TOPICS: dict[str, list[tuple[str, str, str, int, str, int, list[str]]]] = {
    "subj-caie-al-maths": [
        ("topic-caie-al-maths-01", "Pure Mathematics 1", "Functions, coordinate geometry, circular measure, trigonometry, series, differentiation and integration.", 1, "medium", 18, ["1.1 Quadratics", "1.2 Functions", "1.3 Coordinate geometry", "1.4 Circular measure", "1.5 Trigonometry", "1.6 Series", "1.7 Differentiation", "1.8 Integration"]),
        ("topic-caie-al-maths-02", "Pure Mathematics 2", "Algebra, logarithmic and exponential functions, trigonometry, differentiation, integration and numerical solutions.", 2, "hard", 20, ["2.1 Algebra", "2.2 Logarithmic and exponential functions", "2.3 Trigonometry", "2.4 Differentiation", "2.5 Integration", "2.6 Numerical solutions"]),
        ("topic-caie-al-maths-03", "Pure Mathematics 3", "Algebra, logarithmic and exponential functions, trigonometry, differentiation, integration, vectors and differential equations.", 3, "hard", 22, ["3.1 Algebra", "3.2 Logarithmic and exponential functions", "3.3 Trigonometry", "3.4 Differentiation", "3.5 Integration", "3.6 Numerical solutions", "3.7 Vectors", "3.8 Differential equations", "3.9 Complex numbers"]),
        ("topic-caie-al-maths-04", "Mechanics", "Forces and equilibrium, kinematics, Newton's laws, energy, work and power, and momentum.", 4, "hard", 16, ["4.1 Forces and equilibrium", "4.2 Kinematics of motion in a straight line", "4.3 Momentum", "4.4 Newton's laws of motion", "4.5 Energy, work and power"]),
        ("topic-caie-al-maths-05", "Probability and Statistics 1", "Representation of data, permutations and combinations, probability, discrete random variables and normal distribution.", 5, "medium", 16, ["5.1 Representation of data", "5.2 Permutations and combinations", "5.3 Probability", "5.4 Discrete random variables", "5.5 Normal distribution"]),
        ("topic-caie-al-maths-06", "Probability and Statistics 2", "Poisson distribution, linear combinations of random variables, continuous random variables, sampling and hypothesis testing.", 6, "hard", 16, ["6.1 Poisson distribution", "6.2 Linear combinations of random variables", "6.3 Continuous random variables", "6.4 Sampling and estimation", "6.5 Hypothesis tests"]),
    ],
    "subj-caie-al-fmaths": [
        ("topic-caie-al-fmaths-01", "Further Pure Mathematics 1", "Roots of polynomial equations, rational functions, summation of series, matrices and polar coordinates.", 1, "hard", 18, ["1.1 Roots of polynomial equations", "1.2 Rational functions and graphs", "1.3 Summation of series", "1.4 Matrices", "1.5 Polar coordinates", "1.6 Vectors", "1.7 Proof by induction"]),
        ("topic-caie-al-fmaths-02", "Further Mechanics", "Projectiles, equilibrium of a rigid body, circular motion, Hooke's law and linear motion under a variable force.", 2, "hard", 16, ["2.1 Projectiles", "2.2 Equilibrium of a rigid body", "2.3 Circular motion", "2.4 Hooke's law", "2.5 Linear motion under a variable force"]),
        ("topic-caie-al-fmaths-03", "Further Probability and Statistics", "Continuous random variables, inference using normal and t-distributions, chi-squared tests and bivariate data.", 3, "hard", 16, ["3.1 Continuous random variables", "3.2 Inference using normal and t-distributions", "3.3 Chi-squared tests", "3.4 Non-parametric tests", "3.5 Probability generating functions"]),
    ],
    "subj-caie-al-phys": [
        ("topic-caie-al-phys-01", "Physical quantities and units", "Physical quantities, SI units, errors, uncertainties, scalars and vectors.", 1, "easy", 6, []),
        ("topic-caie-al-phys-02", "Kinematics", "Motion in one and two dimensions, graphs and projectile motion.", 2, "medium", 10, []),
        ("topic-caie-al-phys-03", "Dynamics", "Newton's laws, momentum and force.", 3, "medium", 10, []),
        ("topic-caie-al-phys-04", "Forces, density and pressure", "Moments, equilibrium, density and pressure.", 4, "medium", 10, []),
        ("topic-caie-al-phys-05", "Work, energy and power", "Work done, kinetic and potential energy, power and efficiency.", 5, "medium", 10, []),
        ("topic-caie-al-phys-06", "Deformation of solids", "Stress, strain, Hooke's law and elastic behaviour.", 6, "medium", 8, []),
        ("topic-caie-al-phys-07", "Waves", "Progressive waves, intensity, polarization and the electromagnetic spectrum.", 7, "medium", 10, []),
        ("topic-caie-al-phys-08", "Superposition", "Stationary waves, diffraction, interference and diffraction gratings.", 8, "medium", 10, []),
        ("topic-caie-al-phys-09", "Electricity", "Current, potential difference, resistance and resistivity.", 9, "medium", 12, []),
        ("topic-caie-al-phys-10", "D.C. circuits", "Practical circuits, Kirchhoff's laws and potential dividers.", 10, "hard", 12, []),
        ("topic-caie-al-phys-11", "Particle physics", "Atoms, nuclei, radiation and fundamental particles.", 11, "hard", 12, []),
        ("topic-caie-al-phys-12", "Motion in a circle", "Uniform circular motion and centripetal acceleration.", 12, "hard", 8, []),
        ("topic-caie-al-phys-13", "Gravitational fields", "Gravitational field strength and force between masses.", 13, "hard", 8, []),
        ("topic-caie-al-phys-14", "Temperature", "Thermal equilibrium and temperature scales.", 14, "medium", 6, []),
        ("topic-caie-al-phys-15", "Ideal gases", "The mole, equation of state and kinetic theory.", 15, "hard", 8, []),
        ("topic-caie-al-phys-16", "Thermodynamics", "Internal energy, heating and work done by gases.", 16, "hard", 8, []),
        ("topic-caie-al-phys-17", "Oscillations", "Simple harmonic motion, damping and resonance.", 17, "hard", 10, []),
        ("topic-caie-al-phys-18", "Electric fields", "Field lines, uniform fields and electric potential.", 18, "hard", 10, []),
        ("topic-caie-al-phys-19", "Capacitance", "Capacitors, energy stored and discharge.", 19, "hard", 8, []),
        ("topic-caie-al-phys-20", "Magnetic fields", "Magnetic fields and forces on conductors.", 20, "hard", 10, []),
        ("topic-caie-al-phys-21", "Alternating currents", "A.C. characteristics and rectification.", 21, "hard", 8, []),
        ("topic-caie-al-phys-22", "Quantum physics", "Photons, photoelectric effect and wave-particle duality.", 22, "hard", 10, []),
        ("topic-caie-al-phys-23", "Nuclear physics", "Mass defect, binding energy and radioactive decay.", 23, "hard", 10, []),
        ("topic-caie-al-phys-24", "Medical physics", "Ultrasound, X-rays and diagnostic imaging.", 24, "hard", 8, []),
        ("topic-caie-al-phys-25", "Astronomy and cosmology", "Stars, galaxies, redshift and the expanding universe.", 25, "hard", 8, []),
    ],
    "subj-caie-al-chem": [
        ("topic-caie-al-chem-01", "Atomic structure and bonding", "Electronic configuration, ionisation energy, bonding and shapes of molecules.", 1, "medium", 12, ["1.1 Particles in the atom", "1.2 Isotopes", "1.3 Electrons and orbitals", "1.4 Ionisation energy", "1.5 Ionic bonding", "1.6 Covalent bonding", "1.7 Shapes of molecules"]),
        ("topic-caie-al-chem-02", "Stoichiometry and energetics", "The mole, formulae, equations, enthalpy changes and Hess's law.", 2, "medium", 14, ["2.1 Relative masses", "2.2 The mole", "2.3 Formulae and equations", "2.4 Enthalpy changes", "2.5 Hess's law", "2.6 Bond energies"]),
        ("topic-caie-al-chem-03", "Rates, equilibrium and acids", "Collision theory, equilibrium constants, acids, bases and pH.", 3, "hard", 14, ["3.1 Collision theory", "3.2 Rate equations", "3.3 Equilibrium", "3.4 Acids and bases", "3.5 pH and buffers"]),
        ("topic-caie-al-chem-04", "Redox and periodicity", "Oxidation numbers, electrochemistry and trends in the Periodic Table.", 4, "medium", 12, ["4.1 Redox", "4.2 Electrode potentials", "4.3 Period 3 trends", "4.4 Group 2 and Group 17"]),
        ("topic-caie-al-chem-05", "Organic chemistry", "Hydrocarbons, halogen compounds, alcohols, carbonyls and analysis techniques.", 5, "hard", 18, ["5.1 Alkanes", "5.2 Alkenes", "5.3 Halogen compounds", "5.4 Alcohols", "5.5 Carbonyl compounds", "5.6 Carboxylic acids", "5.7 Spectroscopy"]),
        ("topic-caie-al-chem-06", "Transition elements and polymer chemistry", "Complex ions, catalysis, polymerisation and organic synthesis.", 6, "hard", 14, ["6.1 Transition elements", "6.2 Complex ions", "6.3 Polymerisation", "6.4 Organic synthesis"]),
    ],
    "subj-caie-al-bio": [
        ("topic-caie-al-bio-01", "Cell structure and biological molecules", "Microscopy, organelles, water, carbohydrates, lipids and proteins.", 1, "medium", 12, ["1.1 Cell structure", "1.2 Microscopy", "1.3 Water", "1.4 Carbohydrates", "1.5 Lipids", "1.6 Proteins"]),
        ("topic-caie-al-bio-02", "Transport and disease", "Cell membranes, transport, the heart, blood vessels and disease.", 2, "medium", 14, ["2.1 Cell surface membranes", "2.2 Transport", "2.3 The heart", "2.4 Blood vessels", "2.5 Pathogens and immunity"]),
        ("topic-caie-al-bio-03", "Gas exchange and infectious disease", "Gas exchange surfaces, ventilation, smoking and infectious disease.", 3, "medium", 12, ["3.1 Gas exchange", "3.2 Ventilation", "3.3 Smoking", "3.4 Infectious disease"]),
        ("topic-caie-al-bio-04", "Photosynthesis and respiration", "Photosynthesis, respiration and energy transfer.", 4, "hard", 14, ["4.1 Photosynthesis", "4.2 Respiration", "4.3 ATP and energy transfer"]),
        ("topic-caie-al-bio-05", "Homeostasis and coordination", "Homeostasis, the kidney, nerves, hormones and receptors.", 5, "hard", 14, ["5.1 Homeostasis", "5.2 The kidney", "5.3 Nerves", "5.4 Hormones", "5.5 Receptors"]),
        ("topic-caie-al-bio-06", "Inheritance and ecosystems", "DNA, protein synthesis, inheritance, selection and ecology.", 6, "hard", 16, ["6.1 DNA and protein synthesis", "6.2 Inheritance", "6.3 Selection", "6.4 Ecosystems", "6.5 Conservation"]),
    ],
    "subj-caie-al-cs": [
        ("topic-caie-al-cs-01", "Information representation", "Number systems, text, sound, images, compression and encryption.", 1, "medium", 10, ["1.1 Number systems", "1.2 Text representation", "1.3 Sound representation", "1.4 Image representation", "1.5 Compression", "1.6 Encryption"]),
        ("topic-caie-al-cs-02", "Communication and hardware", "Networks, protocols, hardware components and logic gates.", 2, "medium", 12, ["2.1 Networks", "2.2 Protocols", "2.3 Hardware", "2.4 Logic gates", "2.5 Processor architecture"]),
        ("topic-caie-al-cs-03", "Software and security", "Operating systems, applications, malware and security measures.", 3, "medium", 10, ["3.1 Operating systems", "3.2 Applications", "3.3 Malware", "3.4 Security measures"]),
        ("topic-caie-al-cs-04", "Algorithm design and programming", "Problem-solving, pseudocode, programming constructs and data structures.", 4, "hard", 18, ["4.1 Problem-solving", "4.2 Pseudocode", "4.3 Programming constructs", "4.4 Data structures", "4.5 File handling"]),
        ("topic-caie-al-cs-05", "Databases and computational thinking", "Relational databases, SQL, abstraction, decomposition and automation.", 5, "hard", 14, ["5.1 Relational databases", "5.2 SQL", "5.3 Abstraction", "5.4 Decomposition", "5.5 Automation"]),
    ],
    "subj-caie-al-it": [
        ("topic-caie-al-it-01", "Data and information", "Data types, validation, verification and information management.", 1, "medium", 10, ["1.1 Data and information", "1.2 Data types", "1.3 Validation and verification", "1.4 Information management"]),
        ("topic-caie-al-it-02", "Hardware and networks", "Computer components, storage, networks and emerging technologies.", 2, "medium", 12, ["2.1 Hardware", "2.2 Storage", "2.3 Networks", "2.4 Emerging technologies"]),
        ("topic-caie-al-it-03", "Software and systems", "Applications, systems software, development life cycle and testing.", 3, "medium", 12, ["3.1 Applications", "3.2 Systems software", "3.3 Development life cycle", "3.4 Testing"]),
        ("topic-caie-al-it-04", "Impact, security and project work", "Digital society, legal issues, security and practical project skills.", 4, "hard", 14, ["4.1 Digital society", "4.2 Legal issues", "4.3 Security", "4.4 Project skills"]),
    ],
    "subj-caie-al-econ": [
        ("topic-caie-al-econ-01", "Basic economic ideas", "Scarcity, choice, opportunity cost and production possibility curves.", 1, "easy", 8, ["1.1 Scarcity and choice", "1.2 Opportunity cost", "1.3 Production possibility curves", "1.4 Factors of production"]),
        ("topic-caie-al-econ-02", "Price system and microeconomics", "Demand, supply, elasticity, market failure and government intervention.", 2, "hard", 16, ["2.1 Demand and supply", "2.2 Elasticity", "2.3 Market failure", "2.4 Government intervention", "2.5 Firms and costs"]),
        ("topic-caie-al-econ-03", "Government macroeconomics", "National income, inflation, unemployment, fiscal and monetary policy.", 3, "hard", 16, ["3.1 National income", "3.2 Inflation", "3.3 Unemployment", "3.4 Fiscal policy", "3.5 Monetary policy"]),
        ("topic-caie-al-econ-04", "International economics", "Trade, exchange rates, balance of payments and development.", 4, "medium", 14, ["4.1 International trade", "4.2 Exchange rates", "4.3 Balance of payments", "4.4 Development"]),
    ],
    "subj-caie-al-biz": [
        ("topic-caie-al-biz-01", "Business and its environment", "Enterprise, stakeholders, business structure and external influences.", 1, "easy", 10, ["1.1 Enterprise", "1.2 Stakeholders", "1.3 Business structure", "1.4 External influences"]),
        ("topic-caie-al-biz-02", "Human resource management", "Motivation, leadership, recruitment, training and organisational culture.", 2, "medium", 12, ["2.1 Motivation", "2.2 Leadership", "2.3 Recruitment and training", "2.4 Organisational culture"]),
        ("topic-caie-al-biz-03", "Marketing and operations", "Market research, marketing mix, operations and quality.", 3, "medium", 14, ["3.1 Market research", "3.2 Marketing mix", "3.3 Operations", "3.4 Quality"]),
        ("topic-caie-al-biz-04", "Finance and strategy", "Sources of finance, accounts, ratios and strategic management.", 4, "hard", 16, ["4.1 Sources of finance", "4.2 Accounts", "4.3 Ratios", "4.4 Strategic management"]),
    ],
    "subj-caie-al-acc": [
        ("topic-caie-al-acc-01", "Financial accounting fundamentals", "Double entry, ledger accounts, trial balance and correction of errors.", 1, "medium", 12, ["1.1 Double entry", "1.2 Ledger accounts", "1.3 Trial balance", "1.4 Correction of errors"]),
        ("topic-caie-al-acc-02", "Financial statements", "Income statements, statements of financial position and partnerships.", 2, "hard", 16, ["2.1 Income statements", "2.2 Statements of financial position", "2.3 Partnerships", "2.4 Limited companies"]),
        ("topic-caie-al-acc-03", "Cost and management accounting", "Costing methods, budgeting, variance analysis and decision making.", 3, "hard", 14, ["3.1 Costing methods", "3.2 Budgeting", "3.3 Variance analysis", "3.4 Decision making"]),
        ("topic-caie-al-acc-04", "Analysis and interpretation", "Accounting ratios, cash flow statements and regulatory frameworks.", 4, "medium", 12, ["4.1 Accounting ratios", "4.2 Cash flow statements", "4.3 Regulatory frameworks"]),
    ],
    "subj-caie-al-eng-lang": [
        ("topic-caie-al-eng-lang-01", "Reading and language analysis", "Text types, language levels, audience, purpose and context.", 1, "medium", 14, ["1.1 Text types", "1.2 Language levels", "1.3 Audience and purpose", "1.4 Context"]),
        ("topic-caie-al-eng-lang-02", "Writing skills", "Directed writing, composition, register and accuracy.", 2, "hard", 16, ["2.1 Directed writing", "2.2 Composition", "2.3 Register", "2.4 Accuracy"]),
        ("topic-caie-al-eng-lang-03", "Language topics and issues", "Language change, acquisition, identity and global English.", 3, "hard", 14, ["3.1 Language change", "3.2 Language acquisition", "3.3 Language and identity", "3.4 Global English"]),
    ],
    "subj-caie-al-lit": [
        ("topic-caie-al-lit-01", "Poetry and prose", "Close reading, themes, form, structure and literary contexts.", 1, "hard", 16, ["1.1 Close reading", "1.2 Themes", "1.3 Form and structure", "1.4 Literary contexts"]),
        ("topic-caie-al-lit-02", "Drama", "Character, staging, dramatic techniques and interpretation.", 2, "hard", 14, ["2.1 Character", "2.2 Staging", "2.3 Dramatic techniques", "2.4 Interpretation"]),
        ("topic-caie-al-lit-03", "Shakespeare and set texts", "Language, imagery, critical responses and comparative study.", 3, "hard", 16, ["3.1 Language and imagery", "3.2 Critical responses", "3.3 Comparative study", "3.4 Set texts"]),
        ("topic-caie-al-lit-04", "Unseen and coursework skills", "Unseen analysis, essay structure and literary argument.", 4, "hard", 14, ["4.1 Unseen analysis", "4.2 Essay structure", "4.3 Literary argument", "4.4 Coursework skills"]),
    ],
}


def normalize_name(name: str) -> str:
    name = name.lower().replace("(continued)", "").strip()
    name = re.sub(r"[^a-z0-9]+", " ", name)
    return " ".join(name.split())


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_name(a), normalize_name(b)).ratio()


def sql_quote(value: str) -> str:
    return value.replace("'", "''")


def parse_subtopic_label(label: str) -> dict[str, str]:
    match = re.match(
        r"^(\d+\.[A-Z]|[CE]?\d+\.\d+|\d+\.\d+|[A-Z]\d+)\s+(.+)$",
        label.strip(),
        re.I,
    )
    if match:
        return {"code": match.group(1), "title": match.group(2).strip()}
    return {"code": "", "title": label.strip()}


def sql_json_subtopics(items: list[str]) -> str:
    objs = [parse_subtopic_label(item) for item in items]
    return json.dumps(objs, ensure_ascii=False).replace("'", "''")


def sql_json_array(items: list[str]) -> str:
    return sql_json_subtopics(items)


def pdf_lines(pdf_path: Path) -> list[str]:
    doc = fitz.open(pdf_path)
    lines: list[str] = []
    for page in doc:
        lines.extend(page.get_text().splitlines())
    return lines


def clean_syllabus_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\x07", " ").replace("\ufb01", "fi")).strip()


def is_noise_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if s.isdigit():
        return True
    if "cambridge" in s.lower():
        return True
    if "www." in s.lower() or "back to contents" in s.lower():
        return True
    if s.startswith("Pearson Edexcel"):
        return True
    return False


def find_caie_content_start(lines: list[str]) -> int | None:
    as_starts = [
        i + 1
        for i, line in enumerate(lines)
        if line.strip() == "AS Level subject content"
    ]
    if as_starts:
        return as_starts[0]

    candidates: list[int] = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped in {"Core subject content", "Syllabus content", "Extended subject content"}:
            candidates.append(i + 1)
        if re.match(r"^3\s+Subject content", stripped):
            candidates.append(i)
        if stripped in {"AS Level subject content", "A Level subject content"}:
            candidates.append(i + 1)
    for start in reversed(candidates):
        window = lines[start : start + 80]
        if any(re.match(r"^([CE]?\d+\.\d+\t|\d+\.\d+$)", w.strip()) for w in window):
            return start
    return candidates[-1] if candidates else None


def parse_caie_overview_sections(lines: list[str]) -> dict[int, str]:
    sections: dict[int, str] = {}
    in_overview = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        lower = stripped.lower()
        if "syllabus overview" in lower or re.match(r"^2\s+syllabus overview", stripped, re.I):
            in_overview = True
            continue
        if re.match(r"^content overview$", stripped, re.I):
            in_overview = True
            continue
        if in_overview and (
            lower.startswith("assessment overview")
            or re.match(r"^4\s+assessment", stripped, re.I)
        ):
            if sections:
                break

        split_match = re.match(r"^(\d+)\t$", stripped)
        if split_match and in_overview and i + 1 < len(lines):
            num = int(split_match.group(1))
            title = clean_syllabus_text(lines[i + 1].strip()).replace(" (continued)", "")
            if num <= 25 and title and re.match(r"^[A-Z]", title) and len(title) < 90:
                sections[num] = title
            continue

        match = re.match(r"^(\d+)\t\s*(.+)$", line)
        if match and in_overview:
            num = int(match.group(1))
            name = match.group(2).strip().replace(" (continued)", "")
            if num > 25 or not re.match(r"^[A-Z]", name) or len(name) > 90:
                continue
            if name.lower().startswith(("outline ", "explain ", "describe ", "relate ", "state ", "define ")):
                continue
            sections[num] = name
    return sections


def is_valid_subtopic_code(code: str) -> bool:
    match = re.match(r"^([CE]?)(\d+)\.(\d+)$", code, re.I)
    if not match:
        return False
    main = int(match.group(2))
    sub = int(match.group(3))
    return main <= 30 and sub <= 20


def parse_caie_subtopic_groups(
    lines: list[str],
    overview: dict[int, str] | None = None,
) -> dict[int, dict[str, object]]:
    sections = overview or parse_caie_overview_sections(lines)
    groups: dict[int, list[str]] = {}
    pending_code: str | None = None
    pending_title_parts: list[str] = []

    def flush_pending() -> None:
        nonlocal pending_code, pending_title_parts
        if not pending_code:
            return
        if not is_valid_subtopic_code(pending_code):
            pending_code = None
            pending_title_parts = []
            return
        match = re.match(r"^([CE]?)(\d+)\.(\d+)$", pending_code, re.I)
        if not match:
            pending_code = None
            pending_title_parts = []
            return
        prefix = match.group(1).upper()
        main = int(match.group(2))
        sub = match.group(3)
        code = f"{prefix}{main}.{sub}" if prefix else f"{main}.{sub}"
        title = clean_syllabus_text(" ".join(pending_title_parts)).replace(" continued", "").strip()
        if title and title not in {"Notes and examples", "Notes", "Core", "Supplement"}:
            label = f"{code} {title[:120]}"
            groups.setdefault(main, [])
            if label not in groups[main]:
                groups[main].append(label)
        pending_code = None
        pending_title_parts = []

    for line in lines:
        stripped = line.strip().lstrip("\ufb01").lstrip("\x07")
        if not stripped or stripped in {"Core", "Supplement", "Notes and examples", "Notes"}:
            continue
        if "cambridge" in stripped.lower() or "www." in stripped.lower():
            continue

        tab_match = re.match(r"^([CE]?\d+\.\d+)\t\s*(.+)$", stripped, re.I)
        if tab_match:
            flush_pending()
            code = tab_match.group(1)
            if not is_valid_subtopic_code(code):
                continue
            title = clean_syllabus_text(tab_match.group(2)).replace(" continued", "").strip()
            match = re.match(r"^([CE]?)(\d+)\.(\d+)$", code, re.I)
            if match and title:
                main = int(match.group(2))
                prefix = match.group(1).upper()
                full_code = f"{prefix}{main}.{match.group(3)}" if prefix else f"{main}.{match.group(3)}"
                label = f"{full_code} {title[:120]}"
                groups.setdefault(main, [])
                if label not in groups[main]:
                    groups[main].append(label)
            continue

        code_only = re.match(r"^([CE]?\d+\.\d+)$", stripped, re.I)
        if code_only and is_valid_subtopic_code(code_only.group(1)):
            flush_pending()
            pending_code = code_only.group(1)
            continue

        if pending_code and re.match(r"^[A-Za-z(]", stripped) and not re.match(r"^[CE]?\d+\.", stripped):
            pending_title_parts.append(stripped)
            if len(" ".join(pending_title_parts)) > 50:
                flush_pending()

    flush_pending()

    return {
        main: {
            "name": sections.get(main, f"Section {main}"),
            "subs": subs,
        }
        for main, subs in sorted(groups.items())
        if subs
    }


def parse_caie_skills_sections(lines: list[str], start: int) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for line in lines[start:]:
        stripped = line.strip()
        if stripped.startswith("4 ") and "Details of the assessment" in stripped:
            break
        if stripped in {"Reading", "Writing", "Listening", "Speaking", "Speaking and Listening"}:
            current = stripped
            sections.setdefault(current, [])
            continue
        skill_match = re.match(r"^([RWLS]\d+)\s+(.+)$", stripped)
        if skill_match and current:
            label = f"{skill_match.group(1)} {skill_match.group(2).strip()[:120]}"
            sections[current].append(label)
            continue
        if current and stripped.startswith("\t"):
            bullet = stripped.lstrip("\t• \u2022 ").strip()
            if bullet and len(bullet) > 12:
                sections[current].append(bullet[:120])
    return sections


def parse_caie_igcse_pdf(pdf_path: Path) -> dict[int | str, dict[str, object]]:
    lines = pdf_lines(pdf_path)
    overview = parse_caie_overview_sections(lines)
    start = find_caie_content_start(lines)
    if start is None:
        grouped = parse_caie_subtopic_groups(lines, overview)
        return dict(grouped)

    skills = parse_caie_skills_sections(lines, start)
    if skills:
        return {
            name: {"name": name, "subs": subs}
            for name, subs in skills.items()
            if subs
        }

    content_lines = lines[start:]
    grouped = parse_caie_subtopic_groups(content_lines, overview)
    result: dict[int | str, dict[str, object]] = {
        main: {
            "name": overview.get(main, str(entry["name"])),
            "subs": [clean_syllabus_text(str(s)) for s in entry["subs"]],  # type: ignore[index]
        }
        for main, entry in grouped.items()
    }

    if pdf_path.name.startswith(CAIE_CS_0478_PDF_PREFIX):
        for sec, subs in CAIE_CS_0478_PROSE_SUBTOPICS.items():
            result[sec] = {
                "name": overview.get(sec, f"Section {sec}"),
                "subs": subs,
            }

    if not result:
        fallback = parse_caie_subtopic_groups(lines, overview)
        return dict(fallback)

    return result


def parse_caie_alevel_pdf(pdf_path: Path) -> dict[str, dict[str, object]]:
    return parse_caie_igcse_pdf(pdf_path)


def parse_edexcel_standalone_subcodes(lines: list[str]) -> dict[str, dict[str, object]]:
    section_names: dict[int, str] = {}
    groups: dict[int, list[str]] = {}

    for line in lines:
        stripped = line.strip()
        main_colon = re.match(r"^(\d+):\s*(.+)$", stripped)
        if main_colon:
            num = int(main_colon.group(1))
            name = main_colon.group(2).replace(" (continued)", "").strip()
            if num <= 20 and len(name) < 90:
                section_names[num] = name

    for i, line in enumerate(lines):
        stripped = line.strip()
        sub_match = re.match(r"^(\d+\.\d+)$", stripped)
        if not sub_match or i + 1 >= len(lines):
            continue
        code = sub_match.group(1)
        main = int(code.split(".")[0])
        if main > 20:
            continue
        title_parts: list[str] = []
        j = i + 1
        while j < len(lines):
            nxt = lines[j].strip()
            if not nxt or re.match(r"^\d+\.\d+$", nxt) or re.match(r"^\d+:", nxt):
                break
            if re.match(r"^[A-G]\s", nxt) or nxt in {"Notes", "Guidance"} or nxt.startswith("See "):
                j += 1
                continue
            if "Students should" in nxt:
                break
            if re.match(r"^[A-Za-z(]", nxt):
                title_parts.append(nxt)
                j += 1
                if len(" ".join(title_parts)) > 80:
                    break
                continue
            break
        if not title_parts:
            continue
        title = re.sub(r"\s+", " ", " ".join(title_parts)).strip()[:100]
        label = f"{code} {title}"
        groups.setdefault(main, [])
        if label not in groups[main]:
            groups[main].append(label)

    return {
        section_names.get(main, f"Section {main}"): {
            "name": section_names.get(main, f"Section {main}"),
            "subs": subs,
        }
        for main, subs in sorted(groups.items())
        if subs
    }


def parse_edexcel_inline_subcodes(lines: list[str]) -> dict[str, dict[str, object]]:
    section_names: dict[int, str] = {}
    groups: dict[int, list[str]] = {}

    for line in lines:
        stripped = line.strip()
        main_colon = re.match(r"^(\d+):\s*(.+)$", stripped)
        if main_colon:
            num = int(main_colon.group(1))
            name = main_colon.group(2).replace(" (continued)", "").strip()
            if num <= 20 and len(name) < 90:
                section_names[num] = name
        topic_colon = re.match(r"^Topic\s+(\d+):\s*(.+?)\.?$", stripped, re.I)
        if topic_colon:
            num = int(topic_colon.group(1))
            name = clean_syllabus_text(topic_colon.group(2))
            if num <= 20 and len(name) < 90:
                section_names[num] = name

    for line in lines:
        stripped = line.strip()
        if re.match(r"^\d+\.\d+\s+[–\-—]", stripped):
            continue
        match = re.match(r"^(\d+\.\d+)\s+([^0-9].+)$", stripped)
        if not match:
            continue
        code = match.group(1)
        main = int(code.split(".")[0])
        title = clean_syllabus_text(match.group(2))[:100]
        label = f"{code} {title}"
        groups.setdefault(main, [])
        if label not in groups[main]:
            groups[main].append(label)

    return {
        section_names.get(main, f"Section {main}"): {
            "name": section_names.get(main, f"Section {main}"),
            "subs": subs,
        }
        for main, subs in sorted(groups.items())
        if subs
    }


def parse_edexcel_econ_sections(lines: list[str]) -> dict[str, dict[str, object]]:
    groups: dict[str, dict[str, object]] = {}
    current_section: str | None = None

    for i, line in enumerate(lines):
        stripped = line.strip()
        section_match = re.match(r"^(\d+\.\d+)\s+[–\-—]\s*(.+)$", stripped)
        if section_match:
            current_section = section_match.group(1)
            title = clean_syllabus_text(section_match.group(2))
            groups[current_section] = {"name": title, "subs": []}
            continue

        sub_match = re.match(r"^(\d+\.\d+\.\d+)\s+(.+)$", stripped)
        if not sub_match or current_section is None:
            continue
        if not sub_match.group(1).startswith(f"{current_section}."):
            continue

        title_parts = [sub_match.group(2).strip()]
        j = i + 1
        while j < len(lines):
            nxt = lines[j].strip()
            if not nxt or re.match(r"^\d+\.\d+", nxt) or nxt.startswith("Pearson"):
                break
            if len(nxt) < 70 and not nxt.startswith("Students should"):
                title_parts.append(nxt)
                j += 1
            else:
                break
        label = f"{sub_match.group(1)} {clean_syllabus_text(' '.join(title_parts))[:100]}"
        subs = groups[current_section]["subs"]  # type: ignore[index]
        if label not in subs:
            subs.append(label)

    return {
        str(entry["name"]): entry
        for entry in groups.values()
        if entry.get("subs")
    }


def parse_edexcel_topic_sections(lines: list[str]) -> dict[str, dict[str, object]]:
    groups: dict[int, dict[str, object]] = {}
    current_num: int | None = None

    for i, line in enumerate(lines):
        stripped = line.strip()
        topic_match = re.match(r"^Topic\s+(\d+):\s*(.+?)\.?$", stripped, re.I)
        if topic_match:
            next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if next_line != "What students need to learn:":
                continue
            current_num = int(topic_match.group(1))
            title = clean_syllabus_text(topic_match.group(2))
            groups[current_num] = {"name": title, "subs": []}
            continue

        if current_num is None:
            continue

        if stripped.startswith("Assessment information") or stripped.startswith("Administration and general information"):
            current_num = None
            continue

        item_match = re.match(r"^(\d+)\s+([A-Za-z].*)$", stripped)
        if not item_match:
            continue

        title_parts = [item_match.group(2).strip()]
        j = i + 1
        while j < len(lines):
            nxt = lines[j].strip()
            if not nxt or re.match(r"^Topic\s+\d+:", nxt, re.I) or nxt.startswith("Pearson"):
                break
            if re.match(r"^(\d+)\s+[A-Za-z]", nxt) or re.match(r"^[a-z]\)", nxt):
                break
            if nxt.startswith("Assessment information") or nxt.startswith("Administration and general information"):
                break
            if nxt in {"Notes", "Guidance"} or nxt.startswith("To include"):
                j += 1
                continue
            if len(nxt) < 70:
                title_parts.append(nxt)
                j += 1
            else:
                break

        subs = groups[current_num]["subs"]  # type: ignore[index]
        item_num = len(subs) + 1
        label = f"{current_num}.{item_num} {clean_syllabus_text(' '.join(title_parts))[:100]}"
        if any(
            marker in label
            for marker in (
                "Assessment information",
                "Administration and general information",
                "OECD (2012)",
                "Koenig, J. A.",
            )
        ):
            current_num = None
            continue
        if label not in subs:
            subs.append(label)

    return {
        str(entry["name"]): entry
        for entry in groups.values()
        if entry.get("subs")
    }


def parse_edexcel_letter_sections(lines: list[str]) -> dict[str, dict[str, object]]:
    section_names: dict[int, str] = {}
    for line in lines:
        match = re.match(r"^(\d+):\s*(.+)$", line.strip())
        if match:
            num = int(match.group(1))
            name = match.group(2).replace(" (continued)", "").strip()
            if num <= 20 and len(name) < 90:
                section_names[num] = name

    groups: dict[int, dict[str, object]] = {}
    current_num: int | None = None

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith("Pearson") or stripped.isdigit():
            continue

        if stripped in section_names.values():
            lookahead = " ".join(lines[j].strip() for j in range(i + 1, min(i + 4, len(lines))))
            if "What students need to learn" not in lookahead:
                continue
            current_num = next(num for num, name in section_names.items() if name == stripped)
            groups[current_num] = {"name": stripped, "subs": []}
            continue

        if current_num is None:
            continue

        letter_match = re.match(r"^([A-Z])\s+(.+)$", stripped)
        if not letter_match or stripped.startswith("Assessment"):
            continue

        letter = letter_match.group(1)
        title_parts = [letter_match.group(2).strip()]
        j = i + 1
        while j < len(lines):
            nxt = lines[j].strip()
            if not nxt or re.match(r"^([A-Z])\s+", nxt) or nxt in section_names.values():
                break
            if nxt.startswith("Pearson") or nxt.startswith("What students need to learn"):
                break
            if nxt in {"Notes", "Guidance", "To include"}:
                j += 1
                continue
            if len(nxt) < 80:
                title_parts.append(nxt)
                j += 1
            else:
                break

        subs = groups[current_num]["subs"]  # type: ignore[index]
        label = f"{current_num}.{letter} {clean_syllabus_text(' '.join(title_parts))[:100]}"
        if label not in subs:
            subs.append(label)

    return {
        str(entry["name"]): entry
        for entry in groups.values()
        if entry.get("subs")
    }


def parse_edexcel_esl_units(lines: list[str]) -> dict[str, dict[str, object]]:
    unit_names = {
        1: "Reading skills",
        2: "Listening skills",
        3: "Writing skills",
        4: "Speaking and communication",
    }
    groups: dict[int, dict[str, object]] = {}
    current_unit: int | None = None
    in_content = False

    for i, line in enumerate(lines):
        stripped = line.strip()
        unit_match = re.match(r"^Unit\s+(\d+):\s*(.+)$", stripped, re.I)
        if unit_match:
            unit_num = int(unit_match.group(1))
            if unit_num in unit_names:
                current_unit = unit_num
                in_content = False
            continue

        content_match = re.match(r"^(\d+)\.1 Content description$", stripped)
        if content_match and current_unit == int(content_match.group(1)):
            in_content = True
            groups.setdefault(current_unit, {"name": unit_names[current_unit], "subs": []})
            continue

        if not in_content or current_unit is None:
            continue

        if re.match(r"^\d+\.2 Assessment information$", stripped) or stripped.startswith("Unit "):
            in_content = False
            continue

        if stripped in {"•", "\u2022"}:
            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                if nxt and nxt not in {"•", "\u2022"}:
                    bullet = clean_syllabus_text(nxt)[:120]
                    if len(bullet) > 20:
                        subs = groups[current_unit]["subs"]  # type: ignore[index]
                        label = f"{current_unit}.{len(subs) + 1} {bullet}"
                        subs.append(label)
                    break
                j += 1
            continue

        if stripped.startswith("•") or stripped.startswith("\u2022"):
            bullet = clean_syllabus_text(stripped.lstrip("•\u2022 ").strip())[:120]
            if len(bullet) > 20:
                subs = groups[current_unit]["subs"]  # type: ignore[index]
                label = f"{current_unit}.{len(subs) + 1} {bullet}"
                subs.append(label)

    return {
        str(entry["name"]): entry
        for entry in groups.values()
        if entry.get("subs")
    }


def parse_edexcel_igcse_pdf(pdf_path: Path) -> dict[str, dict[str, object]]:
    lines = pdf_lines(pdf_path)
    parsers = (
        parse_edexcel_standalone_subcodes,
        parse_edexcel_econ_sections,
        parse_edexcel_topic_sections,
        parse_edexcel_esl_units,
        parse_edexcel_inline_subcodes,
        parse_edexcel_letter_sections,
    )
    for parser in parsers:
        parsed = parser(lines)
        if parsed:
            return parsed
    return {}


def find_ial_unit_chunk(text: str, markers: list[str]) -> str:
    positions: list[int] = []
    for marker in markers:
        for match in re.finditer(re.escape(marker), text):
            pos = match.start()
            tail = text[pos : pos + 120]
            if "Unit description" in tail or "Externally assessed" in tail or "Compulsory unit" in tail:
                positions.append(pos)
    if not positions:
        for marker in markers:
            pos = text.find(marker)
            if pos != -1:
                positions.append(pos)
    if not positions:
        return ""
    start = positions[-1]
    chunk = text[start:]
    next_unit = re.search(r"\nUnit [A-Z0-9]+:", chunk[80:])
    if next_unit:
        chunk = chunk[: 80 + next_unit.start()]
    return chunk


def parse_edexcel_ial_unit(pdf_path: Path, markers: list[str]) -> dict[str, dict[str, object]]:
    text = "\n".join(pdf_lines(pdf_path))
    chunk = find_ial_unit_chunk(text, markers)
    if not chunk:
        return {}

    content_match = re.search(r"\n[A-Z0-9]+\.3 Unit content\n", chunk)
    lines = chunk[content_match.start() :].splitlines() if content_match else chunk.splitlines()

    topics_by_name: dict[str, list[str]] = {}
    current_main_name: str | None = None
    pending_sub: str | None = None
    pending_title_parts: list[str] = []

    def flush_sub() -> None:
        nonlocal pending_sub, pending_title_parts, current_main_name
        if pending_sub and current_main_name and pending_title_parts:
            title = " ".join(pending_title_parts)
            title = re.sub(r"\s+", " ", title).strip()
            if title:
                label = f"{pending_sub} {title[:100]}"
                topics_by_name.setdefault(current_main_name, [])
                if label not in topics_by_name[current_main_name]:
                    topics_by_name[current_main_name].append(label)
        pending_sub = None
        pending_title_parts = []

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped in {"Guidance", "What students need to learn:"}:
            continue
        main_match = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if main_match and not re.match(r"^\d+\.\d+", stripped):
            flush_sub()
            current_main_name = main_match.group(2).replace(" continued", "").strip()
            topics_by_name.setdefault(current_main_name, [])
            continue
        sub_match = re.match(r"^(\d+\.\d+)$", stripped)
        if sub_match and current_main_name:
            flush_sub()
            pending_sub = sub_match.group(1)
            continue
        if pending_sub and stripped and re.match(r"^[A-Za-z(]", stripped):
            if not stripped.startswith("The setting") and len(stripped) > 3:
                pending_title_parts.append(stripped)
                if len(" ".join(pending_title_parts)) > 40:
                    flush_sub()

    flush_sub()
    return {name: {"name": name, "subs": subs} for name, subs in topics_by_name.items() if subs}


def load_topics_from_sql(sql_path: Path) -> list[dict[str, object]]:
    text = sql_path.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\('([^']+)',\s*'([^']+)',\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*(\d+),\s*(\d+)",
    )
    rows: list[dict[str, object]] = []
    for match in pattern.finditer(text):
        rows.append(
            {
                "id": match.group(1),
                "subject_id": match.group(2),
                "name": match.group(3).replace("''", "'"),
                "description": match.group(4).replace("''", "'"),
                "order_index": int(match.group(5)),
                "subtopics_count": int(match.group(6)),
            }
        )
    return rows


def entry_section_number(entry: dict[str, object]) -> int | None:
    subs = entry.get("subs") or []
    for sub in subs:
        s = clean_syllabus_text(str(sub))
        match = re.match(r"^([CE]?)(\d+)\.\d+", s, re.I)
        if match:
            return int(match.group(2))
    name = clean_syllabus_text(str(entry.get("name", "")))
    section_match = re.match(r"^Section\s+(\d+)$", name, re.I)
    if section_match:
        return int(section_match.group(1))
    return None


def match_parsed_to_existing(
    parsed: dict[int | str, dict[str, object]],
    existing: list[dict[str, object]],
) -> list[tuple[dict[str, object], list[str]]]:
    existing_sorted = sorted(existing, key=lambda r: int(r["order_index"]))  # type: ignore[arg-type]
    if not parsed:
        return [(row, []) for row in existing_sorted]

    section_map: dict[int, dict[str, object]] = {}
    name_map: dict[str, dict[str, object]] = {}
    for entry in parsed.values():
        sec = entry_section_number(entry)
        if sec is not None:
            section_map[sec] = entry
        name_key = clean_syllabus_text(str(entry.get("name", ""))).lower()
        if name_key:
            name_map[name_key] = entry

    matches: list[tuple[dict[str, object], list[str]]] = []
    used_names: set[str] = set()

    for row in existing_sorted:
        order_idx = int(row["order_index"])
        row_name = clean_syllabus_text(str(row["name"]))
        chosen: dict[str, object] | None = None

        exact = name_map.get(row_name.lower())
        if exact and row_name.lower() not in used_names:
            chosen = exact
            used_names.add(row_name.lower())

        if chosen is None:
            chosen = section_map.get(order_idx)
            if chosen is not None:
                chosen_name = str(chosen.get("name", ""))
                score = similarity(row_name, chosen_name)
                if score < 0.45 and not chosen_name.lower().startswith("section "):
                    chosen = None

        if chosen is None:
            best_entry: dict[str, object] | None = None
            best_score = 0.0
            for name_key, entry in name_map.items():
                if name_key in used_names:
                    continue
                score = similarity(row_name, str(entry.get("name", name_key)))
                if score > best_score:
                    best_score = score
                    best_entry = entry
            if best_entry is not None and best_score >= 0.55:
                chosen = best_entry
                used_names.add(clean_syllabus_text(str(best_entry.get("name", ""))).lower())

        if chosen:
            subs = [clean_syllabus_text(str(s)) for s in chosen.get("subs", [])]  # type: ignore[arg-type]
            matches.append((row, subs))
        else:
            matches.append((row, []))

    return matches


def resolve_subtopics(
    subject_id: str,
    matches: list[tuple[dict[str, object], list[str]]],
) -> list[tuple[str, list[str]]]:
    updates: list[tuple[str, list[str]]] = []
    for row, subs in matches:
        topic_id = str(row["id"])
        if subject_id in SUBJECTS_COMING_SOON:
            updates.append((topic_id, COMING_SOON_SUBTOPICS))
        elif subs:
            updates.append((topic_id, subs))
        else:
            updates.append((topic_id, COMING_SOON_SUBTOPICS))
    return updates


def build_manifest() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    cie_dir = PDFS / "CIE"
    if cie_dir.exists():
        for pdf in sorted(cie_dir.glob("*.pdf")):
            doc_id_match = re.match(r"^(\d+)-", pdf.name)
            if not doc_id_match:
                continue
            doc_id = doc_id_match.group(1)
            if doc_id in CIE_DOC_IDS:
                code, subject_id = CIE_DOC_IDS[doc_id]
                entries.append(
                    {
                        "path": f"CIE/{pdf.name}",
                        "subject_id": subject_id,
                        "syllabus_code": code,
                        "board": "CAIE",
                        "level": "IGCSE",
                    }
                )
            elif doc_id in CAIE_AL_DOC_IDS:
                code, subject_id = CAIE_AL_DOC_IDS[doc_id]
                entries.append(
                    {
                        "path": f"CIE/{pdf.name}",
                        "subject_id": subject_id,
                        "syllabus_code": code,
                        "board": "CAIE",
                        "level": "A Level",
                    }
                )

    for subject_id, (code, filename) in EDEXCEL_IGCSE_PDFS.items():
        rel = f"Edexcel/{filename}"
        if (PDFS / rel).exists():
            entries.append(
                {
                    "path": rel,
                    "subject_id": subject_id,
                    "syllabus_code": code,
                    "board": "Edexcel",
                    "level": "IGCSE",
                }
            )

    for filename, (rel, units) in EDEXCEL_IAL_PDF_UNITS.items():
        if not (PDFS / rel).exists():
            continue
        for subject_id, unit_code, _markers in units:
            entries.append(
                {
                    "path": rel,
                    "subject_id": subject_id,
                    "syllabus_code": unit_code,
                    "board": "Edexcel",
                    "level": "IAL",
                }
            )

    MANIFEST.write_text(json.dumps(entries, indent=2), encoding="utf-8")
    return entries


def write_update_backfill(
    path: Path,
    title: str,
    updates: list[tuple[str, list[str]]],
) -> int:
    lines = [f"-- {path.name}", f"-- {title}", ""]
    count = 0
    for topic_id, subtopics in updates:
        if not subtopics:
            continue
        payload = sql_json_subtopics(subtopics)
        lines.append(
            "UPDATE topics SET "
            f"subtopics='{payload}', "
            f"subtopics_count={len(subtopics)}, "
            "updated_at=strftime('%s','now')*1000 "
            f"WHERE id='{topic_id}';"
        )
        count += 1
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return count


def pdf_subtopics_for_subject(subject_id: str, parser) -> dict[str, dict[str, object]]:
    doc_id = next((doc for doc, (_code, sid) in CAIE_AL_DOC_IDS.items() if sid == subject_id), None)
    if not doc_id:
        return {}
    matches = sorted(PDFS.glob(f"CIE/{doc_id}-*.pdf"))
    if not matches:
        return {}
    return parser(matches[0])


def write_caie_alevel_inserts(path: Path) -> int:
    lines = [
        f"-- {path.name}",
        "-- Syllabus topics for Cambridge International AS & A Level (12 subjects)",
        "-- Topic shells preserved — subtopics sourced from official syllabus PDFs where uploaded.",
        "",
        "INSERT OR IGNORE INTO topics (id, subject_id, name, description, order_index, subtopics_count, subtopics, difficulty_level, estimated_hours, created_at, updated_at) VALUES",
    ]
    values: list[str] = []
    count = 0
    for subject_id, topics in CAIE_AL_TOPICS.items():
        parsed = pdf_subtopics_for_subject(subject_id, parse_caie_alevel_pdf)
        existing_like = [
            {"id": tid, "name": name, "order_index": order_idx}
            for tid, name, _desc, order_idx, _diff, _hours, _subs in topics
        ]
        matched = {
            str(row["id"]): subs
            for row, subs in match_parsed_to_existing(parsed, existing_like)  # type: ignore[arg-type]
        }
        for tid, name, desc, order_idx, diff, hours, default_subs in topics:
            count += 1
            if subject_id in SUBJECTS_COMING_SOON:
                subs = COMING_SOON_SUBTOPICS
            else:
                subs = matched.get(tid) or default_subs or COMING_SOON_SUBTOPICS
            if not subs:
                subs = COMING_SOON_SUBTOPICS
            values.append(
                "("
                f"'{tid}', '{subject_id}', '{sql_quote(name)}', '{sql_quote(desc)}', "
                f"{order_idx}, {len(subs)}, '{sql_json_array(subs)}', '{diff}', {hours}, "
                "strftime('%s','now')*1000, strftime('%s','now')*1000)"
            )
    lines.append(",\n".join(values) + ";\n")
    path.write_text("\n".join(lines), encoding="utf-8")
    return count


def write_extras(path: Path, updates: list[tuple[str, list[str]]]) -> int:
    lines = [
        f"-- {path.name}",
        "-- Subtopic backfill for WME03, WST03 and Psychology WPS01-04",
        "",
    ]
    count = 0
    for topic_id, subtopics in updates:
        if not subtopics:
            continue
        count += 1
        payload = sql_json_subtopics(subtopics)
        lines.append(
            "UPDATE topics SET "
            f"subtopics='{payload}', "
            f"subtopics_count={len(subtopics)}, "
            "updated_at=strftime('%s','now')*1000 "
            f"WHERE id='{topic_id}';"
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return count


def append_seed_order() -> None:
    text = VALIDATE.read_text(encoding="utf-8")
    match = re.search(r"SEED_ORDER = \[([\s\S]*?)\]", text)
    if not match:
        raise RuntimeError("Could not locate SEED_ORDER in _validate_all_seeds.py")
    block = match.group(1)
    existing = re.findall(r'"([^"]+\.sql)"', block)
    changed = False
    for name in SEED_FILES:
        if name not in existing:
            existing.append(name)
            changed = True
    if not changed:
        return
    new_block = "\n".join(f'    "{name}",' for name in existing) + "\n"
    updated = text[: match.start(1)] + new_block + text[match.end(1) :]
    VALIDATE.write_text(updated, encoding="utf-8")


def count_sql_rows(path: Path) -> int:
    if not path.exists():
        return 0
    text = path.read_text(encoding="utf-8")
    if "INSERT" in text:
        return len(re.findall(r"\('topic-", text))
    return len(re.findall(r"^UPDATE topics", text, re.M))


def caie_al_topic_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for subject_id, topics in CAIE_AL_TOPICS.items():
        for tid, name, _desc, order_idx, _diff, _hours, _subs in topics:
            rows.append(
                {
                    "id": tid,
                    "subject_id": subject_id,
                    "name": name,
                    "order_index": order_idx,
                }
            )
    return rows


def main() -> None:
    manifest = build_manifest()
    print(f"Wrote manifest with {len(manifest)} entries -> {MANIFEST}")

    caie_rows = load_topics_from_sql(ROOT / "0002_topics_CAIE_IGCSE_subjects.sql")
    edx_igcse_rows = load_topics_from_sql(ROOT / "0008_topics_edexcel_igcse.sql")
    edx_ial_rows = load_topics_from_sql(ROOT / "0009_topics_edexcel_ial.sql")

    caie_updates: list[tuple[str, list[str]]] = []
    for doc_id, (code, subject_id) in CIE_DOC_IDS.items():
        matches = sorted(PDFS.glob(f"CIE/{doc_id}-*.pdf"))
        if not matches:
            print(f"WARN missing CAIE PDF for {code}")
            continue
        parsed = parse_caie_igcse_pdf(matches[0])
        if subject_id in CAIE_ENGLISH_SUBTOPICS:
            parsed = {
                name: {"name": name, "subs": subs}
                for name, subs in CAIE_ENGLISH_SUBTOPICS[subject_id].items()
            }
        existing = [r for r in caie_rows if r["subject_id"] == subject_id]
        matched = match_parsed_to_existing(parsed, existing)
        caie_updates.extend(resolve_subtopics(subject_id, matched))
        filled = sum(1 for _, subs in matched if subs)
        print(f"CAIE {code}: parsed {len(parsed)} main topics -> matched {len(existing)} seeded topics ({filled} with subs)")

    edx_igcse_updates: list[tuple[str, list[str]]] = []
    for subject_id, (_code, filename) in EDEXCEL_IGCSE_PDFS.items():
        pdf_path = PDFS / "Edexcel" / filename
        if not pdf_path.exists():
            print(f"WARN missing Edexcel IGCSE PDF {filename}")
            for row in edx_igcse_rows:
                if row["subject_id"] == subject_id:
                    edx_igcse_updates.append((str(row["id"]), COMING_SOON_SUBTOPICS))
            continue
        parsed = parse_edexcel_igcse_pdf(pdf_path)
        if subject_id in EDEXCEL_ENGLISH_SUBTOPICS:
            parsed = {
                name: {"name": name, "subs": subs}
                for name, subs in EDEXCEL_ENGLISH_SUBTOPICS[subject_id].items()
            }
        existing = [r for r in edx_igcse_rows if r["subject_id"] == subject_id]
        matched = match_parsed_to_existing(parsed, existing)
        edx_igcse_updates.extend(resolve_subtopics(subject_id, matched))
        print(f"Edexcel IGCSE {subject_id}: parsed {len(parsed)} topics")

    edx_ial_updates: list[tuple[str, list[str]]] = []
    extras_updates: list[tuple[str, list[str]]] = []
    for _filename, (rel, units) in EDEXCEL_IAL_PDF_UNITS.items():
        pdf_path = PDFS / rel
        if not pdf_path.exists():
            continue
        for subject_id, _unit_code, markers in units:
            parsed = parse_edexcel_ial_unit(pdf_path, markers)
            existing = [r for r in edx_ial_rows if r["subject_id"] == subject_id]
            matched = match_parsed_to_existing(parsed, existing)
            resolved = resolve_subtopics(subject_id, matched)
            for topic_id, subs in resolved:
                edx_ial_updates.append((topic_id, subs))
                if subject_id in EXTRAS_SUBJECTS:
                    extras_updates.append((topic_id, subs))

    caie_al_updates: list[tuple[str, list[str]]] = []
    caie_al_rows = caie_al_topic_rows()
    for subject_id in {sid for _doc, (_code, sid) in CAIE_AL_DOC_IDS.items()} | set(CAIE_AL_TOPICS.keys()):
        existing = [r for r in caie_al_rows if r["subject_id"] == subject_id]
        if not existing:
            continue
        if subject_id in SUBJECTS_COMING_SOON:
            caie_al_updates.extend(resolve_subtopics(subject_id, [(row, []) for row in existing]))
            continue
        parsed = pdf_subtopics_for_subject(subject_id, parse_caie_alevel_pdf)
        matched = match_parsed_to_existing(parsed, existing)
        caie_al_updates.extend(resolve_subtopics(subject_id, matched))
        print(f"CAIE A Level {subject_id}: parsed {len(parsed)} sections -> {len(existing)} topics")

    caie_al_count = write_caie_alevel_inserts(OUT_CAIE_AL)
    caie_bf_count = write_update_backfill(
        OUT_CAIE_IGCSE_BACKFILL,
        "Backfill subtopics for CAIE IGCSE topics from official syllabus PDFs",
        caie_updates,
    )
    caie_al_bf_count = write_update_backfill(
        OUT_CAIE_AL_BACKFILL,
        "Backfill subtopics for CAIE AS & A Level topics from official syllabus PDFs",
        caie_al_updates,
    )
    edx_igcse_bf_count = write_update_backfill(
        OUT_EDX_IGCSE_BACKFILL,
        "Backfill subtopics for Edexcel IGCSE topics from official specification PDFs",
        edx_igcse_updates,
    )
    edx_ial_bf_count = write_update_backfill(
        OUT_EDX_IAL_BACKFILL,
        "Backfill subtopics for Edexcel IAL unit topics from official specification PDFs",
        edx_ial_updates,
    )
    extras_count = write_extras(OUT_EXTRAS, extras_updates)
    append_seed_order()

    print("\nGenerated files:")
    for path in [
        OUT_CAIE_AL,
        OUT_CAIE_IGCSE_BACKFILL,
        OUT_CAIE_AL_BACKFILL,
        OUT_EDX_IGCSE_BACKFILL,
        OUT_EDX_IAL_BACKFILL,
        OUT_EXTRAS,
    ]:
        print(f"  {path.name}: {count_sql_rows(path)} rows")


if __name__ == "__main__":
    main()
