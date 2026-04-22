const programsData = {
  categories: {
    Computing: {
      subcategories: {
        "Information Technology": {
          years: {
            1: {
              semesters: {
                1: [
                  { code: "IT1120", name: "Introduction to Programming", credits: 4 },
                  { code: "IE1030", name: "Data Communication Networks", credits: 4 },
                  { code: "IT1130", name: "Mathematics for Computing", credits: 4 },
                  { code: "IT1140", name: "Fundamentals of Computing", credits: 4 },
                ],
                2: [
                  { code: "IT1160", name: "Discrete Mathematics", credits: 4 },
                  { code: "IT1170", name: "Data Structures and Algorithms", credits: 4 },
                  { code: "SE1010", name: "Software Engineering", credits: 4 },
                  { code: "IT1150", name: "Technical Writing", credits: 4 },
                ],
              },
            },
            2: {
              semesters: {
                1: [
                  { code: "IT2120", name: "Probability and Statistics", credits: 4 },
                  { code: "SE2010", name: "Object Oriented Programming", credits: 4 },
                  { code: "IT2130", name: "Operating Systems & System Administration", credits: 4 },
                  { code: "IT2140", name: "Database Design and Development", credits: 4 },
                ],
                2: [
                  { code: "IT2011", name: "Artificial Intelligence & Machine Learning", credits: 4 },
                  { code: "IT2150", name: "IT Project", credits: 4 },
                  { code: "SE2020", name: "Web and Mobile Technologies", credits: 4 },
                  { code: "IT2160", name: "Professional Skills", credits: 4 },
                ],
              },
            },
            3: {
              semesters: {
                1: [
                  { code: "IT3120", name: "Industry Economics & Management", credits: 4 },
                  { code: "IT3130", name: "Application Development", credits: 4 },
                  { code: "IT3140", name: "Database Systems", credits: 4 },
                  { code: "IT3150", name: "IT Process and Infrastructure Management", credits: 4 },
                ],
                2: [
                  { code: "IT3190", name: "Industry Training", credits: 0 },
                  { code: "IT3180", name: "Cloud Technologies", credits: 4 },
                  { code: "IT3200", name: "Data Analytics", credits: 4 },
                  { code: "IT3160", name: "Research Methods", credits: 4 },
                ],
              },
            },
            4: {
              semesters: {
                1: [
                  { code: "IT4200", name: "Research Project I", credits: 4 },
                  { code: "IT4210", name: "Information Security", credits: 4 },
                  { code: "IT4150", name: "Intelligent Systems Development", credits: 4 },
                  { code: "IT4180", name: "IT Policy Management and Governance", credits: 4 },
                  { code: "IT4160", name: "Software Quality Management", credits: 4 },
                ],
                2: [
                  { code: "IT4200", name: "Research Project II", credits: 8 },
                  { code: "IT4190", name: "Current Trends in IT", credits: 4 },
                  { code: "SE4120", name: "Enterprise Application Development", credits: 4 },
                  { code: "IT4170", name: "Human Computer Interaction", credits: 4 },
                ],
              },
            },
          },
        },
        "Software Engineering": {
          years: {},
        },
        "Data Science": {
          years: {},
        },
        "Cyber Security": {
          years: {},
        },
      },
    },
    Business: {
      subcategories: {},
    },
    Engineering: {
      subcategories: {},
    },
  },
};

export default programsData;