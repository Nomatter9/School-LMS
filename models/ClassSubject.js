const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ClassSubject', {
    id: { 
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4,
         primaryKey: true
         },
    classId: {
         type: DataTypes.UUID,
          allowNull: false
         },
    subjectId: {
        type: DataTypes.UUID, 
        allowNull: false 
    },
    teacherId: { 
        type: DataTypes.UUID, 
        allowNull: true 
    },
    deletedAt: {
      type: DataTypes.DATE
  }
  }, { tableName: 'class_subjects', 
    timestamps: true, 
    underscored: true,
    paranoid: true 
});
};