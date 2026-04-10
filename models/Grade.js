const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Grade = sequelize.define('Grade', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 7 },
    },
    label: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
     deletedAt: {
      type: DataTypes.DATE
  }
  }, {
    tableName: 'grades',
    timestamps: false,
    paranoid: true,
  });


  return Grade;
};