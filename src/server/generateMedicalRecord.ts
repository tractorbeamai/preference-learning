import { createServerFn } from "@tanstack/react-start";

// ---------- Types ----------
type Sex = "male" | "female";

type Patient = {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  sex: Sex;
  age: number;
};

type Vitals = {
  bp: string; // e.g., 120/80
  hr: number;
  rr: number;
  tempF: string; // 98.6
  spo2: number;
};

type Visit = {
  date: string; // YYYY-MM-DD
  chiefComplaint: string;
  severity10: number; // 1-10
  onsetDuration: string; // e.g., "3 days"
  progression: string; // e.g., "worsening"
  quality: string; // e.g., "sharp"
  location: string; // e.g., "substernal area"
  exacerbating: string; // e.g., "movement"
  relieving: string; // e.g., "rest"
  associatedSymptoms: string; // comma-separated
  deniedSymptoms: string; // comma-separated
};

type Histories = {
  conditions: string;
  surgeries: string;
  family: string;
  social: string;
  medications: string;
  allergies: string;
};

type AssessmentPlan = {
  diagnoses: string;
  service: string;
  tests: string;
  consult: string;
  treatment: string;
  symptomatic: string;
  education: string;
  followUp: string;
  differential: string;
};

type RecordContext = {
  patient: Patient;
  vitals: Vitals;
  visit: Visit;
  hx: Histories;
  ap: AssessmentPlan;
};

// ---------- Utilities ----------
function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickSome(items: string[], min: number, max: number): string {
  const count = randomInt(min, max);
  return [...items]
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .join(", ");
}

function today(): string {
  // Fixed for demo consistency
  return "2025-04-15";
}

// Tiny, readable template renderer: "{{ path.to.value }}"
function getPath(obj: any, path: string): string {
  return path
    .split(".")
    .reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
}

function render(template: string, ctx: RecordContext): string {
  return template.replace(/{{\s*([\w\.]+)\s*}}/g, (_, path) => {
    const value = getPath(ctx, path);
    return value === undefined || value === null ? "" : String(value);
  });
}

// ---------- Context Builders ----------
function createPatient(): Patient {
  const year = 1950 + Math.floor(Math.random() * 40); // 1950-1989
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  const dob = `${year}-${month}-${day}`;
  const age = Math.max(18, Math.min(95, 2025 - year));
  const sex: Sex = Math.random() > 0.5 ? "male" : "female";
  const name = `John Doe`;
  const id = String(Math.floor(Math.random() * 9000) + 1000);
  return { id, name, dob, sex, age };
}

function createVitals(): Vitals {
  const bp = `${Math.floor(Math.random() * 50) + 110}/${Math.floor(Math.random() * 25) + 70}`;
  const hr = Math.floor(Math.random() * 40) + 60;
  const rr = Math.floor(Math.random() * 6) + 14;
  const tempF = (Math.random() * 4 + 97.5).toFixed(1);
  const spo2 = Math.floor(Math.random() * 6) + 94;
  return { bp, hr, rr, tempF, spo2 };
}

function createVisit(patient: Patient): Visit {
  const chiefComplaint = randomItem([
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
  ]);

  const associatedSymptoms = pickSome(
    ["fever", "chills", "sweats", "shortness of breath", "dizziness", "nausea"],
    1,
    3,
  );
  const deniedSymptoms = pickSome(
    ["chest pain", "cough", "headache", "vision changes", "weakness"],
    1,
    3,
  );

  return {
    date: today(),
    chiefComplaint,
    severity10: Math.floor(Math.random() * 7) + 3,
    onsetDuration: randomItem([
      "2 days",
      "1 week",
      "3 hours",
      "several months",
    ]),
    progression: randomItem([
      "worsening",
      "improving",
      "stable",
      "intermittent",
    ]),
    quality: randomItem([
      "sharp",
      "dull",
      "aching",
      "burning",
      "pressure-like",
    ]),
    location: randomItem([
      "left lower quadrant",
      "substernal area",
      "right flank",
      "occipital region",
      "epigastrium",
    ]),
    exacerbating: randomItem(["movement", "deep breaths", "eating", "stress"]),
    relieving: randomItem(["rest", "medication", "position change", "nothing"]),
    associatedSymptoms,
    deniedSymptoms,
  };
}

function createHistories(): Histories {
  return {
    conditions: pickSome(
      [
        "hypertension",
        "diabetes mellitus type 2",
        "asthma",
        "hyperlipidemia",
        "GERD",
      ],
      1,
      3,
    ),
    surgeries: randomItem([
      "appendectomy in childhood",
      "cholecystectomy 5 years ago",
      "knee arthroscopy",
      "none",
    ]),
    family: `${randomItem(["heart disease", "cancer", "diabetes"])} in ${randomItem(["mother", "father", "sibling"])}`,
    social: randomItem([
      "history of smoking (quit 5 years ago)",
      "occasional alcohol use",
      "denies illicit drug use",
      "lives alone",
    ]),
    medications: pickSome(
      [
        "Lisinopril 10mg",
        "Metformin 500mg BID",
        "Albuterol inhaler PRN",
        "Atorvastatin 20mg",
      ],
      1,
      3,
    ),
    allergies: randomItem([
      "penicillin (rash)",
      "NKDA",
      "seasonal allergies",
      "shellfish",
    ]),
  };
}

function createAssessmentPlan(): AssessmentPlan {
  return {
    diagnoses: pickSome(
      [
        "Acute bronchitis",
        "Gastritis",
        "Migraine headache",
        "Lumbar strain",
        "Community-acquired pneumonia",
      ],
      1,
      3,
    ),
    service: randomItem(["Medicine", "Observation", "Surgery"]),
    tests: randomItem([
      "CBC, CMP, Troponin",
      "Chest X-ray",
      "CT abdomen/pelvis",
      "Urinalysis",
      "EKG",
    ]),
    consult: randomItem(["Cardiology", "GI", "Neurology", "Pulmonology"]),
    treatment: randomItem([
      "IV fluids",
      "antibiotics",
      "pain control regimen",
      "nebulizer treatments",
    ]),
    symptomatic: randomItem([
      "antiemetics",
      "analgesics",
      "cough suppressants",
    ]),
    education: randomItem([
      "medication side effects",
      "warning signs",
      "dietary changes",
    ]),
    followUp: randomItem(["2-3 days", "1 week", "as needed"]),
    differential: pickSome(
      [
        "Pulmonary embolism",
        "Myocardial infarction",
        "Appendicitis",
        "Cholecystitis",
      ],
      1,
      2,
    ),
  };
}

function buildContext(): RecordContext {
  const patient = createPatient();
  return {
    patient,
    vitals: createVitals(),
    visit: createVisit(patient),
    hx: createHistories(),
    ap: createAssessmentPlan(),
  };
}

// ---------- Templates ----------
// Helper for capitalizing chief complaint
function formatChiefComplaint(cc: string): string {
  return cc.charAt(0).toUpperCase() + cc.slice(1);
}

function hpiTemplates(ctx: RecordContext): string[] {
  const cc = formatChiefComplaint(ctx.visit.chiefComplaint);
  return [
    `The patient is a {{ patient.age }}-year-old {{ patient.sex }} presenting with ${cc}.`,
    `Symptoms began {{ visit.onsetDuration }} ago and have been {{ visit.progression }}.`,
    `The pain is described as {{ visit.quality }} and located in the {{ visit.location }}.`,
    `It is exacerbated by {{ visit.exacerbating }} and relieved by {{ visit.relieving }}.`,
    `Associated symptoms include {{ visit.associatedSymptoms }}.`,
    `The patient denies {{ visit.deniedSymptoms }}.`,
    `Severity is rated {{ visit.severity10 }}/10.`,
  ];
}

function pmhTemplates(): string[] {
  return [
    `Past medical history is significant for {{ hx.conditions }}.`,
    `Surgical history includes {{ hx.surgeries }}.`,
    `Family history is positive for {{ hx.family }}.`,
    `Social history reveals {{ hx.social }}.`,
    `Patient takes {{ hx.medications }} daily.`,
    `Allergies include {{ hx.allergies }}.`,
  ];
}

function examTemplates(): string[] {
  return [
    `Vital signs: BP {{ vitals.bp }}, HR {{ vitals.hr }}, RR {{ vitals.rr }}, Temp {{ vitals.tempF }}F, SpO2 {{ vitals.spo2 }}% on room air.`,
    `General: Patient is alert, oriented, and in no acute distress.`,
    `HEENT: Head is normocephalic, atraumatic. Pupils are equal, round, reactive to light.`,
    `Neck: Supple, no lymphadenopathy or thyromegaly.`,
    `Cardiovascular: Regular rate and rhythm, no murmurs, rubs, or gallops.`,
    `Respiratory: Lungs clear to auscultation bilaterally, no wheezes or crackles.`,
    `Abdomen: Soft, non-tender, non-distended. Bowel sounds present.`,
    `Extremities: No cyanosis, clubbing, or edema. Pulses are 2+ bilaterally.`,
    `Neurological: Cranial nerves II-XII intact. Strength 5/5 throughout.`,
    `Skin: Warm, dry, intact without rashes or lesions.`,
  ];
}

function apTemplates(): string[] {
  return [
    `Assessment: {{ ap.diagnoses }}.`,
    `Plan: Admit to {{ ap.service }} service for further management.`,
    `Will obtain {{ ap.tests }} for further evaluation.`,
    `Consult {{ ap.consult }} for recommendations.`,
    `Start patient on {{ ap.treatment }} and provide {{ ap.symptomatic }} as needed.`,
    `Educate patient on {{ ap.education }} and importance of compliance.`,
    `Follow up with primary care physician in {{ ap.followUp }}.`,
    `Differential diagnosis includes {{ ap.differential }} but less likely.`,
  ];
}

// ---------- Record Generator ----------
function generateFakeMedicalRecord(): string {
  const ctx = buildContext();

  // Use reasonable fixed counts for each section
  const hpiCount = 5; // Use 5 of 7 HPI sentences
  const pmhCount = 4; // Use 4 of 6 PMH sentences
  const examCount = 7; // Use 7 of 10 exam findings
  const apCount = 5; // Use 5 of 8 A&P items

  let record = "";
  record += `## Patient Record: ${ctx.patient.id}\n\n`;
  record += `**Date:** ${ctx.visit.date}\n`;
  record += `**Patient Name:** ${ctx.patient.name}\n`;
  record += `**DOB:** ${ctx.patient.dob}\n\n`;
  record += `**Chief Complaint:** ${formatChiefComplaint(ctx.visit.chiefComplaint)}.\n\n`;

  // HPI
  record += "**History of Present Illness:**\n";
  record +=
    hpiTemplates(ctx)
      .slice(0, hpiCount)
      .map((t) => render(t, ctx))
      .join(" ") + "\n\n";

  // PMH
  record += "**Past Medical History:**\n";
  record +=
    pmhTemplates()
      .slice(0, pmhCount)
      .map((t) => render(t, ctx))
      .join(" ") + "\n\n";

  // Exam
  record += "**Physical Examination:**\n";
  const examLines = examTemplates()
    .slice(0, examCount)
    .map((t) => `- ${render(t, ctx)}`);
  record += examLines.join("\n") + "\n\n";

  // Assessment/Plan
  record += "**Assessment and Plan:**\n";
  record +=
    apTemplates()
      .slice(0, apCount)
      .map((t) => render(t, ctx))
      .join(" ") + "\n";

  return record;
}

export const generateMedicalRecord = createServerFn({ method: "POST" }).handler(
  async () => ({ record: generateFakeMedicalRecord() }),
);
