const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure file storage for submissions
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads/submissions'));
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

// Submit an assignment (Student only)
router.post('/', 
    authenticateToken, 
    upload.single('file'), 
    (req, res) => {
        const { assignment_id } = req.body;
        const file_path = req.file ? `/uploads/submissions/${req.file.filename}` : null;

        db.run(
            `INSERT INTO submissions (assignment_id, student_id, file_path) 
            VALUES (?, ?, ?)`,
            [assignment_id, req.user.id, file_path],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to submit assignment' });
                }
                res.status(201).json({ 
                    id: this.lastID,
                    assignment_id,
                    student_id: req.user.id,
                    file_path
                });
            }
        );
    }
);

// Get all submissions for a specific assignment
router.get('/:assignment_id', authenticateToken, (req, res) => {
    const { assignment_id } = req.params;

    db.all(
        'SELECT * FROM submissions WHERE assignment_id = ?',
        [assignment_id],
        (err, submissions) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to retrieve submissions' });
            }
            res.json(submissions);
        }
    );
});

// Get a specific submission
router.get('/submission/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT * FROM submissions WHERE id = ?',
        [id],
        (err, submission) => {
            if (err || !submission) {
                return res.status(404).json({ error: 'Submission not found' });
            }
            res.json(submission);
        }
    );
});

// Update a submission (Student only)
router.put('/:id', 
    authenticateToken, 
    upload.single('file'), 
    (req, res) => {
        const { id } = req.params;
        const file_path = req.file ? `/uploads/submissions/${req.file.filename}` : null;

        db.run(
            `UPDATE submissions SET file_path = ? WHERE id = ? AND student_id = ?`,
            [file_path, id, req.user.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update submission' });
                }
                res.json({ message: 'Submission updated successfully' });
            }
        );
    }
);

// Delete a submission (Student only)
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run(
        'DELETE FROM submissions WHERE id = ? AND student_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete submission' });
            }
            res.json({ message: 'Submission deleted successfully' });
        }
    );
});

module.exports = router;