const CHIEF_COMPLAINTS = [
  "chest pain",
  "shortness of breath",
  "abdominal pain",
  "headache",
  "dizziness",
  "fatigue",
  "cough",
  "fever",
  "back pain",
  "nausea and vomiting",
];

const HPI_PHRASES = [
  "The patient is a {age}-year-old {sex} presenting with",
  "Symptoms began {duration} ago and have been {progression}.",
  "The pain is described as {quality} and located in the {location}.",
  "It is exacerbated by {exacerbating_factors} and relieved by {relieving_factors}.",
  "Associated symptoms include {associated_symptoms}.",
  "The patient denies {denied_symptoms}.",
  "Review of systems is otherwise negative except as noted.",
  "Patient reports gradual onset of symptoms over the past few days.",
  "Severity is rated {severity}/10.",
  "No significant trauma reported.",
];

const PMH_PHRASES = [
  "Past medical history is significant for {conditions}.",
  "Surgical history includes {surgeries}.",
  "Family history is positive for {family_conditions} in {relative}.",
  "Social history reveals {social_factors}.",
  "Patient takes {medications} daily.",
  "Allergies include {allergies}.",
  "Patient denies history of hypertension, diabetes, or heart disease.",
  "Immunizations are up to date.",
  "No known drug allergies.",
];

const EXAM_FINDINGS = [
  "Vital signs: BP {bp}, HR {hr}, RR {rr}, Temp {temp}F, SpO2 {spo2}% on room air.",
  "General: Patient is alert, oriented, and in no acute distress.",
  "HEENT: Head is normocephalic, atraumatic. Pupils are equal, round, reactive to light.",
  "Neck: Supple, no lymphadenopathy or thyromegaly.",
  "Cardiovascular: Regular rate and rhythm, no murmurs, rubs, or gallops.",
  "Respiratory: Lungs clear to auscultation bilaterally, no wheezes or crackles.",
  "Abdomen: Soft, non-tender, non-distended. Bowel sounds present.",
  "Extremities: No cyanosis, clubbing, or edema. Pulses are 2+ bilaterally.",
  "Neurological: Cranial nerves II-XII intact. Strength 5/5 throughout.",
  "Skin: Warm, dry, intact without rashes or lesions.",
];

const AP_PHRASES = [
  "Assessment: {diagnosis_list}.",
  "Plan: Admit to {service} service for further management.",
  "Plan: Discharge home with instructions for {follow_up}.",
  "Will obtain {labs_imaging} for further evaluation.",
  "Consult {specialty} for recommendations.",
  "Start patient on {medication_treatment}. Monitor for response.",
  "Provide symptomatic relief with {symptomatic_treatment}.",
  "Educate patient on {education_topic} and importance of compliance.",
  "Follow up with primary care physician in {fup_time}.",
  "Differential diagnosis includes {diff_dx} but less likely.",
];

const PLACEHOLDERS: Record<string, () => string> = {
  "{age}": () => String(Math.floor(Math.random() * 60) + 20),
  "{sex}": () => Math.random() > 0.5 ? "male" : "female",
  "{duration}": () => ["2 days", "1 week", "3 hours", "several months"][Math.floor(Math.random() * 4)],
  "{progression}": () => ["worsening", "improving", "stable", "intermittent"][Math.floor(Math.random() * 4)],
  "{quality}": () => ["sharp", "dull", "aching", "burning", "pressure-like"][Math.floor(Math.random() * 5)],
  "{location}": () => ["left lower quadrant", "substernal area", "right flank", "occipital region", "epigastrium"][Math.floor(Math.random() * 5)],
  "{exacerbating_factors}": () => ["movement", "deep breaths", "eating", "stress"][Math.floor(Math.random() * 4)],
  "{relieving_factors}": () => ["rest", "medication", "position change", "nothing"][Math.floor(Math.random() * 4)],
  "{associated_symptoms}": () => {
    const symptoms = ["fever", "chills", "sweats", "shortness of breath", "dizziness", "nausea"];
    const count = Math.floor(Math.random() * 3) + 1;
    const selected = symptoms.sort(() => 0.5 - Math.random()).slice(0, count);
    return selected.join(", ");
  },
  "{denied_symptoms}": () => {
    const symptoms = ["chest pain", "cough", "headache", "vision changes", "weakness"];
    const count = Math.floor(Math.random() * 3) + 1;
    const selected = symptoms.sort(() => 0.5 - Math.random()).slice(0, count);
    return selected.join(", ");
  },
  "{severity}": () => String(Math.floor(Math.random() * 7) + 3),
  "{conditions}": () => {
    const conditions = ["hypertension", "diabetes mellitus type 2", "asthma", "hyperlipidemia", "GERD"];
    const count = Math.floor(Math.random() * 3) + 1;
    const selected = conditions.sort(() => 0.5 - Math.random()).slice(0, count);
    return selected.join(", ");
  },
  "{surgeries}": () => ["appendectomy in childhood", "cholecystectomy 5 years ago", "knee arthroscopy", "none"][Math.floor(Math.random() * 4)],
  "{family_conditions}": () => ["heart disease", "cancer", "diabetes"][Math.floor(Math.random() * 3)],
  "{relative}": () => ["mother", "father", "sibling"][Math.floor(Math.random() * 3)],
  "{social_factors}": () => ["history of smoking (quit 5 years ago)", "occasional alcohol use", "denies illicit drug use", "lives alone"][Math.floor(Math.random() * 4)],
  "{medications}": () => {
    const meds = ["Lisinopril 10mg", "Metformin 500mg BID", "Albuterol inhaler PRN", "Atorvastatin 20mg"];
    const count = Math.floor(Math.random() * 3) + 1;
    const selected = meds.sort(() => 0.5 - Math.random()).slice(0, count);
    return selected.join(", ");
  },
  "{allergies}": () => ["penicillin (rash)", "NKDA", "seasonal allergies", "shellfish"][Math.floor(Math.random() * 4)],
  "{bp}": () => `${Math.floor(Math.random() * 50) + 110}/${Math.floor(Math.random() * 25) + 70}`,
  "{hr}": () => String(Math.floor(Math.random() * 40) + 60),
  "{rr}": () => String(Math.floor(Math.random() * 6) + 14),
  "{temp}": () => (Math.random() * 4 + 97.5).toFixed(1),
  "{spo2}": () => String(Math.floor(Math.random() * 6) + 94),
  "{diagnosis_list}": () => {
    const diagnoses = ["Acute bronchitis", "Gastritis", "Migraine headache", "Lumbar strain", "Community-acquired pneumonia"];
    const count = Math.floor(Math.random() * 3) + 1;
    const selected = diagnoses.sort(() => 0.5 - Math.random()).slice(0, count);
    return selected.join(", ");
  },
  "{service}": () => ["Medicine", "Observation", "Surgery"][Math.floor(Math.random() * 3)],
  "{follow_up}": () => ["rest and hydration", "return precautions", "taking medications as prescribed"][Math.floor(Math.random() * 3)],
  "{labs_imaging}": () => ["CBC, CMP, Troponin", "Chest X-ray", "CT abdomen/pelvis", "Urinalysis", "EKG"][Math.floor(Math.random() * 5)],
  "{specialty}": () => ["Cardiology", "GI", "Neurology", "Pulmonology"][Math.floor(Math.random() * 4)],
  "{medication_treatment}": () => ["IV fluids", "antibiotics", "pain control regimen", "nebulizer treatments"][Math.floor(Math.random() * 4)],
  "{symptomatic_treatment}": () => ["antiemetics", "analgesics", "cough suppressants"][Math.floor(Math.random() * 3)],
  "{education_topic}": () => ["medication side effects", "warning signs", "dietary changes"][Math.floor(Math.random() * 3)],
  "{fup_time}": () => ["2-3 days", "1 week", "as needed"][Math.floor(Math.random() * 3)],
  "{diff_dx}": () => {
    const diffs = ["Pulmonary embolism", "Myocardial infarction", "Appendicitis", "Cholecystitis"];
    const count = Math.floor(Math.random() * 2) + 1;
    const selected = diffs.sort(() => 0.5 - Math.random()).slice(0, count);
    return selected.join(", ");
  },
};

function fillPlaceholders(text: string): string {
  let result = text;
  for (const [placeholder, func] of Object.entries(PLACEHOLDERS)) {
    if (result.includes(placeholder)) {
      result = result.replace(placeholder, func());
    }
  }
  return result;
}

function generateSection(phrases: string[], numSentences: number): string {
  const shuffled = [...phrases].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(numSentences, phrases.length));
  return selected.map(fillPlaceholders).join(" ");
}

export function generateFakeMedicalRecord(wordCount: number = 1000): string {
  const targetSentences = Math.floor(wordCount / 15);
  const hpiSentences = Math.max(5, Math.floor(targetSentences * 0.25));
  const pmhSentences = Math.max(4, Math.floor(targetSentences * 0.20));
  const examSentences = Math.max(8, Math.floor(targetSentences * 0.25));
  const apSentences = Math.max(5, Math.floor(targetSentences * 0.30));

  const patientName = `John Doe ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
  const dob = `19${Math.floor(Math.random() * 40) + 50}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
  const chiefComplaint = CHIEF_COMPLAINTS[Math.floor(Math.random() * CHIEF_COMPLAINTS.length)];

  let record = `## Patient Record: ${Math.floor(Math.random() * 9000) + 1000}\n\n`;
  record += "**Date:** 2025-04-15\n";
  record += `**Patient Name:** ${patientName}\n`;
  record += `**DOB:** ${dob}\n\n`;
  record += `**Chief Complaint:** ${chiefComplaint.charAt(0).toUpperCase() + chiefComplaint.slice(1)}.\n\n`;

  record += "**History of Present Illness:**\n";
  let hpiSection = fillPlaceholders(HPI_PHRASES[0]) + ` ${chiefComplaint}. `;
  hpiSection += generateSection(HPI_PHRASES.slice(1), hpiSentences - 1);
  
  while (hpiSection.split(" ").length < hpiSentences * 10) {
    hpiSection += " " + generateSection(HPI_PHRASES.slice(1), 2);
  }
  record += hpiSection.trim() + ".\n\n";

  record += "**Past Medical History:**\n";
  let pmhSection = generateSection(PMH_PHRASES, pmhSentences);
  while (pmhSection.split(" ").length < pmhSentences * 10) {
    pmhSection += " " + generateSection(PMH_PHRASES, 2);
  }
  record += pmhSection.trim() + ".\n\n";

  record += "**Physical Examination:**\n";
  const examSectionList = EXAM_FINDINGS
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(examSentences, EXAM_FINDINGS.length))
    .map(fillPlaceholders);
  
  while (examSectionList.length < examSentences) {
    examSectionList.push(fillPlaceholders(EXAM_FINDINGS[Math.floor(Math.random() * EXAM_FINDINGS.length)]));
  }
  record += examSectionList.map(line => `- ${line}`).join("\n") + "\n\n";

  record += "**Assessment and Plan:**\n";
  let apSection = generateSection(AP_PHRASES, apSentences);
  while (apSection.split(" ").length < apSentences * 10) {
    apSection += " " + generateSection(AP_PHRASES, 2);
  }
  record += apSection.trim() + ".\n";

  const currentWords = record.split(" ").length;
  if (currentWords < wordCount * 0.8) {
    const paddingNeeded = wordCount - currentWords;
    const paddingSentences = Math.floor(paddingNeeded / 15);
    record += "\n\n**Additional Notes:**\n" + generateSection([...HPI_PHRASES, ...AP_PHRASES], paddingSentences);
  } else if (currentWords > wordCount * 1.2) {
    const words = record.split(" ");
    record = words.slice(0, Math.floor(wordCount * 1.1)).join(" ");
  }

  return record;
}