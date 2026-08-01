import { Complaint } from '../models/Complaint.js';
import { Department } from '../models/Department.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, buildPagination } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeComplaint, serializeComplaintList } from '../utils/serializeComplaint.js';
import { uploadImage as uploadToCloudinary, deleteImages } from '../services/cloudinaryService.js';
import { createAndEmit, notifyDepartment, notifySuperadmins } from '../services/notificationService.js';
import { sendStatusUpdateEmail } from '../services/emailService.js';
import { validateComplaintInput, isValidStatusTransition } from '../../../shared/validators.js';
import { LIMITS, COMPLAINT_STATUSES, PRIORITIES } from '../../../shared/constants.js';

const STAFF_POPULATE = [
  { path: 'studentId', select: 'name email' },
  { path: 'departmentId', select: 'name code' },
  { path: 'assignedTo', select: 'name' },
  { path: 'comments.authorId', select: 'name role' },
  { path: 'activityLogs.performedBy', select: 'name' },
];

/** Builds { departmentId: ... } scoping for a department-level admin; superadmin gets no forced filter. */
function scopeForStaff(user) {
  if (user.role === 'superadmin') return {};
  // A department-admin sees complaints already in their department, PLUS
  // still-unassigned ones so they can help triage. They can never see a
  // complaint that's been routed to a DIFFERENT department.
  return { $or: [{ departmentId: user.departmentId }, { departmentId: null }] };
}

function assertStaffCanAccessComplaint(user, complaint) {
  if (user.role === 'superadmin') return;
  const deptId = complaint.departmentId?._id || complaint.departmentId;
  if (deptId && String(deptId) !== String(user.departmentId)) {
    throw new ApiError(403, 'This complaint belongs to a different department.', 'FORBIDDEN');
  }
}

async function autoRouteDepartment(category) {
  const dept = await Department.findOne({ categories: category });
  return dept ? dept._id : null;
}

// ---------------------------------------------------------------------
// POST /api/complaints  (student)
// ---------------------------------------------------------------------
export const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, location, isAnonymous } = req.body;

  const { valid, errors } = validateComplaintInput({ title, description, category, location });
  if (!valid) {
    throw new ApiError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', Object.entries(errors).map(([field, message]) => ({ field, message })));
  }

  const files = req.files || [];
  const uploaded = [];
  try {
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadToCloudinary(file.buffer);
      uploaded.push(result);
    }
  } catch (err) {
    // Clean up anything that DID upload before the failure so we don't
    // leave orphaned images in Cloudinary for a complaint that never saves.
    await deleteImages(uploaded.map((u) => u.publicId));
    throw new ApiError(502, 'Image upload failed. Please try again.', 'UPLOAD_FAILED');
  }

  const departmentId = await autoRouteDepartment(category);

  const complaint = await Complaint.create({
    title: title.trim(),
    description: description.trim(),
    category,
    location: location.trim(),
    studentId: req.user._id,
    departmentId,
    isAnonymous: Boolean(isAnonymous === true || isAnonymous === 'true'),
    images: uploaded.map((u) => u.url),
    imagePublicIds: uploaded.map((u) => u.publicId),
    activityLogs: [{ action: 'Complaint submitted', performedBy: req.user._id, timestamp: new Date() }],
  });

  // Real-time notify whoever should triage this — fire-and-forget, must
  // never block or fail the response to the student who just submitted.
  if (departmentId) {
    notifyDepartment({
      departmentId,
      type: 'new_complaint',
      title: 'New complaint',
      message: `New complaint: "${complaint.title}"`,
      complaintId: complaint._id,
    }).catch((err) => console.error('[notify] department notify failed:', err.message));
  } else {
    notifySuperadmins({
      type: 'new_complaint',
      title: 'New unassigned complaint',
      message: `New complaint needs a department: "${complaint.title}"`,
      complaintId: complaint._id,
    }).catch((err) => console.error('[notify] superadmin notify failed:', err.message));
  }

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { statusCode: 201, data: serializeComplaint(populated, req.user), message: 'Complaint submitted.' });
});

// ---------------------------------------------------------------------
// GET /api/complaints/my  (student — own complaints)
// ---------------------------------------------------------------------
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { status, category, search, page = 1, limit = LIMITS.PAGE_SIZE_DEFAULT } = req.query;
  const query = { studentId: req.user._id };
  if (status && COMPLAINT_STATUSES.includes(status)) query.status = status;
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(LIMITS.PAGE_SIZE_MAX, Math.max(1, parseInt(limit, 10) || LIMITS.PAGE_SIZE_DEFAULT));

  const [docs, total] = await Promise.all([
    Complaint.find(query)
      .populate(STAFF_POPULATE)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Complaint.countDocuments(query),
  ]);

  sendSuccess(res, {
    data: serializeComplaintList(docs, req.user),
    pagination: buildPagination({ total, page: pageNum, limit: limitNum }),
  });
});

// ---------------------------------------------------------------------
// GET /api/complaints/stats  (student's own dashboard counters)
// ---------------------------------------------------------------------
export const getComplaintStats = asyncHandler(async (req, res) => {
  const agg = await Complaint.aggregate([
    { $match: { studentId: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(COMPLAINT_STATUSES.map((s) => [s, 0]));
  agg.forEach((row) => {
    byStatus[row._id] = row.count;
  });
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  sendSuccess(res, { data: { total, byStatus } });
});

// ---------------------------------------------------------------------
// GET /api/complaints/community  (any student — public board to upvote)
// ---------------------------------------------------------------------
export const getCommunityComplaints = asyncHandler(async (req, res) => {
  const { category, status, search, sort = 'upvotes', page = 1, limit = LIMITS.PAGE_SIZE_DEFAULT } = req.query;
  const query = {};
  if (category) query.category = category;
  if (status && COMPLAINT_STATUSES.includes(status)) query.status = status;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(LIMITS.PAGE_SIZE_MAX, Math.max(1, parseInt(limit, 10) || LIMITS.PAGE_SIZE_DEFAULT));
  const sortStage =
    sort === 'recent' ? { createdAt: -1 } : { upvoteCount: -1, createdAt: -1 };

  const [docs, total] = await Promise.all([
    Complaint.aggregate([
      { $match: query },
      { $addFields: { upvoteCount: { $size: '$upvotes' } } },
      { $sort: sortStage },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ]),
    Complaint.countDocuments(query),
  ]);

  const populated = await Complaint.populate(docs, [{ path: 'studentId', select: 'name email' }]);

  sendSuccess(res, {
    data: serializeComplaintList(populated, req.user),
    pagination: buildPagination({ total, page: pageNum, limit: limitNum }),
  });
});

// ---------------------------------------------------------------------
// GET /api/complaints  (admin/superadmin — dept-scoped for admin)
// ---------------------------------------------------------------------
export const getAllComplaints = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    priority,
    departmentId,
    assignedTo,
    search,
    dateFrom,
    dateTo,
    page = 1,
    limit = LIMITS.PAGE_SIZE_DEFAULT,
    sort = 'newest',
  } = req.query;

  const query = { ...scopeForStaff(req.user) };
  if (status && COMPLAINT_STATUSES.includes(status)) query.status = status;
  if (category) query.category = category;
  if (priority && PRIORITIES.includes(priority)) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  // superadmin may narrow further by a specific department
  if (req.user.role === 'superadmin' && departmentId) query.departmentId = departmentId;
  if (search) query.$text = { $search: search };
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(LIMITS.PAGE_SIZE_MAX, Math.max(1, parseInt(limit, 10) || LIMITS.PAGE_SIZE_DEFAULT));
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priority: { priority: -1, createdAt: -1 },
  };

  const [docs, total] = await Promise.all([
    Complaint.find(query)
      .populate(STAFF_POPULATE)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Complaint.countDocuments(query),
  ]);

  sendSuccess(res, {
    data: serializeComplaintList(docs, req.user),
    pagination: buildPagination({ total, page: pageNum, limit: limitNum }),
  });
});

// ---------------------------------------------------------------------
// GET /api/complaints/:id
// ---------------------------------------------------------------------
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(STAFF_POPULATE);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');

  if (req.user.role !== 'student') {
    assertStaffCanAccessComplaint(req.user, complaint);
  }

  sendSuccess(res, { data: serializeComplaint(complaint, req.user) });
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id  (owner, only while Pending)
// ---------------------------------------------------------------------
export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');
  if (String(complaint.studentId) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own complaints.', 'FORBIDDEN');
  }
  if (complaint.status !== 'Pending') {
    throw new ApiError(409, 'This complaint is already being processed and can no longer be edited.', 'ALREADY_PROCESSING');
  }

  const { title, description, category, location, isAnonymous } = req.body;
  const { valid, errors } = validateComplaintInput({
    title: title ?? complaint.title,
    description: description ?? complaint.description,
    category: category ?? complaint.category,
    location: location ?? complaint.location,
  });
  if (!valid) {
    throw new ApiError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', Object.entries(errors).map(([field, message]) => ({ field, message })));
  }

  if (title !== undefined) complaint.title = title.trim();
  if (description !== undefined) complaint.description = description.trim();
  if (location !== undefined) complaint.location = location.trim();
  if (isAnonymous !== undefined) complaint.isAnonymous = Boolean(isAnonymous === true || isAnonymous === 'true');

  if (category !== undefined && category !== complaint.category) {
    complaint.category = category;
    complaint.departmentId = await autoRouteDepartment(category);
  }

  // Optional: replace images entirely if new files were sent.
  if (req.files && req.files.length > 0) {
    await deleteImages(complaint.imagePublicIds);
    const uploaded = [];
    for (const file of req.files) {
      // eslint-disable-next-line no-await-in-loop
      uploaded.push(await uploadToCloudinary(file.buffer));
    }
    complaint.images = uploaded.map((u) => u.url);
    complaint.imagePublicIds = uploaded.map((u) => u.publicId);
  }

  complaint.activityLogs.push({ action: 'Complaint edited', performedBy: req.user._id, timestamp: new Date() });
  await complaint.save();

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { data: serializeComplaint(populated, req.user), message: 'Complaint updated.' });
});

// ---------------------------------------------------------------------
// DELETE /api/complaints/:id
//   - student: only their own, only while Pending
//   - staff (admin/superadmin): any complaint in scope, any status —
//     lets them clear out spam/nonsense complaints regardless of where
//     they are in the workflow
// ---------------------------------------------------------------------
export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');

  const isStaff = req.user.role === 'admin' || req.user.role === 'superadmin';

  if (isStaff) {
    assertStaffCanAccessComplaint(req.user, complaint);
  } else {
    if (String(complaint.studentId) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only delete your own complaints.', 'FORBIDDEN');
    }
    if (complaint.status !== 'Pending') {
      throw new ApiError(409, 'This complaint is already being processed and can no longer be deleted.', 'ALREADY_PROCESSING');
    }
  }

  await deleteImages(complaint.imagePublicIds);
  await Notification.deleteMany({ complaintId: complaint._id });
  await complaint.deleteOne();

  sendSuccess(res, { message: 'Complaint deleted.' });
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id/status  (staff)
// ---------------------------------------------------------------------
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, remark } = req.body;
  if (!COMPLAINT_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid status value.', 'VALIDATION_ERROR');
  }

  const complaint = await Complaint.findById(req.params.id).populate('studentId', 'name email');
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');
  assertStaffCanAccessComplaint(req.user, complaint);

  if (!isValidStatusTransition(complaint.status, status)) {
    throw new ApiError(400, `Cannot move a complaint from "${complaint.status}" to "${status}".`, 'INVALID_TRANSITION');
  }

  const previousStatus = complaint.status;
  complaint.status = status;
  if (status === 'Resolved') complaint.resolvedAt = new Date();
  if (previousStatus === 'Resolved' && status !== 'Resolved') complaint.resolvedAt = null;

  complaint.activityLogs.push({
    action: `Status changed: ${previousStatus} → ${status}`,
    performedBy: req.user._id,
    timestamp: new Date(),
  });
  if (remark && remark.trim()) {
    complaint.comments.push({ authorId: req.user._id, text: remark.trim(), type: 'internal' });
  }

  await complaint.save();

  createAndEmit({
    userId: complaint.studentId._id,
    type: status === 'Resolved' ? 'resolved' : 'status_change',
    title: 'Complaint status updated',
    message: `"${complaint.title}" is now ${status}.`,
    complaintId: complaint._id,
  }).catch((err) => console.error('[notify] status notify failed:', err.message));

  sendStatusUpdateEmail({
    to: complaint.studentId.email,
    studentName: complaint.studentId.name,
    complaintTitle: complaint.title,
    status,
    complaintId: complaint._id,
  }).catch((err) => console.error('[email] status email failed:', err.message));

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { data: serializeComplaint(populated, req.user), message: `Status updated to ${status}.` });
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id/priority  (staff)
// ---------------------------------------------------------------------
export const updatePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  if (!PRIORITIES.includes(priority)) {
    throw new ApiError(400, 'Invalid priority value.', 'VALIDATION_ERROR');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');
  assertStaffCanAccessComplaint(req.user, complaint);

  complaint.priority = priority;
  complaint.activityLogs.push({
    action: `Priority set to ${priority}`,
    performedBy: req.user._id,
    timestamp: new Date(),
  });
  await complaint.save();

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { data: serializeComplaint(populated, req.user), message: 'Priority updated.' });
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id/assign  (staff)
// ---------------------------------------------------------------------
export const assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');

  if (req.user.role === 'superadmin') {
    const { assignedTo, departmentId } = req.body;
    if (assignedTo) {
      const staffUser = await User.findById(assignedTo);
      if (!staffUser || !['admin', 'superadmin'].includes(staffUser.role)) {
        throw new ApiError(400, 'assignedTo must be an existing admin.', 'VALIDATION_ERROR');
      }
      complaint.assignedTo = assignedTo;
    } else if (assignedTo === null) {
      complaint.assignedTo = null;
    }
    if (departmentId !== undefined) complaint.departmentId = departmentId || null;
  } else {
    // A department-admin may only claim an in-scope complaint for themself.
    assertStaffCanAccessComplaint(req.user, complaint);
    complaint.assignedTo = req.user._id;
    if (!complaint.departmentId) complaint.departmentId = req.user.departmentId;
  }

  complaint.activityLogs.push({ action: 'Assignment updated', performedBy: req.user._id, timestamp: new Date() });
  await complaint.save();

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { data: serializeComplaint(populated, req.user), message: 'Assignment updated.' });
});

// ---------------------------------------------------------------------
// POST /api/complaints/:id/comments
// ---------------------------------------------------------------------
export const addComment = asyncHandler(async (req, res) => {
  const { text, type, parentId } = req.body;
  if (!text || !text.trim()) {
    throw new ApiError(400, 'Comment cannot be empty.', 'VALIDATION_ERROR');
  }
  if (text.trim().length > LIMITS.COMMENT_MAX) {
    throw new ApiError(400, `Comment cannot exceed ${LIMITS.COMMENT_MAX} characters.`, 'VALIDATION_ERROR');
  }

  const complaint = await Complaint.findById(req.params.id).populate('studentId', 'name');
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');

  const isOwner = String(complaint.studentId._id) === String(req.user._id);
  const isStaff = req.user.role === 'admin' || req.user.role === 'superadmin';
  if (!isOwner && !isStaff) throw new ApiError(403, 'You cannot comment on this complaint.', 'FORBIDDEN');
  if (isStaff) assertStaffCanAccessComplaint(req.user, complaint);

  let parentComment = null;
  if (parentId) {
    parentComment = complaint.comments.id(parentId);
    if (!parentComment) throw new ApiError(404, 'The comment you are replying to no longer exists.', 'NOT_FOUND');
    if (parentComment.parentId) {
      throw new ApiError(400, 'You can only reply to a top-level comment, not to another reply.', 'VALIDATION_ERROR');
    }
  }

  const commentType = isStaff && type === 'internal' ? 'internal' : 'public';
  complaint.comments.push({ authorId: req.user._id, text: text.trim(), type: commentType, parentId: parentId || null });
  await complaint.save();

  // Only notify on PUBLIC comments — an internal admin note shouldn't ping the student.
  if (commentType === 'public') {
    const notifyUserId = isOwner ? complaint.assignedTo : complaint.studentId._id;
    const notifiedIds = new Set();
    if (notifyUserId) {
      notifiedIds.add(String(notifyUserId));
      createAndEmit({
        userId: notifyUserId,
        type: 'comment',
        title: 'New comment',
        message: `New comment on "${complaint.title}"`,
        complaintId: complaint._id,
      }).catch((err) => console.error('[notify] comment notify failed:', err.message));
    }
    // Replying to someone specific? Let them know too, unless they'd
    // already be notified above or they're replying to themselves.
    if (parentComment && !notifiedIds.has(String(parentComment.authorId)) && String(parentComment.authorId) !== String(req.user._id)) {
      createAndEmit({
        userId: parentComment.authorId,
        type: 'comment',
        title: 'New reply',
        message: `Someone replied to your comment on "${complaint.title}"`,
        complaintId: complaint._id,
      }).catch((err) => console.error('[notify] reply notify failed:', err.message));
    }
  }

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { statusCode: 201, data: serializeComplaint(populated, req.user), message: 'Comment added.' });
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id/comments/:commentId  (comment's own author only)
// ---------------------------------------------------------------------
export const editComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    throw new ApiError(400, 'Comment cannot be empty.', 'VALIDATION_ERROR');
  }
  if (text.trim().length > LIMITS.COMMENT_MAX) {
    throw new ApiError(400, `Comment cannot exceed ${LIMITS.COMMENT_MAX} characters.`, 'VALIDATION_ERROR');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');

  const comment = complaint.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, 'Comment not found.', 'NOT_FOUND');
  if (String(comment.authorId) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own comments.', 'FORBIDDEN');
  }

  comment.text = text.trim();
  comment.editedAt = new Date();
  await complaint.save();

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { data: serializeComplaint(populated, req.user), message: 'Comment updated.' });
});

// ---------------------------------------------------------------------
// DELETE /api/complaints/:id/comments/:commentId
//   comment's own author, OR staff (dept-scoped) clearing out nonsense.
//   Deleting a top-level comment also removes any direct replies to it,
//   since we only support one level of nesting — an orphaned reply to a
//   comment that no longer exists would be confusing to read.
// ---------------------------------------------------------------------
export const deleteComment = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');

  const comment = complaint.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, 'Comment not found.', 'NOT_FOUND');

  const isStaff = req.user.role === 'admin' || req.user.role === 'superadmin';
  const isCommentAuthor = String(comment.authorId) === String(req.user._id);
  if (!isCommentAuthor && !isStaff) {
    throw new ApiError(403, 'You can only delete your own comments.', 'FORBIDDEN');
  }
  if (isStaff) assertStaffCanAccessComplaint(req.user, complaint);

  const commentId = String(comment._id);
  complaint.comments = complaint.comments.filter(
    (cm) => String(cm._id) !== commentId && String(cm.parentId || '') !== commentId
  );
  await complaint.save();

  const populated = await Complaint.findById(complaint._id).populate(STAFF_POPULATE);
  sendSuccess(res, { data: serializeComplaint(populated, req.user), message: 'Comment deleted.' });
});

// ---------------------------------------------------------------------
// POST /api/complaints/:id/upvote  (student — toggle)
// ---------------------------------------------------------------------
export const toggleUpvote = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'NOT_FOUND');

  const uid = req.user.firebaseUid;
  const alreadyUpvoted = complaint.upvotes.includes(uid);

  if (alreadyUpvoted) {
    complaint.upvotes = complaint.upvotes.filter((id) => id !== uid);
  } else {
    complaint.upvotes.push(uid);
  }
  await complaint.save();

  sendSuccess(res, {
    data: { upvoteCount: complaint.upvotes.length, hasUpvoted: !alreadyUpvoted },
    message: alreadyUpvoted ? 'Upvote removed.' : 'Upvoted.',
  });
});
