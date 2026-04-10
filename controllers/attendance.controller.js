const db = require('../models');
const { validationResult } = require('express-validator');

exports.getByClass = async (req, res) => {
  try {
    const { date } = req.query;
    const where = { classId: req.params.classId };
    if (date) where.date = date;

    const records = await db.Attendance.findAll({
      where,
      include: [
        {
          model: db.Student, as: 'student',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
      order: [[{ model: db.Student, as: 'student' }, { model: db.User, as: 'user' }, 'firstName', 'ASC']],
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};

exports.save = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const { classId, date, records } = req.body;

    const results = await Promise.all(
      records.map(async (r) => {
        const [att, created] = await db.Attendance.findOrCreate({
          where: { classId, pupilId: r.pupilId, date },
          defaults: {
            status: r.status,
            notes: r.notes || null,
            recordedBy: req.user.id,
          },
        });
        if (!created) {
          await att.update({
            status: r.status,
            notes: r.notes || null,
            recordedBy: req.user.id,
          });
        }
        return att;
      })
    );

    res.json({ message: 'Attendance saved', records: results });
  } catch (err) {
    console.error('Save attendance error:', err);
    res.status(500).json({ message: 'Failed to save attendance' });
  }
};

exports.getReport = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const { Op } = require('sequelize');

    const where = { classId };
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const records = await db.Attendance.findAll({
      where,
      include: [
        {
          model: db.Student, as: 'student',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
      order: [['date', 'ASC']],
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance report' });
  }
};