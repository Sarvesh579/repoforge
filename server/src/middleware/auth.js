const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Middleware: verify JWT from Authorization header.
 * On success, attaches req.user = { id, role, teamId? }.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware: ensure the authenticated user has at least one of the allowed roles.
 * Must be called after requireAuth.
 * @param {...string} roles - e.g. requireRole('admin', 'judge')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }
    next();
  };
}

/**
 * Sign a JWT for a team credential login.
 */
function signTeamToken(team) {
  return jwt.sign(
    { id: team.id, role: 'team', teamId: team.id, email: team.lead_email },
    JWT_SECRET,
    { expiresIn: '14d' }
  );
}

/**
 * Sign a JWT for a judge / admin login.
 */
function signJudgeToken(judgeUser) {
  return jwt.sign(
    { id: judgeUser.id, role: judgeUser.role, email: judgeUser.email },
    JWT_SECRET,
    { expiresIn: '14d' }
  );
}

module.exports = { requireAuth, requireRole, signTeamToken, signJudgeToken };
