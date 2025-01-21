const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const { check, validationResult } = require('express-validator');

const app = express();
const port = 2000;

// Predefined Credentials
const ADMIN_LRN = 1001;
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE = 'admin';

const TEACHER_LRN = 2001;
const TEACHER_PASSWORD = 'teacher123';
const TEACHER_ROLE = 'teacher';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Schoolfeemanagement')
    .then(async () => {
        console.log('Connected to MongoDB');

        // Check if Admin exists
        const adminExists = await User.findOne({ lrn: ADMIN_LRN, role: ADMIN_ROLE });
        if (!adminExists) {
            const adminUser = new User({
                lrn: ADMIN_LRN,
                password: ADMIN_PASSWORD,
                role: ADMIN_ROLE,
                grade: 'Admin',
                section: 'Admin',
                fees: []
            });
            await adminUser.save();
            console.log('Admin user created');
        }

        // Check if Teacher exists
        const teacherExists = await User.findOne({ lrn: TEACHER_LRN, role: TEACHER_ROLE }); // Declare and initialize teacherExists
        if (!teacherExists) {
            const teacherUser = new User({
                lrn: TEACHER_LRN,
                password: TEACHER_PASSWORD,
                role: TEACHER_ROLE,
                grade: 'Teacher',
                section: 'Teacher',
                fees: []
            });
            await teacherUser.save();
            console.log('Teacher user created');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
    lrn: { type: Number, unique: true, required: true },
    name: { type: String, required: true }, // Add this line
    password: { type: String, required: true },
    role: { type: String, required: true },
    grade: String,
    section: String,
    fees: [{
        feeType: String,
        amount: Number,
        remainingBalance: { type: Number, required: true },
        date: String,
        isPaid: { type: Boolean, required: true },
        paidDate: { type: String, required: false },
        paidMonths: [String] // New field to track paid months
    }]
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.json());
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/Schoolfeemanagement' }),
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


// Utility Middleware for Role-Based Access
function ensureRole(role) {
    return (req, res, next) => {
        if (req.session.user && req.session.user.role === role) {
            next();
        } else {
            res.status(403).send('Access denied');
        }
    };
}



// Utility Middleware for Admin or Teacher Access
function ensureAdminOrTeacher(req, res, next) {
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'teacher')) {
        next();
    } else {
        res.status(403).send('Access denied');
    }
}

// Login Route
app.post('/login', [
    check('lrn').isNumeric().withMessage('LRN must be a number'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    check('role').isIn(['admin', 'student', 'teacher']).withMessage('Invalid role')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { lrn, password, role } = req.body;
    try {
        const user = await User.findOne({ lrn, role });
        if (user && user.password === password) {
            req.session.user = user;

            // Redirect to respective dashboard
            let redirectUrl = '';
            if (user.role === 'admin') redirectUrl = '/admin.html';
            else if (user.role === 'student') redirectUrl = '/student.html';
            else if (user.role === 'teacher') redirectUrl = '/index.html';

            return res.json({ message: 'Login successful', redirect: redirectUrl });
        } else {
            return res.status(401).send('Invalid LRN, password, or role');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
});

// Fetch Students (Admin Only)
app.get('/students', ensureAdminOrTeacher, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }, 'name lrn password grade section fees'); // Select desired fields
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


// Add Student (Admin or Teacher Only)
app.post('/add-student', ensureAdminOrTeacher, async (req, res) => {
    const { name, lrn, password, grade, section } = req.body; // Include name

    if (!lrn || !name || !password || !grade || !section) {
        return res.status(400).send('All fields are required.');
    }

    try {
        const existingStudent = await User.findOne({ lrn });
        if (existingStudent) {
            return res.status(400).send('A student with this LRN already exists.');
        }

        // Create the student with predefined fees
        const newStudent = new User({
            lrn,
            name,
            password, 
            grade,
            section,
            role: 'student',
            fees: [
                {
                    feeType: 'PTA Donation',
                    amount: 1440, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'PTA Registration',
                    amount: 100, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'SCHOOL PUBLICATION',
                    amount: 100, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'SSLG',
                    amount: 100, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'STEP',
                    amount: 90, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'BSP/GSP',
                    amount: 50, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'RED CROSS',
                    amount: 50, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'BSP/GSP TICKET',
                    amount: 10, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'ANTI-TB',
                    amount: 10, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
                {
                    feeType: 'SCHOOL ID (G7/G11 New Only)',
                    amount: 100, // You can modify the amount as needed
                    remainingBalance: 0,
                    isPaid: false
                },
            ]
        });

        await newStudent.save();
        res.send('Student added successfully with automatic fees!');
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).send('An error occurred while adding the student.');
    }
});

// Edit a Fee
app.put('/edit-fee/:studentId/:feeIndex', ensureAdminOrTeacher, async (req, res) => {
    const { studentId, feeIndex } = req.params;
    const { feeType, amount, isPaid, paidDate, remainingBalance, paidMonths = [] } = req.body;

    if (!feeType || !amount || isPaid === null || remainingBalance === undefined) {
        return res.status(400).json({ message: 'Missing required fee data' });
    }

    try {
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!student.fees[feeIndex]) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        // Update the fee
        student.fees[feeIndex] = {
            feeType,
            amount,
            remainingBalance,
            isPaid,
            paidDate,
            paidMonths // Include paidMonths
        };

        await student.save();
        res.json({ message: 'Fee updated successfully' });
    } catch (error) {
        console.error('Error updating fee:', error);
        res.status(500).json({ message: 'Server error while updating fee' });
    }
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Failed to log out:', err);
            return res.status(500).send('Error logging out');
        }
        // Redirect to index.html after successful logout
        res.redirect('/index.html');
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Fetch student fee details (Student Only)
app.get('/student-fees', ensureRole('student'), async (req, res) => {
    try {
        const student = await User.findOne({ lrn: req.session.user.lrn, role: 'student' });
        if (student) {
            const fees = student.fees.map(fee => ({
                feeType: fee.feeType,
                amount: fee.amount,
                remainingBalance: fee.remainingBalance,
                paidDate: fee.paidDate,
                isPaid: fee.isPaid,
                paidMonths: fee.paidMonths // Include paidMonths
            }));
            res.json({ fees });
        } else {
            res.status(404).send('Student not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Route to delete a student by LRN
app.delete('/remove-student/:lrn', ensureAdminOrTeacher, async (req, res) => {
    const { lrn } = req.params;

    try {
        const student = await User.findOne({ lrn }); // Assuming LRN is unique
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Remove the student
        await User.deleteOne({ lrn });

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error while deleting student' });
    }
});

// Add a New Fee
app.post('/add-fee/:id', ensureAdminOrTeacher, async (req, res) => {
    const { id } = req.params;
    const { feeType, amount, paidDate = null, isPaid = null, remainingBalance, paidMonths = [] } = req.body;

    if (!feeType || !amount || isPaid === null || remainingBalance === undefined) {
        return res.status(400).json({ message: 'Missing required fee data' });
    }

    try {
        const student = await User.findById(id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Add new fee to student's fees array
        student.fees.push({
            feeType,
            amount,
            remainingBalance,
            paidDate,
            isPaid,
            paidMonths // Include paidMonths
        });

        await student.save();
        res.json({ message: 'Fee added successfully with paid months' });
    } catch (error) {
        console.error('Error adding fee:', error);
        res.status(500).json({ message: 'Server error while adding fee' });
    }
});

app.delete('/remove-fee/:id/:feeIndex', ensureAdminOrTeacher, async (req, res) => {
    const { id, feeIndex } = req.params;

    try {
        // Find the student by their ID
        const student = await User.findById(id);

        if (!student || student.role !== 'student') {
            return res.status(404).send("Student not found");
        }

        if (feeIndex < 0 || feeIndex >= student.fees.length) {
            return res.status(400).send("Invalid fee index");
        }

        // Remove the fee at the specified index
        student.fees.splice(feeIndex, 1);
        await student.save();

        res.status(200).send("Fee removed successfully");
    } catch (error) {
        console.error('Error removing fee:', error);
        res.status(500).send('Server error');
    }
});
