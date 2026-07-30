import { Complaint } from '../models/Complaint.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { COMPLAINT_STATUSES, COMPLAINT_CATEGORIES, PRIORITIES } from '../../../shared/constants.js';

function scopeForStaff(user, departmentIdParam) {
  if (user.role === 'superadmin') {
    return departmentIdParam ? { departmentId: departmentIdParam } : {};
  }
  return { $or: [{ departmentId: user.departmentId }, { departmentId: null }] };
}

/** GET /api/analytics/overview — staff only, dept-scoped for admin. */
export const getOverview = asyncHandler(async (req, res) => {
  const match = scopeForStaff(req.user, req.query.departmentId);

  const [statusAgg, categoryAgg, priorityAgg, resolutionAgg, trendAgg, total] = await Promise.all([
    Complaint.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { ...match, resolvedAt: { $ne: null } } },
      {
        $project: {
          hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
        },
      },
      { $group: { _id: null, avgHours: { $avg: '$hours' } } },
    ]),
    Complaint.aggregate([
      { $match: { ...match, createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Complaint.countDocuments(match),
  ]);

  const toCountMap = (agg) => Object.fromEntries(agg.map((row) => [row._id, row.count]));
  const statusMap = toCountMap(statusAgg);
  const categoryMap = toCountMap(categoryAgg);
  const priorityMap = toCountMap(priorityAgg);
  const trendMap = Object.fromEntries(trendAgg.map((row) => [row._id, row.count]));

  // Fill in every last-14-days date with 0 so the chart has no gaps.
  const trend = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: trendMap[key] || 0 });
  }

  sendSuccess(res, {
    data: {
      total,
      byStatus: COMPLAINT_STATUSES.map((status) => ({ status, count: statusMap[status] || 0 })),
      byCategory: COMPLAINT_CATEGORIES.map((category) => ({ category, count: categoryMap[category] || 0 })).filter(
        (row) => row.count > 0 || COMPLAINT_CATEGORIES.length <= 12
      ),
      byPriority: PRIORITIES.map((priority) => ({ priority, count: priorityMap[priority] || 0 })),
      avgResolutionHours: resolutionAgg[0]?.avgHours ? Math.round(resolutionAgg[0].avgHours * 10) / 10 : null,
      trend,
    },
  });
});
