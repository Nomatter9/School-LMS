const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Homework', {
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
    description: { 
        type: DataTypes.TEXT,
         allowNull: true 
        },
    dueDate: {
         type: DataTypes.DATEONLY,
         allowNull: false 
        },
    maxMarks: {
        type: DataTypes.INTEGER,
         allowNull: true
         },
    fileUrl: {
         type: DataTypes.TEXT, 
         allowNull: true
         },
    isPublished: {
         type: DataTypes.BOOLEAN,
          defaultValue: false 
        },
             deletedAt: {
      type: DataTypes.DATE
  }
  }, { tableName: 'homework', 
    timestamps: true,
     underscored: true,
     paranoid: true
    });
};