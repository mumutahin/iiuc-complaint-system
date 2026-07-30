import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { validateDepartmentInput } from '../../../shared/validators.js';
import { COMPLAINT_CATEGORIES } from '../../../shared/constants.js';

/** GET /api/departments — staff only (used by admin dropdowns/management page). */
export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  sendSuccess(res, { data: departments });
});

/** GET /api/departments/:id */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found.', 'NOT_FOUND');
  sendSuccess(res, { data: department });
});

/** POST /api/departments — superadmin only */
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, categories } = req.body;
  const { valid, errors } = validateDepartmentInput({ name, code });
  if (!valid) {
    throw new ApiError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', Object.entries(errors).map(([field, message]) => ({ field, message })));
  }
  const cleanCategories = Array.isArray(categories) ? categories.filter((c) => COMPLAINT_CATEGORIES.includes(c)) : [];

  const department = await Department.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description?.trim() || '',
    categories: cleanCategories,
  });
  sendSuccess(res, { statusCode: 201, data: department, message: 'Department created.' });
});

/** PATCH /api/departments/:id — superadmin only */
export const updateDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, categories } = req.body;
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found.', 'NOT_FOUND');

  const { valid, errors } = validateDepartmentInput({
    name: name ?? department.name,
    code: code ?? department.code,
  });
  if (!valid) {
    throw new ApiError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', Object.entries(errors).map(([field, message]) => ({ field, message })));
  }

  if (name !== undefined) department.name = name.trim();
  if (code !== undefined) department.code = code.trim().toUpperCase();
  if (description !== undefined) department.description = description.trim();
  if (categories !== undefined) {
    department.categories = Array.isArray(categories) ? categories.filter((c) => COMPLAINT_CATEGORIES.includes(c)) : [];
  }

  await department.save();
  sendSuccess(res, { data: department, message: 'Department updated.' });
});

/** DELETE /api/departments/:id — superadmin only, blocked if still in use. */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found.', 'NOT_FOUND');

  const [staffCount, complaintCount] = await Promise.all([
    User.countDocuments({ departmentId: department._id }),
    Complaint.countDocuments({ departmentId: department._id }),
  ]);

  if (staffCount > 0 || complaintCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete "${department.name}" — it still has ${staffCount} staff member(s) and ${complaintCount} complaint(s) linked to it. Reassign them first.`,
      'DEPARTMENT_IN_USE'
    );
  }

  await department.deleteOne();
  sendSuccess(res, { message: 'Department deleted.' });
});
