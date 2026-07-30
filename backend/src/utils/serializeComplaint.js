/**
 * Turns a populated Complaint document into the JSON shape sent to the
 * client, with the SAME privacy rules applied everywhere a complaint is
 * ever returned (single detail page, "my complaints" list, admin list,
 * community board). Having one function means there's no risk of, say,
 * the admin list route accidentally leaking an anonymous student's name
 * while the detail route correctly hides it.
 *
 * Privacy model (documented here on purpose, not hidden away):
 *  - Staff (admin/superadmin) ALWAYS see the real submitter, even on an
 *    anonymous complaint — they're the ones officially handling it and
 *    need accountability + the ability to follow up.
 *  - The complaint OWNER always sees their own complaint fully.
 *  - Any OTHER student (browsing the community board) sees the real
 *    name only if the complaint was NOT submitted anonymously.
 *  - Internal comments/activity "performed by" identities are staff-only.
 *  - Which admin/department is assigned is staff + owner only — not
 *    exposed to other students browsing the community board.
 */
export function serializeComplaint(complaintDoc, viewer) {
  const c = complaintDoc.toObject ? complaintDoc.toObject() : complaintDoc;

  const isStaff = viewer.role === 'admin' || viewer.role === 'superadmin';
  const studentIdStr = c.studentId?._id ? String(c.studentId._id) : String(c.studentId);
  const isOwner = viewer.role === 'student' && studentIdStr === String(viewer._id);
  const canSeeInternal = isStaff || isOwner;
  const revealIdentity = isStaff || isOwner || !c.isAnonymous;

  const student = revealIdentity
    ? {
        _id: studentIdStr,
        name: c.studentId?.name || 'Unknown student',
        email: isStaff ? c.studentId?.email : undefined,
      }
    : null;

  const comments = (c.comments || [])
    .filter((cm) => cm.type === 'public' || isStaff)
    .map((cm) => ({
      _id: cm._id,
      text: cm.text,
      type: cm.type,
      createdAt: cm.createdAt,
      author:
        isStaff || String(cm.authorId?._id || cm.authorId) === String(viewer._id)
          ? { name: cm.authorId?.name || 'User', role: cm.authorId?.role }
          : { name: 'Student' },
    }));

  const activityLogs = (c.activityLogs || []).map((log) => ({
    action: log.action,
    details: canSeeInternal ? log.details : undefined,
    timestamp: log.timestamp,
    performedBy: canSeeInternal ? log.performedBy?.name || undefined : undefined,
  }));

  return {
    _id: c._id,
    title: c.title,
    description: c.description,
    category: c.category,
    location: c.location,
    status: c.status,
    priority: canSeeInternal ? c.priority : c.priority, // priority is not sensitive; kept visible to everyone
    images: c.images || [],
    isAnonymous: c.isAnonymous,
    upvoteCount: (c.upvotes || []).length,
    hasUpvoted: (c.upvotes || []).includes(viewer.firebaseUid),
    student,
    department: canSeeInternal && c.departmentId ? { _id: c.departmentId._id || c.departmentId, name: c.departmentId.name } : null,
    assignedTo: canSeeInternal && c.assignedTo ? { _id: c.assignedTo._id || c.assignedTo, name: c.assignedTo.name } : null,
    comments,
    activityLogs,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    resolvedAt: c.resolvedAt,
    isOwner,
    canManage: isStaff,
  };
}

export function serializeComplaintList(docs, viewer) {
  return docs.map((d) => serializeComplaint(d, viewer));
}
