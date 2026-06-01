const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LessonProgress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    pupilId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'lesson_progress',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['lesson_id', 'pupil_id'] }],
  });
};
