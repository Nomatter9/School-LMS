const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Lesson', {
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
    content: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    videoUrl: { 
        type: DataTypes.TEXT, 
        allowNull: true
     },
    fileUrl: {
         type: DataTypes.TEXT,
          allowNull: true 
        },
    weekNumber: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
    },
    isPublished: {
         type: DataTypes.BOOLEAN,
          defaultValue: false 
        },
          deletedAt: {
      type: DataTypes.DATE
  }
  }, { tableName: 'lessons',
     timestamps: true, 
     underscored: true ,
     paranoid : true
    });
};