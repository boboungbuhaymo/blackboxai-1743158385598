const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticateToken, checkRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure file storage for assignment attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads/assignments'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Create a new assignment (Teacher only)
router.post('/', 
    authenticateToken, 
    checkRole(['teacher']), 
    upload.single('attachment'), 
    (req, res) => {
        const { title, description, subject, due_date } = req.body;
        const attachment = req.file ? `/uploads/assignments/${req.file.filename}` : null;

        db.run(
            `INSERT INTO assignments 
            (title, description, subject, due_date, created_by, attachment) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, subject, due_date, req.user.id, attachment],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create assignment' });
                }
                res.status(201).json({ 
                    id: this.lastID,
                    title,
                    subject,
                    due_date,
                    attachment
                });
            }
        );
    }
);

// Get all assignments
router.get('/', authenticateToken, (req, res) => {
    let query = 'SELECT * FROM assignments';
    const params = [];

    // Teachers see their own assignments, students see all
    if (req.user.role === 'teacher') {
        query += ' WHERE created_by = ?';
        params.push(req.user.id);
    }

    db.all(query, params, (err, assignments) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve assignments' });
        }
        res.json(assignments);
    });
});

// Get a specific assignment
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT * FROM assignments WHERE id = ?',
        [id],
        (err, assignment) => {
            if (err || !assignment) {
                return res.status(404).json({ error: 'Assignment not found' });
            }
            res.json(assignment);
        }
    );
});

// Update an assignment (Teacher only)
router.put('/:id', 
    authenticateToken, 
    checkRole(['teacher']), 
    upload.single('attachment'),
    (req, res) => {
        const { id } = req.params;
        const { title, description, subject, due_date } = req.body;
        const attachment = req.file ? `/uploads/assignments/${req.file.filename}` : null;

        db.run(
            `UPDATE assignments SET 
            title = ?, description = ?, subject = ?, due_date = ?, attachment = ?
            WHERE id = ? AND created_by = ?`,
            [title, description, subject, due_date, attachment, id, req.user.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update assignment' });
                }
                res.json({ message: 'Assignment updated successfully' });
            }
        );
    }
);

// Delete an assignment (Teacher only)
router.delete('/:id', authenticateToken, checkRole(['teacher']), (req, res) => {
    const { id } = req.params;

    db.run(
        'DELETE FROM assignments WHERE id = ? AND created_by = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete assignment' });
            }
            res.json({ message: 'Assignment deleted successfully' });
        }
    );
});

module.exports = router;