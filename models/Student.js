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
      references: { model: 'users', key: 'id' },
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'classes', key: 'id' },
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    regNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true,
    },
     deletedAt: {
      type: DataTypes.DATE
  }
  }, {
    tableName: 'students',
    timestamps: true,
    underscored: true,
    paranoid: true,
  });

  return Student;
};