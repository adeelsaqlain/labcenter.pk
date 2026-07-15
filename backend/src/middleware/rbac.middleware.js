/**
 * Higher-order function: returns middleware that checks if user's role is allowed
 * SUPER_ADMIN always bypasses the role check
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // SUPER_ADMIN bypasses all role restrictions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
}

module.exports = { authorize };
