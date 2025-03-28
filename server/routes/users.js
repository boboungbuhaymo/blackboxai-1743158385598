const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', authenticateToken, checkRole(['admin']), (req, res) => {
    db.all('SELECT id, username, email, role FROM users', [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve users' });
        }
        res.json(users);
    });
});

// Create a new user (Admin only)
router.post('/', authenticateToken, checkRole(['admin']), (req, res) => {
    const { username, password, email, role } = req.body;

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to hash password' });
        }

        db.run(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, role],
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                res.status(201).json({ id: this.lastID, username, email, role });
            }
        );
    });
});

// Update user details (Admin only)
router.put('/:id', authenticateToken, checkRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { username, email, role } = req.body;

    db.run(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, id],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Failed to update user' });
            }
            res.json({ message: 'User updated successfully' });
        }
    );
});

// Delete a user (Admin only)
router.delete('/:id', authenticateToken, checkRole(['admin']), (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM users WHERE id = ?', id, function(err) {
        if (err) {
            return res.status(400).json({ error: 'Failed to delete user' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

module.exports = router;