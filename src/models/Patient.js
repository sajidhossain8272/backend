const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      maxlength: [120, 'Patient name cannot exceed 120 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [130, 'Age cannot exceed 130'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition / Diagnosis is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Critical', 'Under Observation', 'Stable', 'Recovering', 'Discharged'],
      default: 'Under Observation',
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Assigned Doctor is required'],
      index: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Optimization Indexes
patientSchema.index({ name: 'text', condition: 'text', phone: 'text' });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ condition: 1, status: 1 });

module.exports = mongoose.model('Patient', patientSchema);
