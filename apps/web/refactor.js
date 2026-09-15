const fs = require('fs');

let content = fs.readFileSync('src/components/settings/AdvancedProfileEditor.tsx', 'utf8');

// 1. Types & State
content = content.replace(/type SubTabId =[\s\S]*?;/, "type SubTabId = 'profile_info' | 'portfolio' | 'appearance';");

content = content.replace(/const initialSubTab: SubTabId =[\s\S]*?: 'basic';/, "const initialSubTab: SubTabId = tabParam === 'appearance' ? 'appearance' : (tabParam === 'portfolio' || tabParam === 'projects' || tabParam === 'activities' || tabParam === 'achievements' || tabParam === 'grades' || tabParam === 'certifications') ? 'portfolio' : 'profile_info';");

content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[tabParam\]\);/, "useEffect(() => { if (tabParam === 'appearance') setActiveSubTab('appearance'); else if (tabParam === 'portfolio' || tabParam === 'projects' || tabParam === 'activities' || tabParam === 'achievements' || tabParam === 'grades' || tabParam === 'certifications') setActiveSubTab('portfolio'); else setActiveSubTab('profile_info'); }, [tabParam]);");

// Remove imports not needed
content = content.replace(/actionUpdateTutorProfile,/g, '');

// Remove tutor/contributor states
const statesToRemove = [
    /const \[hourlyRate, setHourlyRate\].*?\n/,
    /const \[institution, setInstitution\].*?\n/,
    /const \[specialization, setSpecialization\].*?\n/,
    /const \[teachingSubjects, setTeachingSubjects\].*?\n/,
    /const \[teachingCurriculums, setTeachingCurriculums\].*?\n/,
    /const \[availabilityStatus, setAvailabilityStatus\].*?\n/,
    /const \[availabilityNote, setAvailabilityNote\].*?\n/,
    /const \[newSubjectInput, setNewSubjectInput\].*?\n/,
    /const \[websiteUrl, setWebsiteUrl\].*?\n/,
    /const \[githubUrl, setGithubUrl\].*?\n/,
    /const \[linkedinUrl, setLinkedinUrl\].*?\n/,
];
statesToRemove.forEach(regex => {
    content = content.replace(regex, '');
});

// Update telegram logic
content = content.replace(/if \(data\.tutorProfile\) \{[\s\S]*?\} else \{/, "if (data.tutorProfile) {\n        setTelegramHandle(data.tutorProfile.telegram_handle || '');\n      } else {");

// Update save logic
const saveLogicRegex = /\/\/ 4\. Save Tutor Profile[\s\S]*?\/\/ 5\. Save Contributor Profile[\s\S]*?setSaveSuccess\(true\);/;
const newSaveLogic = `
      const certRes = await actionSyncCertifications(user.id, certs);
      if (!certRes.success) {
        setSaveError(certRes.error || 'Failed to save certifications');
        setIsSaving(false);
        return;
      }
      setSaveSuccess(true);
`;
content = content.replace(saveLogicRegex, newSaveLogic);

// Replace subTabs array
const subTabsRegex = /const subTabs = \[[^\]]*\];/;
const newSubTabs = `const subTabs = [
    { id: 'profile_info', label: 'Profile Information', icon: <User className="h-4 w-4" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance & Themes', icon: <LayoutTemplate className="h-4 w-4" /> },
  ];`;
content = content.replace(subTabsRegex, newSubTabs);

// Update activeSubTab === '...' conditions
// Merge basic and social -> profile_info
content = content.replace(/\{activeSubTab === 'basic' && \(/g, "{activeSubTab === 'profile_info' && (");
content = content.replace(/\{activeSubTab === 'social' && \(/g, "{(activeSubTab === 'profile_info' || activeSubTab === 'social') && (");

// Remove tutor / contributor sections entirely
// I'll just change their condition to something that is never true
content = content.replace(/\{activeSubTab === 'tutor' && \(/g, "{false && (");
content = content.replace(/\{activeSubTab === 'contributor' && \(/g, "{false && (");

// Merge projects, activities, achievements, grades, certifications into portfolio
content = content.replace(/\{activeSubTab === 'projects' && \(/g, "{activeSubTab === 'portfolio' && (");
content = content.replace(/\{activeSubTab === 'activities' && \(/g, "{activeSubTab === 'portfolio' && (");
content = content.replace(/\{activeSubTab === 'achievements' && \(/g, "{activeSubTab === 'portfolio' && (");
content = content.replace(/\{activeSubTab === 'grades' && \(/g, "{activeSubTab === 'portfolio' && (");
content = content.replace(/\{activeSubTab === 'certifications' && \(/g, "{activeSubTab === 'portfolio' && (");

fs.writeFileSync('src/components/settings/AdvancedProfileEditor.tsx', content);
