import random
import string

# Data for more realistic fake records
_CHIEF_COMPLAINTS = [
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
]

_HPI_PHRASES = [
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
]

_PMH_PHRASES = [
    "Past medical history is significant for {conditions}.",
    "Surgical history includes {surgeries}.",
    "Family history is positive for {family_conditions} in {relative}.",
    "Social history reveals {social_factors}.",
    "Patient takes {medications} daily.",
    "Allergies include {allergies}.",
    "Patient denies history of hypertension, diabetes, or heart disease.",
    "Immunizations are up to date.",
    "No known drug allergies.",
]

_EXAM_FINDINGS = [
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
]

_AP_PHRASES = [
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
]

# Simple replacements for placeholders in phrases
_PLACEHOLDERS = {
    "{age}": lambda: str(random.randint(20, 80)),
    "{sex}": lambda: random.choice(["male", "female"]),
    "{duration}": lambda: random.choice(
        ["2 days", "1 week", "3 hours", "several months"]
    ),
    "{progression}": lambda: random.choice(
        ["worsening", "improving", "stable", "intermittent"]
    ),
    "{quality}": lambda: random.choice(
        ["sharp", "dull", "aching", "burning", "pressure-like"]
    ),
    "{location}": lambda: random.choice(
        [
            "left lower quadrant",
            "substernal area",
            "right flank",
            "occipital region",
            "epigastrium",
        ]
    ),
    "{exacerbating_factors}": lambda: random.choice(
        ["movement", "deep breaths", "eating", "stress"]
    ),
    "{relieving_factors}": lambda: random.choice(
        ["rest", "medication", "position change", "nothing"]
    ),
    "{associated_symptoms}": lambda: ", ".join(
        random.sample(
            ["fever", "chills", "sweats", "shortness of breath", "dizziness", "nausea"],
            k=random.randint(1, 3),
        )
    ),
    "{denied_symptoms}": lambda: ", ".join(
        random.sample(
            ["chest pain", "cough", "headache", "vision changes", "weakness"],
            k=random.randint(1, 3),
        )
    ),
    "{severity}": lambda: str(random.randint(3, 9)),
    "{conditions}": lambda: ", ".join(
        random.sample(
            [
                "hypertension",
                "diabetes mellitus type 2",
                "asthma",
                "hyperlipidemia",
                "GERD",
            ],
            k=random.randint(1, 3),
        )
    ),
    "{surgeries}": lambda: random.choice(
        [
            "appendectomy in childhood",
            "cholecystectomy 5 years ago",
            "knee arthroscopy",
            "none",
        ]
    ),
    "{family_conditions}": lambda: random.choice(
        ["heart disease", "cancer", "diabetes"]
    ),
    "{relative}": lambda: random.choice(["mother", "father", "sibling"]),
    "{social_factors}": lambda: random.choice(
        [
            "history of smoking (quit 5 years ago)",
            "occasional alcohol use",
            "denies illicit drug use",
            "lives alone",
        ]
    ),
    "{medications}": lambda: ", ".join(
        random.sample(
            [
                "Lisinopril 10mg",
                "Metformin 500mg BID",
                "Albuterol inhaler PRN",
                "Atorvastatin 20mg",
            ],
            k=random.randint(1, 3),
        )
    ),
    "{allergies}": lambda: random.choice(
        ["penicillin (rash)", "NKDA", "seasonal allergies", "shellfish"]
    ),
    "{bp}": lambda: f"{random.randint(110, 160)}/{random.randint(70, 95)}",
    "{hr}": lambda: str(random.randint(60, 100)),
    "{rr}": lambda: str(random.randint(14, 20)),
    "{temp}": lambda: f"{random.uniform(97.5, 101.5):.1f}",
    "{spo2}": lambda: str(random.randint(94, 100)),
    "{diagnosis_list}": lambda: ", ".join(
        random.sample(
            [
                "Acute bronchitis",
                "Gastritis",
                "Migraine headache",
                "Lumbar strain",
                "Community-acquired pneumonia",
            ],
            k=random.randint(1, 3),
        )
    ),
    "{service}": lambda: random.choice(["Medicine", "Observation", "Surgery"]),
    "{follow_up}": lambda: random.choice(
        ["rest and hydration", "return precautions", "taking medications as prescribed"]
    ),
    "{labs_imaging}": lambda: random.choice(
        ["CBC, CMP, Troponin", "Chest X-ray", "CT abdomen/pelvis", "Urinalysis", "EKG"]
    ),
    "{specialty}": lambda: random.choice(
        ["Cardiology", "GI", "Neurology", "Pulmonology"]
    ),
    "{medication_treatment}": lambda: random.choice(
        ["IV fluids", "antibiotics", "pain control regimen", "nebulizer treatments"]
    ),
    "{symptomatic_treatment}": lambda: random.choice(
        ["antiemetics", "analgesics", "cough suppressants"]
    ),
    "{education_topic}": lambda: random.choice(
        ["medication side effects", "warning signs", "dietary changes"]
    ),
    "{fup_time}": lambda: random.choice(["2-3 days", "1 week", "as needed"]),
    "{diff_dx}": lambda: ", ".join(
        random.sample(
            [
                "Pulmonary embolism",
                "Myocardial infarction",
                "Appendicitis",
                "Cholecystitis",
            ],
            k=random.randint(1, 2),
        )
    ),
}


def _fill_placeholders(text):
    for placeholder, func in _PLACEHOLDERS.items():
        text = text.replace(placeholder, func(), 1)  # Replace only once per instance
    return text


def _generate_section(phrases, num_sentences):
    section_text = " ".join(random.sample(phrases, min(num_sentences, len(phrases))))
    return _fill_placeholders(section_text)


def generate_fake_medical_record(word_count=1000):
    """Generates a more realistic fake medical record using templates."""
    # Calculate rough sentence counts for target word count (avg 15 words/sentence)
    target_sentences = word_count // 15
    hpi_sentences = max(5, int(target_sentences * 0.25))
    pmh_sentences = max(4, int(target_sentences * 0.20))
    exam_sentences = max(
        8, int(target_sentences * 0.25)
    )  # Exam often has many bullet points
    ap_sentences = max(5, int(target_sentences * 0.30))

    patient_name = f"John Doe {random.choice(string.ascii_uppercase)}"
    dob = f"19{random.randint(50,90)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
    chief_complaint = random.choice(_CHIEF_COMPLAINTS)

    record = f"## Patient Record: {random.randint(1000, 9999)}\n\n"
    record += "**Date:** 2025-04-15\n"
    record += f"**Patient Name:** {patient_name}\n"
    record += f"**DOB:** {dob}\n\n"

    record += f"**Chief Complaint:** {chief_complaint.capitalize()}.\n\n"

    record += "**History of Present Illness:**\n"
    hpi_section = ""
    # Ensure first sentence sets the stage
    first_hpi = _fill_placeholders(_HPI_PHRASES[0]) + f" {chief_complaint}. "
    hpi_section += first_hpi
    hpi_section += _generate_section(_HPI_PHRASES[1:], hpi_sentences - 1)
    # Add more generic text if needed to reach length (simple repetition for now)
    while len(hpi_section.split()) < (
        hpi_sentences * 10
    ):  # Aim for ~10 words/sentence avg
        hpi_section += " " + _generate_section(_HPI_PHRASES[1:], 2)
    record += hpi_section.strip() + ".\n\n"

    record += "**Past Medical History:**\n"
    pmh_section = _generate_section(_PMH_PHRASES, pmh_sentences)
    while len(pmh_section.split()) < (pmh_sentences * 10):
        pmh_section += " " + _generate_section(_PMH_PHRASES, 2)
    record += pmh_section.strip() + ".\n\n"

    record += "**Physical Examination:**\n"
    # Exam findings are often list-like
    exam_section_list = [
        _fill_placeholders(line)
        for line in random.sample(
            _EXAM_FINDINGS, min(exam_sentences, len(_EXAM_FINDINGS))
        )
    ]
    # Add more generic lines if needed
    while len(exam_section_list) < exam_sentences:
        exam_section_list.append(_fill_placeholders(random.choice(_EXAM_FINDINGS)))
    record += "\n".join([f"- {line}" for line in exam_section_list]) + "\n\n"

    record += "**Assessment and Plan:**\n"
    ap_section = _generate_section(_AP_PHRASES, ap_sentences)
    while len(ap_section.split()) < (ap_sentences * 10):
        ap_section += " " + _generate_section(_AP_PHRASES, 2)
    record += ap_section.strip() + ".\n"

    # Trim or pad to get closer to word_count if drastically off
    # This is a simple approach; more complex logic could be added
    current_words = len(record.split())
    if current_words < word_count * 0.8:
        padding_needed = word_count - current_words
        padding_sentences = padding_needed // 15
        record += "\n\n**Additional Notes:**\n" + _generate_section(
            _HPI_PHRASES + _AP_PHRASES, padding_sentences
        )
    elif current_words > word_count * 1.2:
        record = " ".join(record.split()[: int(word_count * 1.1)])  # Trim excess

    return record
