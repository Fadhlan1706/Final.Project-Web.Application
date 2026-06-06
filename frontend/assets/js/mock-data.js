// mock-data.js — Data dummy sebelum ada backend PHP

const MOCK_USERS = [
  {
    id: 1,
    name: "Teo Hardianto",
    initials: "TH",
    major: "Teknik Informatika",
    university: "Universitas Sam Ratulangi",
    bio: "Backend developer dengan spesialisasi PHP & MySQL. Suka membangun REST API yang bersih dan optimal. Sedang belajar Docker dan sistem microservices.",
    score: 4.8,
    reviewCount: 23,
    collaborationsCount: 15,
    skills: [
      { name: "PHP", level: "Mahir", category: "Backend" },
      { name: "MySQL", level: "Mahir", category: "Database" },
      { name: "Laravel", level: "Menengah", category: "Framework" },
      { name: "REST API", level: "Mahir", category: "Backend" },
    ],
    wantToLearn: ["UI/UX Design", "Vue.js", "Docker"],
    reviews: [
      { from: "Nasya Putri", fromInitials: "NP", score: 5, text: "Teo sangat profesional dan komunikatif. Kolaborasi berjalan sangat lancar!", date: "2 minggu lalu" },
      { from: "Laura Sitanggang", fromInitials: "LS", score: 5, text: "Backend yang dia buat sangat rapi dan terstruktur. Sangat rekomendasikan!", date: "1 bulan lalu" },
      { from: "Bram Susanto", fromInitials: "BS", score: 4, text: "Responsif dan kodenya bersih. Sedikit kurang pada dokumentasi.", date: "2 bulan lalu" },
    ],
    avatarColor: "#5c7cfa",
  },
  {
    id: 2,
    name: "Nasya Putri Larasati",
    initials: "NP",
    major: "Desain Komunikasi Visual",
    university: "Universitas Sam Ratulangi",
    bio: "UI/UX Designer yang passionate tentang human-centered design. Familiar dengan Figma, Adobe XD, dan dasar-dasar frontend. Ingin menjelajah dunia React.",
    score: 4.9,
    reviewCount: 31,
    collaborationsCount: 18,
    skills: [
      { name: "Figma", level: "Mahir", category: "Design" },
      { name: "UI/UX Design", level: "Mahir", category: "Design" },
      { name: "Adobe XD", level: "Menengah", category: "Design" },
      { name: "HTML/CSS", level: "Pemula", category: "Frontend" },
    ],
    wantToLearn: ["React", "JavaScript", "Backend"],
    reviews: [
      { from: "Teo Hardianto", fromInitials: "TH", score: 5, text: "Desain-desainnya luar biasa! Detail dan user-friendly banget. Sangat membantu proyek kami.", date: "3 minggu lalu" },
      { from: "Arief Pratama", fromInitials: "AP", score: 5, text: "Kreatif dan fast response. Wireframe yang dibuat sangat memudahkan development.", date: "1 bulan lalu" },
    ],
    avatarColor: "#be4bdb",
  },
  {
    id: 3,
    name: "Arief Dwi Pratama",
    initials: "AP",
    major: "Teknik Informatika",
    university: "Universitas Sam Ratulangi",
    bio: "Full-stack developer yang suka tantangan. React di depan, Node.js di belakang. Sedang mengembangkan skill mobile dev dengan Flutter.",
    score: 4.6,
    reviewCount: 17,
    collaborationsCount: 11,
    skills: [
      { name: "React.js", level: "Mahir", category: "Frontend" },
      { name: "Node.js", level: "Menengah", category: "Backend" },
      { name: "JavaScript", level: "Mahir", category: "Frontend" },
      { name: "MongoDB", level: "Pemula", category: "Database" },
    ],
    wantToLearn: ["Flutter", "UI/UX Design", "Docker"],
    reviews: [
      { from: "Nasya Putri", fromInitials: "NP", score: 5, text: "Implementasi React-nya sangat solid. Komunikasi juga bagus.", date: "1 minggu lalu" },
    ],
    avatarColor: "#40c057",
  },
  {
    id: 4,
    name: "Laura Christin Sitanggang",
    initials: "LS",
    major: "Sistem Informasi",
    university: "Universitas Sam Ratulangi",
    bio: "Data enthusiast yang suka menganalisis dan memvisualisasikan data. Python dan SQL adalah teman sehari-hari. Tertarik belajar machine learning lebih dalam.",
    score: 4.7,
    reviewCount: 14,
    collaborationsCount: 9,
    skills: [
      { name: "Python", level: "Mahir", category: "Data Science" },
      { name: "SQL", level: "Mahir", category: "Database" },
      { name: "Data Analysis", level: "Menengah", category: "Data Science" },
      { name: "Tableau", level: "Menengah", category: "Data Viz" },
    ],
    wantToLearn: ["Machine Learning", "React", "UI/UX Design"],
    reviews: [
      { from: "Bram Susanto", fromInitials: "BS", score: 5, text: "Analisis datanya sangat komprehensif. Visualisasi yang dibuat sangat informatif!", date: "2 minggu lalu" },
    ],
    avatarColor: "#fab005",
  },
  {
    id: 5,
    name: "Bram Eka Susanto",
    initials: "BS",
    major: "Teknik Informatika",
    university: "Universitas Sam Ratulangi",
    bio: "Mobile developer Android dengan Kotlin dan Swift untuk iOS. Juga tertarik dengan Flutter untuk cross-platform. Selalu berusaha memberikan UX terbaik.",
    score: 4.5,
    reviewCount: 10,
    collaborationsCount: 7,
    skills: [
      { name: "Kotlin", level: "Mahir", category: "Mobile" },
      { name: "Android Dev", level: "Mahir", category: "Mobile" },
      { name: "Flutter", level: "Menengah", category: "Mobile" },
      { name: "Firebase", level: "Menengah", category: "Backend" },
    ],
    wantToLearn: ["Backend PHP", "UI/UX Design", "React Native"],
    reviews: [],
    avatarColor: "#fa5252",
  },
  {
    id: 6,
    name: "Sinta Dewi Maharani",
    initials: "SD",
    major: "Desain Komunikasi Visual",
    university: "Universitas Sam Ratulangi",
    bio: "Graphic designer spesialis branding dan visual identity. Suka membuat desain yang berani dan berkarakter. Mulai belajar motion graphics di After Effects.",
    score: 4.4,
    reviewCount: 8,
    collaborationsCount: 5,
    skills: [
      { name: "Illustrator", level: "Mahir", category: "Design" },
      { name: "Photoshop", level: "Mahir", category: "Design" },
      { name: "Branding", level: "Mahir", category: "Design" },
      { name: "After Effects", level: "Pemula", category: "Motion" },
    ],
    wantToLearn: ["Figma", "UI/UX Design", "Web Design"],
    reviews: [],
    avatarColor: "#5c7cfa",
  },
];

const MOCK_COLLABORATIONS = [
  {
    id: 101,
    initiatorId: 99, // current user (kita anggap ID 99)
    partnerId: 1,    // Teo
    initiatorName: "Kamu",
    initiatorInitials: "KA",
    partnerName: "Teo Hardianto",
    partnerInitials: "TH",
    skillNeeded: "Backend PHP",
    skillOffered: "Desain UI/UX",
    message: "Hei Teo! Aku sedang membangun website portofolio dan butuh bantuan untuk backend PHP-nya. Aku bisa bantu desain UI/UX-nya sebagai gantinya.",
    status: "pending",
    date: "Hari ini, 10:30",
    dateRaw: new Date(),
  },
  {
    id: 102,
    initiatorId: 2,  // Nasya
    partnerId: 99,   // current user
    initiatorName: "Nasya Putri",
    initiatorInitials: "NP",
    partnerName: "Kamu",
    partnerInitials: "KA",
    skillNeeded: "Frontend React",
    skillOffered: "UI/UX Design",
    message: "Hai! Aku lihat kamu jago React. Aku perlu bantuan implementasi design system yang sudah aku buat di Figma. Aku bisa bantu desain untuk proyekmu!",
    status: "in-progress",
    date: "Kemarin, 14:22",
    dateRaw: new Date(Date.now() - 86400000),
  },
  {
    id: 103,
    initiatorId: 99,
    partnerId: 4, // Laura
    initiatorName: "Kamu",
    initiatorInitials: "KA",
    partnerName: "Laura Sitanggang",
    partnerInitials: "LS",
    skillNeeded: "Data Analysis",
    skillOffered: "Web Design",
    message: "Laura, bisa minta bantuan analisis data survei UX yang sudah kukumpulkan? Aku bisa bantu desain visualisasinya.",
    status: "completed",
    date: "5 hari lalu",
    dateRaw: new Date(Date.now() - 432000000),
    review: { score: 5, text: "Laura luar biasa! Analisis datanya sangat detail dan insightful." },
  },
];

// Current logged-in user (mock)
const CURRENT_USER = {
  id: 99,
  name: "Reza Anugrah",
  initials: "RA",
  major: "Desain Komunikasi Visual",
  university: "Universitas Sam Ratulangi",
  score: 4.6,
  skills: [
    { name: "UI/UX Design", level: "Menengah", category: "Design" },
    { name: "Figma", level: "Menengah", category: "Design" },
    { name: "HTML/CSS", level: "Pemula", category: "Frontend" },
  ],
};

const SKILL_CATEGORIES = [
  "Frontend", "Backend", "Mobile", "Design", "Data Science", "Database", "Framework", "DevOps", "Motion"
];
