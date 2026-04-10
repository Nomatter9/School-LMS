const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Class = sequelize.define('Class', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    gradeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    capacity: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
 deletedAt: {
      type: DataTypes.DATE
  }
  }, {
    tableName: 'classes',
    updatedAt: false,
    paranoid: true,
  });


  return Class;
};