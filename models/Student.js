// models/Student.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',       
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'class_id',      
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',      
    },
    regNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'reg_number',     
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',  
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
    },
  }, {
    tableName: 'students',
    underscored: true,   
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Student;
};