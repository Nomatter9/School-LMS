const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Term = sequelize.define('Term', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    termNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 3 },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
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
    tableName: 'terms',
    updatedAt: false,
    paranoid: true,
  });


  return Term;
};