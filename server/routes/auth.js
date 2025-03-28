const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');
const { authenticateToken } = require('../middleware/auth');

// User registration
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role } = req.body;
        
        // Validate role
        if (!['admin', 'teacher', 'student'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        db.run(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, role],
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                res.status(201).json({ 
                    id: this.lastID,
                    username,
                    email,
                    role
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Compare passwords
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            res.json({ 
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email
                }
            });
        }
    );
});

// Password reset request
router.post('/request-password-reset', (req, res) => {
    // Implementation would go here
    res.json({ message: 'Password reset link sent to email' });
});

// Verify token and reset password
router.post('/reset-password', (req, res) => {
    // Implementation would go here
    res.json({ message: 'Password reset successful' });
});

module.exports = router;