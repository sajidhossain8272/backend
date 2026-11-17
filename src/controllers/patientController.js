const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// @desc    Get all patients with search, filtering, and pagination
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res, next) => {
  try {
    const {
      search,
      condition,
      status,
      doctor,
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

    const matchCriteria = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      
      // Also allow searching by doctor's name
      const matchingDoctors = await Doctor.find({ name: searchRegex }).select('_id');
      const doctorIds = matchingDoctors.map((d) => d._id);

      matchCriteria.$or = [
        { name: searchRegex },
        { condition: searchRegex },
        { phone: searchRegex },
        { notes: searchRegex },
        { doctor: { $in: doctorIds } },
      ];
    }

    if (condition && condition !== 'All') {
      matchCriteria.condition = condition;
    }

    if (status && status !== 'All') {
      matchCriteria.status = status;
    }

    if (doctor && doctor !== 'All') {
      if (mongoose.Types.ObjectId.isValid(doctor)) {
        matchCriteria.doctor = new mongoose.Types.ObjectId(doctor);
      }
    }

    // Date-wise filtering on admissionDate or createdAt
    if (startDate || endDate) {
      matchCriteria.admissionDate = {};
      if (startDate) {
        matchCriteria.admissionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchCriteria.admissionDate.$lte = end;
      }
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';

    const [patients, total] = await Promise.all([
      Patient.find(matchCriteria)
        .populate('doctor', 'name specialization hospital email phone')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Patient.countDocuments(matchCriteria),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    // Get filter options (conditions, statuses, active doctors)
    const [conditions, doctorsList] = await Promise.all([
      Patient.distinct('condition'),
      Doctor.find({}, 'name specialization').sort({ name: 1 }).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        patients,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        filters: {
          conditions,
          statuses: ['Critical', 'Under Observation', 'Stable', 'Recovering', 'Discharged'],
          doctors: doctorsList,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Patient ID format',
      });
    }

    const patient = await Patient.findById(id).populate(
      'doctor',
      'name specialization hospital email phone roomNumber'
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res, next) => {
  try {
    const { name, age, gender, phone, condition, status, doctor, admissionDate, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctor)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Doctor ID must be selected',
      });
    }

    const doctorExists = await Doctor.findById(doctor);
    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: 'Assigned doctor was not found in the database',
      });
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      condition,
      status: status || 'Under Observation',
      doctor,
      admissionDate: admissionDate || Date.now(),
      notes: notes || '',
    });

    const populatedPatient = await Patient.findById(patient._id).populate(
      'doctor',
      'name specialization hospital email'
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: populatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient information
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Patient ID format',
      });
    }

    if (req.body.doctor) {
      if (!mongoose.Types.ObjectId.isValid(req.body.doctor)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Doctor ID format',
        });
      }
      const doctorExists = await Doctor.findById(req.body.doctor);
      if (!doctorExists) {
        return res.status(404).json({
          success: false,
          message: 'Selected doctor does not exist',
        });
      }
    }

    const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('doctor', 'name specialization hospital email phone');

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Patient ID format',
      });
    }

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
