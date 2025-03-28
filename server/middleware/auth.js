const jwt = require('jsonwebtoken');
const db = require('../../db');

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        // Verify user still exists in database
        db.get(
            'SELECT id FROM users WHERE id = ?',
            [user.id],
            (err, row) => {
                if (err || !row) {
                    return res.status(403).json({ error: 'User no longer exists' });
                }
                req.user = user;
                next();
            }
        );
    });
};

// Middleware to check user role
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    checkRole
};