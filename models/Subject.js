const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    gradeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
     deletedAt: {
      type: DataTypes.DATE
  }
  }, {
    tableName: 'subjects',
    updatedAt: false,
    paranoid: true,
  });

  return Subject;
};