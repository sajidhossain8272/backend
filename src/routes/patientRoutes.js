const express = require('express');
const { body } = require('express-validator');
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const patientValidation = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('age')
    .isInt({ min: 0, max: 130 })
    .withMessage('Age must be an integer between 0 and 130'),
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('condition').trim().notEmpty().withMessage('Condition / Diagnosis is required'),
  body('doctor').notEmpty().withMessage('Assigned Doctor is required'),
  validate,
];

// Protect all patient routes
router.use(protect);

router.route('/')
  .get(getPatients)
  .post(patientValidation, createPatient);

router.route('/:id')
  .get(getPatientById)
  .put(updatePatient)
  .delete(deletePatient);

module.exports = router;
