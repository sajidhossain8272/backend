const express = require('express');
const { body } = require('express-validator');
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  addPatientToDoctor,
  removePatientFromDoctor,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Doctor validation schema
const doctorValidation = [
  body('name').trim().notEmpty().withMessage('Doctor name is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('hospital').trim().notEmpty().withMessage('Hospital is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  validate,
];

// Patient under doctor validation schema
const patientUnderDoctorValidation = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('age')
    .isInt({ min: 0, max: 130 })
    .withMessage('Age must be an integer between 0 and 130'),
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('phone').trim().notEmpty().withMessage('Contact phone is required'),
  body('condition').trim().notEmpty().withMessage('Condition is required'),
  validate,
];

// Protect all doctor routes
router.use(protect);

router.route('/')
  .get(getDoctors)
  .post(doctorValidation, createDoctor);

router.route('/:id')
  .get(getDoctorById)
  .put(doctorValidation, updateDoctor)
  .delete(deleteDoctor);

router.route('/:id/patients')
  .get(getDoctorPatients)
  .post(patientUnderDoctorValidation, addPatientToDoctor);

router.route('/:id/patients/:patientId')
  .delete(removePatientFromDoctor);

module.exports = router;
