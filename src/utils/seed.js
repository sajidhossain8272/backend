require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const {
  doctorsSeed,
  patientNames,
  conditionsBySpecialization,
  statuses,
  genders,
} = require('./seedData');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
    ]);

    // 1. Create Default Admin User
    console.log('[Seed] Creating Administrator account...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@doctortracker.com',
      password: 'Password@123',
      role: 'admin',
    });
    console.log(`[Seed] Admin created: ${adminUser.email} / Password@123`);

    // 2. Insert Doctors
    console.log('[Seed] Inserting doctors...');
    const insertedDoctors = await Doctor.insertMany(doctorsSeed);
    console.log(`[Seed] Inserted ${insertedDoctors.length} doctors.`);

    // 3. Generate and Insert Patients
    console.log('[Seed] Generating patients across doctors...');
    const patients = [];

    patientNames.forEach((name, index) => {
      // Pick a doctor in round-robin fashion with weighted distribution
      const doctor = insertedDoctors[index % insertedDoctors.length];
      const availableConditions =
        conditionsBySpecialization[doctor.specialization] || ['General Health Check'];
      const condition = availableConditions[index % availableConditions.length];
      const gender = genders[index % genders.length];
      const status = statuses[index % statuses.length];
      const age = 18 + ((index * 7) % 65);

      // Distribute admission dates across the past 28 days
      const daysAgo = (index * 2) % 28;
      const admissionDate = new Date();
      admissionDate.setDate(admissionDate.getDate() - daysAgo);
      admissionDate.setHours(9 + (index % 8), (index * 17) % 60, 0, 0);

      patients.push({
        name,
        age,
        gender,
        phone: `+1 (555) 019-${String(index + 100).padStart(4, '0')}`,
        condition,
        status,
        doctor: doctor._id,
        admissionDate,
        notes: `Clinical case assigned to ${doctor.name} at ${doctor.hospital}. Routine monitoring scheduled.`,
        createdAt: admissionDate,
      });
    });

    const insertedPatients = await Patient.insertMany(patients);
    console.log(`[Seed] Inserted ${insertedPatients.length} patients successfully.`);

    console.log('\n=========================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('Default Admin Credentials:');
    console.log('Email:    admin@doctortracker.com');
    console.log('Password: Password@123');
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
