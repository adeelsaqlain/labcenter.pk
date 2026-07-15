/**
 * Extracts branch_id from the authenticated JWT user and attaches it to req.
 * SUPER_ADMIN can optionally pass X-Branch-Id header to target a specific branch.
 * BRANCH_ADMIN and STAFF are locked to their JWT branch_id.
 */
function tenantScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.role === 'SUPER_ADMIN') {
    // SUPER_ADMIN can specify branch via header, or see all (branch_id = null)
    req.branchId = req.headers['x-branch-id'] 
      ? parseInt(req.headers['x-branch-id'], 10) 
      : null;
  } else {
    // BRANCH_ADMIN and STAFF are LOCKED to their assigned branch
    req.branchId = req.user.branch_id;
    
    if (!req.branchId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not assigned to any branch' 
      });
    }
  }

  next();
}

module.exports = { tenantScope };
