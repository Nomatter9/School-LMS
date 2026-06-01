const formatSchool = (school) => ({
  id: school.id,
  name: school.name,
  address: school.address,
  province: school.province,
  phone: school.phone,
  email: school.email,
  logoUrl: school.logoUrl,
  createdAt: school.createdAt,
});

const formatUser = (user) => ({
  id: user.id,
  avatarUrl: user.avatarUrl || null,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  schoolId: user.schoolId,
  classId: user.classId || null,
  isActive: user.isActive,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

module.exports = { formatSchool, formatUser };
