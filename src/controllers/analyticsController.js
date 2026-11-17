const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// @desc    Get aggregated dashboard analytics and visualization metrics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. High-level KPI counts
    const [totalDoctors, activeDoctors, totalPatients, criticalPatients] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: 'Active' }),
      Patient.countDocuments(),
      Patient.countDocuments({ status: 'Critical' }),
    ]);

    const averagePatientsPerDoctor =
      totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(1)) : 0;

    // 2. Patients per Doctor (Analytics & Bar Chart)
    const patientsPerDoctor = await Patient.aggregate([
      {
        $group: {
          _id: '$doctor',
          patientCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorInfo',
        },
      },
      { $unwind: '$doctorInfo' },
      {
        $project: {
          _id: 1,
          doctorName: '$doctorInfo.name',
          specialization: '$doctorInfo.specialization',
          hospital: '$doctorInfo.hospital',
          patientCount: 1,
        },
      },
      { $sort: { patientCount: -1 } },
      { $limit: 8 },
    ]);

    // 3. Date-based statistics (Past 30 days or daily trends)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const rawDateStats = await Patient.aggregate([
      {
        $match: {
          admissionDate: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$admissionDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days so the chart renders a continuous smooth line
    const dateStatsMap = new Map();
    rawDateStats.forEach((item) => {
      dateStatsMap.set(item._id, item.count);
    });

    const dateStatistics = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateStatistics.push({
        date: dateStr,
        label: displayLabel,
        admissions: dateStatsMap.get(dateStr) || 0,
      });
    }

    // 4. Condition Breakdown (Donut/Pie Chart)
    const conditionBreakdown = await Patient.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $project: {
          condition: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 5. Patient Status Distribution
    const rawStatusStats = await Patient.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusesOrder = ['Stable', 'Under Observation', 'Critical', 'Recovering', 'Discharged'];
    const statusMap = new Map(rawStatusStats.map((s) => [s._id, s.count]));
    const statusDistribution = statusesOrder.map((status) => ({
      status,
      count: statusMap.get(status) || 0,
      percentage:
        totalPatients > 0
          ? Math.round(((statusMap.get(status) || 0) / totalPatients) * 100)
          : 0,
    }));

    // 6. Recent Patients for fast overview table
    const recentPatients = await Patient.find()
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalDoctors,
          activeDoctors,
          totalPatients,
          criticalPatients,
          averagePatientsPerDoctor,
        },
        patientsPerDoctor,
        dateStatistics,
        conditionBreakdown,
        statusDistribution,
        recentPatients,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
};
