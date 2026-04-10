const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Attendance', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    classId: {
         type: DataTypes.UUID,
          allowNull: false 
        },
    pupilId: {
         type: DataTypes.UUID, 
         allowNull: false 
        },
    date: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late'),
      allowNull: false,
      defaultValue: 'present',
    },
    notes: { 
        type: DataTypes.TEXT, 
        allowNull: true
     },
    recordedBy: { 
        type: DataTypes.UUID,
         allowNull: false 
        },
     deletedAt: {
      type: DataTypes.DATE
  } 
  }, {
    tableName: 'attendance',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['class_id', 'pupil_id', 'date'] }],
    paranoid: true
  });
};