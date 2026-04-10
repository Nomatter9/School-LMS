const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Assessment', {
    id: { 
        type: DataTypes.UUID,
         defaultValue: DataTypes.UUIDV4,
          primaryKey: true 
        },
    classSubjectId: {
         type: DataTypes.UUID,
          allowNull: false 
        },
    termId: {
         type: DataTypes.UUID,
          allowNull: false 
        },
    title: { 
        type: DataTypes.STRING(200),
         allowNull: false
         },
    type: {
         type: DataTypes.ENUM('ca', 'exam'), 
         allowNull: false, 
         defaultValue: 'ca' },
    maxMarks: { 
        type: DataTypes.INTEGER,
         allowNull: false,
          defaultValue: 100 },
    weightPercent: 
    { type: DataTypes.INTEGER,
         allowNull: true
         },
    date: {
         type: DataTypes.DATEONLY,
          allowNull: true 
        },
     deletedAt: {
      type: DataTypes.DATE
  }
  }, { tableName: 'assessments', 
    timestamps: true,
     underscored: true,
     paranoid: true
    });
};