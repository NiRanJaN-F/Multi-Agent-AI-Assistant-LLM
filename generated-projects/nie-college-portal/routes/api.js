const express = require('express');
const router = express.Router();

const departments = [
  {
    id: 1,
    name: "Computer Science & Engineering",
    hod: "Dr. Smith",
    description: "Focuses on computation, algorithms, software engineering, and artificial intelligence."
  },
  {
    id: 2,
    name: "Information Science & Engineering",
    hod: "Dr. Alice Johnson",
    description: "Emphasizes information processing, data analytics, and modern web technologies."
  },
  {
    id: 3,
    name: "Electronics & Communication Engineering",
    hod: "Dr. Robert Brown",
    description: "Deals with electronic devices, circuits, communication systems, and embedded tech."
  }
];

const programs = [
  {
    id: 1,
    name: "Undergraduate (B.E. / B.Tech)",
    description: "4-year professional engineering degree programs focusing on fundamental and advanced technical skills."
  },
  {
    id: 2,
    name: "Postgraduate (M.Tech)",
    description: "2-year specialized engineering programs designed for advanced research, design, and industry expertise."
  },
  {
    id: 3,
    name: "Doctoral (Ph.D.)",
    description: "Research-intensive programs fostering innovation and cutting-edge discoveries across engineering disciplines."
  }
];

const courses = [
  {
    id: 1,
    departmentId: 1,
    name: "B.E. Computer Science",
    duration: "4 Years",
    programId: 1
  },
  {
    id: 2,
    departmentId: 1,
    name: "M.Tech Computer Science",
    duration: "2 Years",
    programId: 2
  },
  {
    id: 3,
    departmentId: 2,
    name: "B.E. Information Science",
    duration: "4 Years",
    programId: 1
  },
  {
    id: 4,
    departmentId: 3,
    name: "B.E. Electronics & Communication",
    duration: "4 Years",
    programId: 1
  }
];

const academics = [
  {
    semester: "Odd Semester 2023-24",
    startDate: "2023-08-16",
    endDate: "2023-12-20"
  },
  {
    semester: "Even Semester 2023-24",
    startDate: "2024-01-15",
    endDate: "2024-05-30"
  }
];

const academicCalendar = [
  {
    event: "Commencement of Classes (Odd Sem)",
    date: "2023-08-16",
    category: "Academic"
  },
  {
    event: "First Internal Assessment Tests",
    date: "2023-10-10",
    category: "Examination"
  },
  {
    event: "Second Internal Assessment Tests",
    date: "2023-11-25",
    category: "Examination"
  },
  {
    event: "End Semester Examinations",
    date: "2023-12-05",
    category: "Examination"
  },
  {
    event: "Commencement of Classes (Even Sem)",
    date: "2024-01-15",
    category: "Academic"
  },
  {
    event: "Annual Techno-Cultural Fest",
    date: "2024-03-20",
    category: "Cultural"
  },
  {
    event: "Even Semester End Examinations",
    date: "2024-05-15",
    category: "Examination"
  }
];

const placements = [
  {
    year: 2023,
    highestPackage: "45 LPA",
    averagePackage: "8.5 LPA",
    topRecruiters: ["Google", "Microsoft", "Amazon", "Cisco"]
  },
  {
    year: 2022,
    highestPackage: "38 LPA",
    averagePackage: "7.8 LPA",
    topRecruiters: ["Adobe", "VMware", "Goldman Sachs"]
  }
];

router.get('/departments', (req, res) => {
  try {
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/programs', (req, res) => {
  try {
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/courses', (req, res) => {
  try {
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/academics', (req, res) => {
  try {
    res.status(200).json(academics);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/calendar', (req, res) => {
  try {
    res.status(200).json(academicCalendar);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/placements', (req, res) => {
  try {
    res.status(200).json(placements);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;