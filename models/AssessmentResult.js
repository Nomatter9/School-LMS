const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('AssessmentResult', {
    id: { 
        type: DataTypes.UUID,
         defaultValue: DataTypes.UUIDV4,
          primaryKey: true
         },
    assessmentId: {
         type: DataTypes.UUID,
          allowNull: false
         },
    pupilId: {
         type: DataTypes.UUID,
          allowNull: false
         },
    marks: {
         type: DataTypes.INTEGER, 
         allowNull: false 
        },
    gradeSymbol: {
         type: DataTypes.STRING(5),
          allowNull: true 
        },
    remarks: { 
        type: DataTypes.TEXT, 
        allowNull: true
     },
     deletedAt: {
      type: DataTypes.DATE
  } 
  }, { tableName: 'assessment_results', 
    timestamps: true, 
    underscored: true ,
    paranoid:true
});
};