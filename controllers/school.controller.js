const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const db = require('../models');
const { formatSchool } = require('../utils/formatters');
const School = db.School;

exports.getMySchool = async (req, res) => {
  try {
    const school = await School.findByPk(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(formatSchool(school));
  } catch (err) {
    console.error('Get school error:', err);
    res.status(500).json({ message: 'Failed to get school' });
  }
};

exports.updateMySchool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const school = await School.findByPk(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const { name, address, province, phone, email } = req.body;

    if (email && email !== school.email) {
      const existing = await School.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already in use by another school' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (province !== undefined) updates.province = province;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;

    if (req.file) {
      if (school.logoUrl) {
        const oldPath = path.join(__dirname, '../', school.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.logoUrl = `/uploads/logos/${req.file.filename}`;
    }

    await school.update(updates);
    await school.reload();

    res.json(formatSchool(school));
  } catch (err) {
    console.error('Update school error:', err);
    res.status(500).json({ message: 'Failed to update school' });
  }
};

exports.updateSchoolLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const school = await School.findByPk(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    if (school.logoUrl) {
      const oldPath = path.join(__dirname, '../', school.logoUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await school.update({ logoUrl: `/uploads/logos/${req.file.filename}` });
    await school.reload();

    res.json(formatSchool(school));
  } catch (err) {
    console.error('Update school logo error:', err);
    res.status(500).json({ message: 'Failed to update school logo' });
  }
};
