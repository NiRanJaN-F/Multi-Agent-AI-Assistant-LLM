const express = require('express');
const router = express.Router();

// Static datasets matching the API contract
const departments = [
    {
        id: 1,
        name: "Computer Science & Engineering",
        hod: "Dr. Smith",
        description: "Focus on AI, Systems, and Software."
    },
    {
        id: 2,
        name: "Information Science & Engineering",
        hod: "Dr. Johnson",
        description: "Focus on Data Science, Web Technologies, and Networks."
    },
    {
        id: 3,
        name: "Electronics & Communication Engineering",
        hod: "Dr. Raman",
        description: "Focus on VLSI, Embedded Systems, and Signal Processing."
    }
];

const courses = [
    {
        id: 101,
        code: "CS101",
        name: "Data Structures and Algorithms",
        department: "Computer Science",
        credits: 4
    },
    {
        id: 102,
        code: "IS102",
        name: "Database Management Systems",
        department: "Information Science",
        credits: 3
    },
    {
        id: 103,
        code: "EC101",
        name: "Digital Logic Design",
        department: "Electronics",
        credits: 4
    }
];

const academics = {
    calendar: [
        { event: "Semester Start", date: "2023-08-01" },
        { event: "Mid-Term Examinations", date: "2023-10-10" },
        { event: "Last Working Day", date: "2023-11-30" },
        { event: "Semester End Examinations", date: "2023-12-05" }
    ],
    regulations: "2021 Scheme"
};

const placements = {
    stats: {
        highestPackage: "45 LPA",
        averagePackage: "8.5 LPA",
        placedPercentage: 95
    },
    topRecruiters: ["Google", "Microsoft", "Amazon", "Cisco", "Accenture"]
};

// GET /api/departments
router.get('/departments', (req, res) => {
    try {
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

// GET /api/courses
router.get('/courses', (req, res) => {
    try {
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

// GET /api/academics
router.get('/academics', (req, res) => {
    try {
        res.status(200).json(academics);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

// GET /api/placements
router.get('/placements', (req, res) => {
    try {
        res.status(200).json(placements);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

module.exports = router;