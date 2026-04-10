const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('HomeworkSubmission', {
    id: {
         type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
           primaryKey: true
        },
    homeworkId: {
         type: DataTypes.UUID, 
         allowNull: false 
        },
    pupilId: {
         type: DataTypes.UUID,
          allowNull: false 
        },
    fileUrl: {
         type: DataTypes.TEXT,
          allowNull: true 
        },
    notes: { 
        type: DataTypes.TEXT, 
        allowNull: true
     },
    marks: {
         type: DataTypes.INTEGER,
          allowNull: true 
        },
    feedback: {
         type: DataTypes.TEXT, 
         allowNull: true 
        },
    submittedAt: {
         type: DataTypes.DATE,
          allowNull: true 
        },
    gradedAt: { 
        type: DataTypes.DATE,
         allowNull: true 
        },
       deletedAt: {
      type: DataTypes.DATE
  }
  }, { tableName: 'homework_submissions',
     timestamps: true, 
     underscored: true,
     paranoid:true
    });
};