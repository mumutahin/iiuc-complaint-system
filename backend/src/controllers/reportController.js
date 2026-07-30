import { Complaint } from '../models/Complaint.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateComplaintReportPDF } from '../services/pdfService.js';
import { COMPLAINT_STATUSES } from '../../../shared/constants.js';

function scopeForStaff(user, departmentIdParam) {
  if (user.role === 'superadmin') {
    return departmentIdParam ? { departmentId: departmentIdParam } : {};
  }
  return { $or: [{ departmentId: user.departmentId }, { departmentId: null }] };
}

/** GET /api/reports/pdf — staff only, same filters as the complaints list. */
export const downloadPdfReport = asyncHandler(async (req, res) => {
  const { status, category, departmentId, dateFrom, dateTo } = req.query;
  const query = { ...scopeForStaff(req.user, departmentId) };
  if (status && COMPLAINT_STATUSES.includes(status)) query.status = status;
  if (category) query.category = category;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const complaints = await Complaint.find(query).populate('studentId', 'name').sort({ createdAt: -1 }).limit(2000).lean();

  const pdfBuffer = await generateComplaintReportPDF({
    complaints,
    filters: { status, category, departmentId, dateFrom, dateTo },
    generatedBy: req.user.name,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="iiuc-complaint-report-${Date.now()}.pdf"`);
  res.send(pdfBuffer);
});
