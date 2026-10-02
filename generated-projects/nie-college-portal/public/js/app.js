/**
 * NIE College Portal - Core Application Script
 * Description: Core application logic, state management, and dynamic UI rendering.
 */

// --- Configuration & Mock Data ---
const MOCK_DATA = {
    departments: [
        { id: 1, name: "Computer Science & Engineering", hod: "Dr. C. Vidya", description: "Focusing on AI, ML, and Cloud Computing with state-of-the-art labs.", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800" },
        { id: 2, name: "Information Science & Engineering", hod: "Dr. K. R. Sumana", description: "Specializing in Data Science, Cybersecurity, and Software Engineering.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" },
        { id: 3, name: "Electronics & Communication", hod: "Dr. Narasimha Kaulgud", description: "Leading research in VLSI, Embedded Systems, and Signal Processing.", image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=800" },
        { id: 4, name: "Mechanical Engineering", hod: "Dr. B. Suresha", description: "Pioneering in Robotics, Thermal Power, and Advanced Manufacturing.", image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800" },
        { id: 5, name: "Civil Engineering", hod: "Dr. K. C. Manjunath", description: "Building sustainable infrastructure and smart city solutions.", image: "https://images.unsplash.com/photo-1503387762-592dee58c160?auto=format&fit=crop&q=80&w=800" },
        { id: 6, name: "Electrical & Electronics", hod: "Dr. H. V. Saikumar", description: "Innovating in Power Systems, Renewable Energy, and Smart Grids.", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800" }
    ],
    courses: [
        { id: 1, departmentId: 1, name: "B.E. Computer Science", duration: "4 Years", intake: 180, type: "Undergraduate" },
        { id: 2, departmentId: 1, name: "M.Tech Information Technology", duration: "2 Years", intake: 18, type: "Postgraduate" },
        { id: 3, departmentId: 2, name: "B.E. Information Science", duration: "4 Years", intake: 120, type: "Undergraduate" },
        { id: 4, departmentId: 3, name: "B.E. Electronics & Communication", duration: "4 Years", intake: 120, type: "Undergraduate" },
        { id: 5, departmentId: 4, name: "B.E. Mechanical Engineering", duration: "4 Years", intake: 120, type: "Undergraduate" },
        { id: 6, departmentId: 1, name: "Ph.D. in Computer Science", duration: "3-5 Years", intake: 5, type: "Research" }
    ],
    academics: [
        { semester: "Odd Semester 2023", startDate: "2023-08-01", endDate: "2023-12-15", status: "Completed" },
        { semester: "Even Semester 2024", startDate: "2024-01-15", endDate: "2024-05-30", status: "Ongoing" },
        { semester: "Summer Term 2024", startDate: "2024-06-10", endDate: "2024-07-20", status: "Upcoming" }
    ],
    placements: [
        { year: 2023, highestPackage: "54 LPA", averagePackage: "9.2 LPA", topRecruiters: ["Google", "Microsoft", "Amazon", "Cisco", "Mercedes-Benz"] },
        { year: 2022, highestPackage: "44 LPA", averagePackage: "8.5 LPA", topRecruiters: ["Twilio", "Intuit", "JP Morgan", "Adobe"] }
    ]
};

// --- State Management ---
const state = {
    view: 'home', // home, departments, courses, academics, placements
    data: {
        departments: [],
        courses: [],
        academics: [],
        placements: []
    },
    searchQuery: '',
    loading: false,
    cartCount: 0 // Representing "Saved Items" or "Shortlisted Courses"
};

// Expose state and mock data globally for debugging and cross-reference
window.AppState = state;
window.MOCK_DATA = MOCK_DATA;

// --- API Service ---
const API = {
    async fetchAll() {
        state.loading = true;
        renderApp();
        try {
            const [deps, courses, acads, place] = await Promise.all([
                fetch('/api/departments').then(res => res.json()).catch(() => MOCK_DATA.departments),
                fetch('/api/courses').then(res => res.json()).catch(() => MOCK_DATA.courses),
                fetch('/api/academics').then(res => res.json()).catch(() => MOCK_DATA.academics),
                fetch('/api/placements').then(res => res.json()).catch(() => MOCK_DATA.placements)
            ]);

            state.data.departments = deps;
            state.data.courses = courses;
            state.data.academics = acads;
            state.data.placements = place;
        } catch (error) {
            console.error("API Error:", error);
            state.data = { ...MOCK_DATA };
            showToast("Using offline data mode", "info");
        } finally {
            state.loading = false;
            renderApp();
        }
    }
};

// --- UI Components ---

const Navbar = () => `
    <nav class="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center space-x-3 cursor-pointer" onclick="switchView('home')">
                    <div class="bg-blue-900 text-white p-2 rounded-lg font-bold tracking-wider text-lg shadow">NIE</div>
                    <div>
                        <span class="font-bold text-slate-900 block leading-tight">NIE Mysore</span>
                        <span class="text-xs text-slate-500">Established 1946</span>
                    </div>
                </div>
                <div class="hidden md:flex items-center space-x-1">
                    <button onclick="switchView('home')" class="px-3 py-2 rounded-md text-sm font-medium ${state.view === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600'}">Home</button>
                    <button onclick="switchView('departments')" class="px-3 py-2 rounded-md text-sm font-medium ${state.view === 'departments' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600'}">Departments</button>
                    <button onclick="switchView('courses')" class="px-3 py-2 rounded-md text-sm font-medium ${state.view === 'courses' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600'}">Programs & Courses</button>
                    <button onclick="switchView('academics')" class="px-3 py-2 rounded-md text-sm font-medium ${state.view === 'academics' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600'}">Academic Calendar</button>
                    <button onclick="switchView('placements')" class="px-3 py-2 rounded-md text-sm font-medium ${state.view === 'placements' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600'}">Placements</button>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="showSavedModal()" class="relative p-2 text-slate-600 hover:text-blue-600 transition" title="Shortlisted Courses">
                        <i data-lucide="bookmark" class="w-6 h-6"></i>
                        ${state.cartCount > 0 ? `<span class="absolute top-0 right-0 bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">${state.cartCount}</span>` : ''}
                    </button>
                </div>
            </div>
        </div>
    </nav>
`;

const Footer = () => `
    <footer class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <h3 class="text-white text-lg font-bold mb-4">The National Institute of Engineering</h3>
                <p class="text-sm">Mysuru - 570008, Karnataka, India.</p>
                <p class="text-sm mt-2">A Grant-in-Aid Institution under Govt. of Karnataka.</p>
            </div>
            <div>
                <h4 class="text-white font-semibold mb-3">Quick Links</h4>
                <ul class="space-y-2 text-sm">
                    <li><a href="#" onclick="switchView('departments')" class="hover:text-white">Departments</a></li>
                    <li><a href="#" onclick="switchView('courses')" class="hover:text-white">Programs & Courses</a></li>
                    <li><a href="#" onclick="switchView('academics')" class="hover:text-white">Academic Calendar</a></li>
                    <li><a href="#" onclick="switchView('placements')" class="hover:text-white">Placements</a></li>
                </ul>
            </div>
            <div>
                <h4 class="text-white font-semibold mb-3">Academics</h4>
                <ul class="space-y-2 text-sm">
                    <li><a href="#" class="hover:text-white">B.E. Admissions</a></li>
                    <li><a href="#" class="hover:text-white">M.Tech Programs</a></li>
                    <li><a href="#" class="hover:text-white">Research & Ph.D</a></li>
                    <li><a href="#" class="hover:text-white">Exam Cell</a></li>
                </ul>
            </div>
            <div>
                <h4 class="text-white font-semibold mb-3">Connect With Us</h4>
                <p class="text-sm mb-3">Subscribe to our newsletter for updates, notifications, and campus events.</p>
                <div class="flex">
                    <input type="email" placeholder="Enter your email" class="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm rounded-l-md focus:outline-none focus:border-blue-500 w-full">
                    <button onclick="showToast('Subscribed successfully!', 'success')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-r-md transition">Join</button>
                </div>
            </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; ${new Date().getFullYear()} The National Institute of Engineering, Mysuru. All rights reserved.
        </div>
    </footer>
`;

const HomeView = () => `
    <div>
        <!-- Hero Section -->
        <div class="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white py-28 px-4 overflow-hidden">
            <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div class="max-w-7xl mx-auto relative z-10 text-center">
                <span class="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">Excellence in Engineering Education Since 1946</span>
                <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mt-6 mb-6">Welcome to NIE Mysuru</h1>
                <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8">Empowering future leaders through rigorous academics, cutting-edge research, and world-class placement opportunities.</p>
                <div class="flex justify-center gap-4">
                    <button onclick="switchView('courses')" class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition flex items-center gap-2">
                        <i data-lucide="book-open" class="w-5 h-5"></i> Explore Courses
                    </button>
                    <button onclick="switchView('departments')" class="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-6 py-3 rounded-lg backdrop-blur transition">
                        View Departments
                    </button>
                </div>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="bg-white border-b border-slate-200 py-10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div class="p-4 border-r last:border-0 border-slate-100">
                    <div class="text-3xl font-extrabold text-blue-900">75+</div>
                    <div class="text-sm text-slate-500 mt-1">Years of Legacy</div>
                </div>
                <div class="p-4 border-r last:border-0 border-slate-100">
                    <div class="text-3xl font-extrabold text-blue-900">6+</div>
                    <div class="text-sm text-slate-500 mt-1">Engineering Depts</div>
                </div>
                <div class="p-4 border-r last:border-0 border-slate-100">
                    <div class="text-3xl font-extrabold text-blue-900">54 LPA</div>
                    <div class="text-sm text-slate-500 mt-1">Highest Package</div>
                </div>
                <div class="p-4">
                    <div class="text-3xl font-extrabold text-blue-900">100%</div>
                    <div class="text-sm text-slate-500 mt-1">Placement Support</div>
                </div>
            </div>
        </div>

        <!-- Highlights & Overview -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="text-center max-w-3xl mx-auto mb-12">
                <h2 class="text-3xl font-bold text-slate-900">Academic Excellence & Innovation</h2>
                <p class="text-slate-600 mt-2">Discover our world-class departments, specialized programs, and dynamic academic schedule designed for holistic student development.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer" onclick="switchView('departments')">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <i data-lucide="layers" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">Departments</h3>
                    <p class="text-slate-600 text-sm">Explore our specialized engineering departments led by distinguished faculty and equipped with advanced labs.</p>
                    <span class="text-blue-600 text-sm font-semibold mt-4 inline-flex items-center gap-1">Learn more &rarr;</span>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer" onclick="switchView('courses')">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <i data-lucide="graduation-cap" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">Programs & Courses</h3>
                    <p class="text-slate-600 text-sm">Undergraduate, Postgraduate, and Ph.D programs tailored to current industry standards and research trends.</p>
                    <span class="text-blue-600 text-sm font-semibold mt-4 inline-flex items-center gap-1">View courses &rarr;</span>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer" onclick="switchView('academics')">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <i data-lucide="calendar" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">Academic Calendar</h3>
                    <p class="text-slate-600 text-sm">Stay up to date with semester timelines, exam dates, vacation schedules, and key college events.</p>
                    <span class="text-blue-600 text-sm font-semibold mt-4 inline-flex items-center gap-1">Check schedule &rarr;</span>
                </div>
            </div>
        </div>
    </div>
`;

const DepartmentsView = () => `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="mb-8">
            <h1 class="text-3xl font-extrabold text-slate-900">Academic Departments</h1>
            <p class="text-slate-600 mt-1">Explore our engineering departments driving innovation and research.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${state.data.departments.map(dept => `
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                    <img src="${dept.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800'}" alt="${dept.name}" class="w-full h-48 object-cover">
                    <div class="p-6 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold text-slate-900 mb-2">${dept.name}</h3>
                        <p class="text-xs font-semibold text-blue-600 uppercase mb-3">HOD: ${dept.hod}</p>
                        <p class="text-slate-600 text-sm mb-6 flex-grow">${dept.description}</p>
                        <button onclick="filterCoursesByDept(${dept.id})" class="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2 rounded-lg text-sm transition">
                            View Department Courses
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`;

const CoursesView = () => `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-extrabold text-slate-900">Programs & Courses</h1>
                <p class="text-slate-600 mt-1">Browse all undergraduate, postgraduate, and research degrees.</p>
            </div>
            <div class="w-full md:w-72">
                <input type="text" id="courseSearch" placeholder="Search courses..." value="${state.searchQuery}" oninput="handleSearch(event)" class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${filterCourses().map(course => `
                <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-semibold">${course.type}</span>
                            <button onclick="shortlistCourse(${course.id})" class="text-slate-400 hover:text-blue-600 transition" title="Shortlist Course">
                                <i data-lucide="bookmark" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-2">${course.name}</h3>
                        <p class="text-sm text-slate-600 mb-4">Duration: <span class="font-semibold text-slate-900">${course.duration}</span></p>
                    </div>
                    <div class="flex justify-between items-center pt-4 border-t border-slate-100 text-sm">
                        <span class="text-slate-500">Intake: <strong class="text-slate-800">${course.intake} seats</strong></span>
                        <button onclick="showToast('Course details downloaded!', 'success')" class="text-blue-600 hover:text-blue-800 font-semibold">Syllabus &rarr;</button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`;

const AcademicsView = () => `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="mb-8">
            <h1 class="text-3xl font-extrabold text-slate-900">Academic Calendar</h1>
            <p class="text-slate-600 mt-1">Important dates, semester schedules, and term breakdowns.</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm font-semibold">
                            <th class="p-4">Semester / Term</th>
                            <th class="p-4">Start Date</th>
                            <th class="p-4">End Date</th>
                            <th class="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                        ${state.data.academics.map(item => `
                            <tr class="hover:bg-slate-50 transition">
                                <td class="p-4 font-bold text-slate-900">${item.semester}</td>
                                <td class="p-4">${item.startDate}</td>
                                <td class="p-4">${item.endDate}</td>
                                <td class="p-4">
                                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'Ongoing' ? 'bg-green-100 text-green-700' : item.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}">
                                        ${item.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
`;

const PlacementsView = () => `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="mb-8">
            <h1 class="text-3xl font-extrabold text-slate-900">Placement Statistics</h1>
            <p class="text-slate-600 mt-1">Record-breaking packages and top tier recruiters visiting NIE.</p>
        </div>
        <div class="space-y-6">
            ${state.data.placements.map(p => `
                <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 class="text-2xl font-bold text-slate-900">Batch of ${p.year}</h2>
                        <div class="flex gap-4">
                            <div class="bg-blue-50 px-4 py-2 rounded-lg">
                                <span class="text-xs text-slate-500 block">Highest Package</span>
                                <span class="text-lg font-extrabold text-blue-900">${p.highestPackage}</span>
                            </div>
                            <div class="bg-slate-50 px-4 py-2 rounded-lg">
                                <span class="text-xs text-slate-500 block">Average Package</span>
                                <span class="text-lg font-extrabold text-slate-800">${p.averagePackage}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm font-semibold text-slate-700 mb-3">Top Recruiters</h4>
                        <div class="flex flex-wrap gap-2">
                            ${p.topRecruiters.map(recruiter => `
                                <span class="bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-sm font-medium">${recruiter}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`;

const SavedModal = () => `
    <div id="savedModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-slate-900">Shortlisted Programs (${state.cartCount})</h3>
                <button onclick="closeSavedModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <p class="text-sm text-slate-600 mb-4">You have shortlisted ${state.cartCount} course(s). Contact admissions for further inquiries.</p>
            <div class="flex justify-end">
                <button onclick="closeSavedModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Close</button>
            </div>
        </div>
    </div>
`;

// --- Actions & Helpers ---

function switchView(viewName) {
    state.view = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderApp();
}

function filterCourses() {
    if (!state.searchQuery) return state.data.courses;
    const query = state.searchQuery.toLowerCase();
    return state.data.courses.filter(c => c.name.toLowerCase().includes(query) || c.type.toLowerCase().includes(query));
}

function handleSearch(e) {
    state.searchQuery = e.target.value;
    const container = document.getElementById('mainContent');
    if (container) {
        container.innerHTML = CoursesView();
        lucide.createIcons();
        const input = document.getElementById('courseSearch');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }
}

function filterCoursesByDept(deptId) {
    state.view = 'courses';
    const dept = state.data.departments.find(d => d.id === deptId);
    if (dept) {
        state.searchQuery = dept.name.split(' ')[0]; // Filter by department keyword
    }
    renderApp();
}

function shortlistCourse(courseId) {
    state.cartCount++;
    showToast("Course shortlisted successfully!", "success");
    renderApp();
}

function showSavedModal() {
    const div = document.createElement('div');
    div.id = 'modalContainer';
    div.innerHTML = SavedModal();
    document.body.appendChild(div);
    lucide.createIcons();
}

function closeSavedModal() {
    const modal = document.getElementById('modalContainer');
    if (modal) modal.remove();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition transform translate-y-0 ${type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Main Render Engine ---

function renderApp() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    let viewHtml = '';
    if (state.loading) {
        viewHtml = `<div class="flex justify-center items-center h-screen"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div></div>`;
    } else {
        switch (state.view) {
            case 'home':
                viewHtml = HomeView();
                break;
            case 'departments':
                viewHtml = DepartmentsView();
                break;
            case 'courses':
                viewHtml = CoursesView();
                break;
            case 'academics':
                viewHtml = AcademicsView();
                break;
            case 'placements':
                viewHtml = PlacementsView();
                break;
            default:
                viewHtml = HomeView();
        }
    }

    appEl.innerHTML = `
        ${Navbar()}
        <main id="mainContent" class="min-h-screen">
            ${viewHtml}
        </main>
        ${Footer()}
    `;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    API.fetchAll();
});