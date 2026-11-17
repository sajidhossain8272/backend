const doctorsSeed = [
  {
    name: 'Dr. Sarah Jenkins',
    specialization: 'Cardiology',
    hospital: 'Metro General Hospital',
    phone: '+1 (555) 234-5678',
    email: 'sarah.jenkins@metrohealth.org',
    status: 'Active',
    bio: 'Lead Cardiologist specializing in cardiovascular care, preventative cardiology, and echocardiography.',
    roomNumber: 'Suite 401',
  },
  {
    name: 'Dr. Marcus Vance',
    specialization: 'Neurology',
    hospital: 'CareGuide Central',
    phone: '+1 (555) 345-6789',
    email: 'marcus.vance@careguide.org',
    status: 'Active',
    bio: 'Senior Neurologist with expertise in stroke management, acute migraine syndromes, and neurodegenerative disorders.',
    roomNumber: 'Suite 210',
  },
  {
    name: 'Dr. Elena Rostova',
    specialization: 'Pediatrics',
    hospital: 'Childrens Health Pavilion',
    phone: '+1 (555) 456-7890',
    email: 'elena.rostova@childrenshealth.org',
    status: 'Active',
    bio: 'Dedicated pediatrician with 12 years of experience in early developmental screenings and pediatric immunology.',
    roomNumber: 'Suite 104',
  },
  {
    name: 'Dr. David Chen',
    specialization: 'Orthopedics',
    hospital: 'St. Jude Medical Center',
    phone: '+1 (555) 567-8901',
    email: 'david.chen@stjudemed.org',
    status: 'Active',
    bio: 'Board-certified orthopedic surgeon specializing in joint reconstruction, arthroscopy, and sports medicine.',
    roomNumber: 'Suite 305',
  },
  {
    name: 'Dr. Sophia Al-Mansoor',
    specialization: 'Oncology',
    hospital: 'Metro General Hospital',
    phone: '+1 (555) 678-9012',
    email: 'sophia.almansoor@metrohealth.org',
    status: 'Active',
    bio: 'Medical oncologist focused on targeted immunotherapy and clinical research trials.',
    roomNumber: 'Suite 512',
  },
  {
    name: 'Dr. Robert Thorne',
    specialization: 'Dermatology',
    hospital: 'CareGuide Central',
    phone: '+1 (555) 789-0123',
    email: 'robert.thorne@careguide.org',
    status: 'Active',
    bio: 'Specialist in dermatopathology, clinical psoriasis management, and complex skin lesions.',
    roomNumber: 'Suite 115',
  },
  {
    name: 'Dr. Maya Patel',
    specialization: 'Endocrinology',
    hospital: 'St. Jude Medical Center',
    phone: '+1 (555) 890-1234',
    email: 'maya.patel@stjudemed.org',
    status: 'Active',
    bio: 'Expert in diabetes management, endocrine metabolic disorders, and thyroid pathology.',
    roomNumber: 'Suite 228',
  },
  {
    name: 'Dr. Arthur Pendelton',
    specialization: 'Pulmonology',
    hospital: 'City Health Pavilion',
    phone: '+1 (555) 901-2345',
    email: 'arthur.pendelton@cityhealth.org',
    status: 'On Leave',
    bio: 'Pulmonary specialist focused on COPD, adult asthma, and sleep-disordered breathing.',
    roomNumber: 'Suite 318',
  },
];

const patientNames = [
  'James Wilson', 'Emma Watson', 'Liam Martinez', 'Olivia Taylor', 'Noah Anderson',
  'Sophia Thomas', 'Lucas Jackson', 'Mia White', 'Benjamin Harris', 'Charlotte Martin',
  'Alexander Clark', 'Amelia Lewis', 'Henry Robinson', 'Evelyn Walker', 'William Hall',
  'Harper Young', 'Ethan King', 'Abigail Wright', 'Michael Lopez', 'Emily Hill',
  'Daniel Scott', 'Elizabeth Green', 'Matthew Adams', 'Sofia Baker', 'Jackson Gonzalez',
  'Avery Nelson', 'Sebastian Carter', 'Ella Mitchell', 'David Perez', 'Scarlett Roberts',
];

const conditionsBySpecialization = {
  Cardiology: ['Hypertension', 'Arrhythmia', 'Coronary Artery Disease', 'Heart Failure'],
  Neurology: ['Migraine Syndrome', 'Epilepsy', 'Parkinsonism', 'Neuropathy'],
  Pediatrics: ['Pediatric Asthma', 'Allergic Rhinitis', 'Otitis Media', 'Viral Gastroenteritis'],
  Orthopedics: ['Osteoarthritis', 'Meniscus Tear', 'Lumbar Disc Herniation', 'Rotator Cuff Tear'],
  Oncology: ['Breast Carcinoma', 'Lymphoma Evaluation', 'Colorectal Polyp Care', 'Immunotherapy Follow-up'],
  Dermatology: ['Chronic Eczema', 'Psoriasis Vulgaris', 'Atopic Dermatitis', 'Melanocytic Nevus'],
  Endocrinology: ['Type 2 Diabetes', 'Hypothyroidism', 'Hashimoto Thyroiditis', 'Adrenal Insufficiency'],
  Pulmonology: ['Chronic Bronchitis', 'Severe Asthma', 'Sleep Apnea Syndrome', 'Pneumonia Recovery'],
};

const statuses = ['Stable', 'Under Observation', 'Critical', 'Recovering', 'Discharged'];
const genders = ['Male', 'Female'];

module.exports = {
  doctorsSeed,
  patientNames,
  conditionsBySpecialization,
  statuses,
  genders,
};
