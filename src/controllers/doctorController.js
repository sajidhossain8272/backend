const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// @desc    Get all doctors with search, filters, pagination, and patient count
// @route   GET /api/doctors
// @access  Private
const getDoctors = async (req, res, next) => {
  try {
    const {
      search,
      specialization,
      hospital,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build Match Criteria
    const matchCriteria = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchCriteria.$or = [
        { name: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (specialization && specialization !== 'All') {
      matchCriteria.specialization = specialization;
    }

    if (hospital && hospital !== 'All') {
      matchCriteria.hospital = hospital;
    }

    if (status && status !== 'All') {
      matchCriteria.status = status;
    }

    // Date-wise filtering on createdAt
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) {
        matchCriteria.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchCriteria.createdAt.$lte = end;
      }
    }

    // Sort order mapping
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';

    // High performance MongoDB Aggregation Pipeline
    const pipeline = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctor',
          as: 'patientsList',
        },
      },
      {
        $addFields: {
          patientCount: { $size: '$patientsList' },
        },
      },
      {
        $project: {
          patientsList: 0, // exclude patient documents array for lighter payload
        },
      },
      {
        $sort: { [sortField]: sortDirection },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    const result = await Doctor.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total || 0;
    const doctors = result[0]?.data || [];
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Also get unique specializations and hospitals for filter dropdowns
    const filterOptions = await Doctor.aggregate([
      {
        $facet: {
          specializations: [
            { $group: { _id: '$specialization' } },
            { $sort: { _id: 1 } },
          ],
          hospitals: [
            { $group: { _id: '$hospital' } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const specializations = filterOptions[0]?.specializations.map((s) => s._id) || [];
    const hospitals = filterOptions[0]?.hospitals.map((h) => h._id) || [];

    res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        filters: {
          specializations,
          hospitals,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor by ID with assigned patients
// @route   GET /api/doctors/:id
// @access  Private
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Doctor ID format',
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const patients = await Patient.find({ doctor: id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        doctor,
        patients,
        patientCount: patients.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new doctor
// @route   POST /api/doctors
// @access  Private
const createDoctor = async (req, res, next) => {
  try {
    const { name, specialization, hospital, phone, email, bio, roomNumber, status } = req.body;

    // Check if email already registered for another doctor
    const existing = await Doctor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A doctor with this email address is already registered',
      });
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      hospital,
      phone,
      email,
      bio: bio || '',
      roomNumber: roomNumber || '',
      status: status || 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a doctor
// @route   PUT /api/doctors/:id
// @access  Private
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Doctor ID format',
      });
    }

    const { email } = req.body;
    if (email) {
      const existing = await Doctor.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email is already used by another doctor',
        });
      }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: updatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a doctor
// @route   DELETE /api/doctors/:id
// @access  Private
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Doctor ID format',
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Cascade: delete assigned patients or reassign
    const deletedPatients = await Patient.deleteMany({ doctor: id });
    await Doctor.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Doctor and ${deletedPatients.deletedCount} associated patient(s) removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patients corresponding to a specific doctor
// @route   GET /api/doctors/:id/patients
// @access  Private
const getDoctorPatients = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { search, page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Doctor ID format',
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { doctor: id };
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { condition: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Patient.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        doctor,
        patients,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a patient under a specific doctor
// @route   POST /api/doctors/:id/patients
// @access  Private
const addPatientToDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Doctor ID format',
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const { name, age, gender, phone, condition, status, admissionDate, notes } = req.body;

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      condition,
      status: status || 'Under Observation',
      doctor: id,
      admissionDate: admissionDate || Date.now(),
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Patient added under doctor successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a patient from the doctor's patient list
// @route   DELETE /api/doctors/:id/patients/:patientId
// @access  Private
const removePatientFromDoctor = async (req, res, next) => {
  try {
    const { id, patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Doctor ID or Patient ID format',
      });
    }

    const patient = await Patient.findOneAndDelete({ _id: patientId, doctor: id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found under this doctor',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient removed from doctor list successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  addPatientToDoctor,
  removePatientFromDoctor,
};
