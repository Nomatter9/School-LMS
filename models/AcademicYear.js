const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AcademicYear = sequelize.define('AcademicYear', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
     deletedAt: {
      type: DataTypes.DATE
  }
  }, {
    tableName: 'academic_years',
    updatedAt: false,
    paranoid: true
  });

 

  return AcademicYear;
};