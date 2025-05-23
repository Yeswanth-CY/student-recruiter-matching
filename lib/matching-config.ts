// Job categories and their weighting factors
export const jobCategories = [
  {
    id: "tech",
    name: "Technology",
    description: "Software development, IT, and technical roles",
    keywords: ["developer", "engineer", "software", "web", "data", "it", "technical", "programmer"],
    weights: {
      skillMatch: 0.7, // 70% of score comes from skill matching
      academicPerformance: 0.15, // 15% from academic performance
      experience: 0.15, // 15% from experience
      // Skills that get extra weight in this category
      criticalSkills: ["programming", "coding", "development", "software", "engineering", "algorithms"],
    },
  },
  {
    id: "business",
    name: "Business & Management",
    description: "Business, management, and administrative roles",
    keywords: ["manager", "business", "analyst", "consultant", "executive", "director", "coordinator", "administrator"],
    weights: {
      skillMatch: 0.6, // 60% of score comes from skill matching
      academicPerformance: 0.1, // 10% from academic performance
      experience: 0.3, // 30% from experience
      // Skills that get extra weight in this category
      criticalSkills: ["management", "leadership", "communication", "strategy", "analysis", "project management"],
    },
  },
  {
    id: "creative",
    name: "Creative & Design",
    description: "Design, content creation, and creative roles",
    keywords: ["designer", "creative", "artist", "writer", "content", "ux", "ui", "graphic"],
    weights: {
      skillMatch: 0.65, // 65% of score comes from skill matching
      academicPerformance: 0.05, // 5% from academic performance
      experience: 0.3, // 30% from experience
      // Skills that get extra weight in this category
      criticalSkills: ["design", "creative", "visual", "ui/ux", "content", "portfolio"],
    },
  },
  {
    id: "data",
    name: "Data Science & Analytics",
    description: "Data science, analytics, and research roles",
    keywords: ["data", "analyst", "scientist", "analytics", "research", "statistics", "ml", "ai"],
    weights: {
      skillMatch: 0.6, // 60% of score comes from skill matching
      academicPerformance: 0.25, // 25% from academic performance
      experience: 0.15, // 15% from experience
      // Skills that get extra weight in this category
      criticalSkills: ["data analysis", "statistics", "machine learning", "python", "r", "sql", "research"],
    },
  },
  {
    id: "marketing",
    name: "Marketing & Sales",
    description: "Marketing, sales, and customer-facing roles",
    keywords: ["marketing", "sales", "customer", "social media", "seo", "content", "brand", "product"],
    weights: {
      skillMatch: 0.55, // 55% of score comes from skill matching
      academicPerformance: 0.1, // 10% from academic performance
      experience: 0.35, // 35% from experience
      // Skills that get extra weight in this category
      criticalSkills: ["marketing", "sales", "communication", "social media", "customer", "presentation"],
    },
  },
  // Default category for jobs that don't match any specific category
  {
    id: "default",
    name: "General",
    description: "General roles that don't fit specific categories",
    keywords: [],
    weights: {
      skillMatch: 0.6, // 60% of score comes from skill matching
      academicPerformance: 0.2, // 20% from academic performance
      experience: 0.2, // 20% from experience
      criticalSkills: [],
    },
  },
]

// Function to determine job category based on job title and description
export function determineJobCategory(jobTitle: string, jobDescription: string): (typeof jobCategories)[0] {
  const combinedText = `${jobTitle} ${jobDescription}`.toLowerCase()

  // Check each category except the default one
  for (const category of jobCategories.slice(0, -1)) {
    // If any keyword from the category is found in the job title or description
    if (category.keywords.some((keyword) => combinedText.includes(keyword.toLowerCase()))) {
      return category
    }
  }

  // If no category matches, return the default category
  return jobCategories[jobCategories.length - 1]
}

// Function to calculate weighted match score
export function calculateWeightedMatchScore(params: {
  baseSkillMatchPercentage: number
  academicScore: number
  experiencePoints: number
  studentSkills: string[]
  jobRequiredSkills: string[]
  jobCategory: (typeof jobCategories)[0]
}): number {
  const { baseSkillMatchPercentage, academicScore, experiencePoints, studentSkills, jobRequiredSkills, jobCategory } =
    params

  // Calculate the weighted skill match component
  let skillMatchComponent = baseSkillMatchPercentage * jobCategory.weights.skillMatch

  // Add bonus for critical skills
  const criticalSkillsBonus = calculateCriticalSkillsBonus(
    studentSkills,
    jobRequiredSkills,
    jobCategory.weights.criticalSkills,
  )
  skillMatchComponent += criticalSkillsBonus

  // Calculate the academic performance component (normalized to 0-100)
  // Assuming academicScore is already on a 0-100 scale
  const academicComponent = academicScore * jobCategory.weights.academicPerformance

  // Calculate the experience component (normalized to 0-100)
  // Assuming experiencePoints can go up to 500, normalize to 0-100
  const normalizedExperience = Math.min((experiencePoints / 500) * 100, 100)
  const experienceComponent = normalizedExperience * jobCategory.weights.experience

  // Calculate the final weighted score
  const finalScore = skillMatchComponent + academicComponent + experienceComponent

  // Cap at 100%
  return Math.min(finalScore, 100)
}

// Helper function to calculate bonus for critical skills
function calculateCriticalSkillsBonus(
  studentSkills: string[],
  jobRequiredSkills: string[],
  criticalSkills: string[],
): number {
  if (criticalSkills.length === 0) return 0

  // Count how many critical skills the student has that are also required by the job
  const matchingCriticalSkills = studentSkills.filter(
    (skill) =>
      jobRequiredSkills.some((reqSkill) => reqSkill.toLowerCase() === skill.toLowerCase()) &&
      criticalSkills.some((critSkill) => skill.toLowerCase().includes(critSkill.toLowerCase())),
  )

  // Calculate bonus (up to 10%)
  const criticalSkillsInJob = jobRequiredSkills.filter((skill) =>
    criticalSkills.some((critSkill) => skill.toLowerCase().includes(critSkill.toLowerCase())),
  )

  if (criticalSkillsInJob.length === 0) return 0

  const criticalSkillsMatchPercentage = (matchingCriticalSkills.length / criticalSkillsInJob.length) * 100
  return Math.min(criticalSkillsMatchPercentage * 0.1, 10) // Up to 10% bonus
}
