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
 *  - Comment authors are ALWAYS shown truthfully to anyone who can see
 *    the comment at all (only the owner and staff can comment in the
 *    first place, so there's no case where hiding a commenter's name
 *    from the other party makes sense — that used to be a bug here).
 *  - Internal comments and full activity-log detail are staff-only.
 *  - Which admin/department is assigned is staff + owner only — not
 *    exposed to other students browsing the community board.
 *  - If a referenced account (the submitter, an assignee, a commenter,
 *    someone in the activity log) has since been deleted, we show
 *    "Deleted user" instead of crashing on a null populate result —
 *    deleting an account never deletes the complaints/history tied to it.
 */
export function serializeComplaint(complaintDoc, viewer) {
  const c = complaintDoc.toObject ? complaintDoc.toObject() : complaintDoc;

  const isStaff = viewer.role === 'admin' || viewer.role === 'superadmin';

  // c.studentId is the populated User doc, OR null if that account was
  // deleted (Mongoose populate resolves a dangling ref to null), OR in
  // rare unpopulated paths just a raw ObjectId.
  const studentDoc = c.studentId && c.studentId.name !== undefined ? c.studentId : null;
  const studentIdStr = studentDoc ? String(studentDoc._id) : c.studentId ? String(c.studentId) : null;
  const isOwner = viewer.role === 'student' && studentIdStr !== null && studentIdStr === String(viewer._id);
  const canSeeInternal = isStaff || isOwner;
  const revealIdentity = isStaff || isOwner || !c.isAnonymous;

  const student = !studentDoc
    ? { _id: studentIdStr, name: 'Deleted user', email: undefined }
    : revealIdentity
    ? { _id: studentIdStr, name: studentDoc.name || 'Unknown student', email: isStaff ? studentDoc.email : undefined }
    : null;

  const comments = (c.comments || [])
    .filter((cm) => cm.type === 'public' || isStaff)
    .map((cm) => {
      const authorDoc = cm.authorId && cm.authorId.name !== undefined ? cm.authorId : null;
      const authorIdStr = authorDoc ? String(authorDoc._id) : cm.authorId ? String(cm.authorId) : null;
      const isCommentAuthor = authorIdStr !== null && authorIdStr === String(viewer._id);
      return {
        _id: cm._id,
        text: cm.text,
        type: cm.type,
        parentId: cm.parentId || null,
        editedAt: cm.editedAt || null,
        createdAt: cm.createdAt,
        author: authorDoc
          ? { _id: authorIdStr, name: authorDoc.name || 'User', role: authorDoc.role }
          : { _id: authorIdStr, name: 'Deleted user', role: null },
        // Server decides who's allowed to edit/delete each comment so the
        // frontend never has to reimplement this logic (and can't get it
        // wrong): your own comment, or any comment if you're staff.
        canEdit: isCommentAuthor,
        canDelete: isCommentAuthor || isStaff,
      };
    });

  const activityLogs = (c.activityLogs || []).map((log) => {
    const performerDoc = log.performedBy && log.performedBy.name !== undefined ? log.performedBy : null;
    return {
      action: log.action,
      details: canSeeInternal ? log.details : undefined,
      timestamp: log.timestamp,
      performedBy: canSeeInternal ? (performerDoc ? performerDoc.name : log.performedBy ? 'Deleted user' : undefined) : undefined,
    };
  });

  return {
    _id: c._id,
    title: c.title,
    description: c.description,
    category: c.category,
    location: c.location,
    status: c.status,
    priority: c.priority,
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
    // Staff can delete ANY complaint (dept-scoped, enforced server-side);
    // a student can only delete their own while still Pending.
    canDelete: isStaff || (isOwner && c.status === 'Pending'),
    canEdit: isOwner && c.status === 'Pending',
  };
}

export function serializeComplaintList(docs, viewer) {
  return docs.map((d) => serializeComplaint(d, viewer));
}
