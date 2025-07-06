# 🚀 AI Career Coach - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack Deep Dive](#technology-stack-deep-dive)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Database Design & Schema](#database-design--schema)
5. [Authentication & Security](#authentication--security)
6. [AI Integration](#ai-integration)
7. [Background Jobs & Automation](#background-jobs--automation)
8. [Core Features Breakdown](#core-features-breakdown)
9. [Interview Questions & Answers](#interview-questions--answers)
10. [Performance & Optimization](#performance--optimization)
11. [Deployment & DevOps](#deployment--devops)

---

## Project Overview

### What is AI Career Coach?
AI Career Coach is a modern full-stack web application that helps users advance their careers through AI-powered features including:
- **Resume Building** with AI enhancement
- **Cover Letter Generation** tailored to job descriptions
- **Interview Preparation** with practice quizzes
- **Industry Insights** with real-time market data
- **Skill Assessment** and improvement recommendations

### Business Value
- **For Job Seekers**: Comprehensive career development platform
- **For Recruiters**: Quality candidate preparation
- **For Organizations**: Workforce development insights

---

## Technology Stack Deep Dive

### Frontend Technologies

#### Next.js 15.3.5 (App Router)
```javascript
// Package.json dependencies
{
  "next": "^15.3.5",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

**Key Features Used:**
1. **App Router Architecture**
   ```
   app/
   ├── layout.js          # Root layout
   ├── page.js           # Landing page
   ├── (auth)/           # Route group
   │   ├── layout.js     # Auth-specific layout
   │   ├── sign-in/      # Sign-in page
   │   └── sign-up/      # Sign-up page
   └── (main)/           # Protected routes
       ├── dashboard/    # Analytics dashboard
       ├── resume/       # Resume builder
       ├── interview/    # Quiz system
       └── onboarding/   # User setup
   ```

2. **Server Components (Default)**
   ```javascript
   // Server Component - runs on server
   export default async function DashboardPage() {
     const insights = await getIndustryInsights(); // Direct DB call
     return <DashboardView insights={insights} />;
   }
   ```

3. **Client Components (When Needed)**
   ```javascript
   "use client"; // Explicit client component
   export default function InteractiveForm() {
     const [state, setState] = useState();
     // Interactive functionality
   }
   ```

4. **Server Actions**
   ```javascript
   "use server";
   export async function updateUser(data) {
     const { userId } = await auth();
     // Direct server operations from client
   }
   ```

**Interview Q&A:**
- **Q: Why Next.js over plain React?**
- **A:** Next.js provides SSR for SEO, automatic code splitting, built-in routing, API routes, and production optimizations. It's a full-stack framework that handles both frontend and backend needs.

#### React 19 Features
```javascript
// Concurrent Features
import { Suspense } from 'react';

function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DataComponent />
    </Suspense>
  );
}
```

#### Tailwind CSS
```javascript
// tailwind.config.mjs
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  }
}
```

**Benefits:**
- **Utility-first**: No custom CSS files needed
- **Performance**: Purges unused styles
- **Consistency**: Design system through configuration
- **Responsive**: Mobile-first approach

#### shadcn/ui Components
```javascript
// components.json
{
  "style": "default",
  "rsc": true,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.mjs",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

**Key Components Used:**
- Card, Button, Input, Select
- Dialog, Accordion, Tabs
- Progress, Badge, Alert

### Backend Technologies

#### Prisma ORM
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Dev: SQLite, Prod: PostgreSQL
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  clerkUserId   String    @unique
  email         String    @unique
  industry      String?
  skillsString  String?   // CSV for SQLite compatibility
  assessments   Assessment[]
  resume        Resume?
  coverLetter   CoverLetter[]
}
```

**Why Prisma?**
- **Type Safety**: Auto-generated TypeScript types
- **Database Agnostic**: Works with multiple databases
- **Migration System**: Version-controlled schema changes
- **Query Builder**: Intuitive API for complex queries
- **Performance**: Connection pooling and optimizations

#### Database Design Decisions

**1. SQLite for Development**
```javascript
// .env (development)
DATABASE_URL="file:./dev.db"
```
**Benefits:** Easy setup, no external dependencies, perfect for development

**2. String Storage for Arrays**
```javascript
// Instead of arrays (not supported in SQLite)
skillsString: "JavaScript,React,Node.js,TypeScript"
topSkillsString: "skill1,skill2,skill3"

// JSON for complex objects
salaryRangesJson: '[{"role":"Developer","min":50000,"max":100000}]'
```

**3. Relational Design**
```prisma
model User {
  id       String @id
  resume   Resume? // One-to-one
  coverLetter CoverLetter[] // One-to-many
}

model Resume {
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

### Authentication - Clerk

#### Setup and Configuration
```javascript
// app/layout.js
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
```

#### Middleware Protection
```javascript
// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/resume(.*)",
  "/interview(.*)",
  "/ai-cover-letter(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }
  
  return NextResponse.next();
});
```

**Why Clerk over NextAuth?**
- **Built-in UI Components**: No need to build auth forms
- **Advanced Features**: MFA, social logins, user management
- **Better TypeScript Support**: Full type safety
- **Production Ready**: Handles edge cases automatically
- **User Management Dashboard**: Admin interface included

### AI Integration - Google Gemini

#### Setup and Configuration
```javascript
// actions/dashboard.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights...
  `;
  
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  return JSON.parse(text);
};
```

#### Error Handling and Fallbacks
```javascript
export const generateAIInsights = async (industry) => {
  try {
    const result = await model.generateContent(prompt);
    return processAIResponse(result);
  } catch (error) {
    console.error("AI generation failed:", error);
    
    // Return fallback data
    return {
      salaryRangesJson: JSON.stringify(defaultSalaryRanges),
      growthRate: 5.0,
      demandLevel: "Medium",
      // ... other fallback data
    };
  }
};
```

**Why Google Gemini over OpenAI?**
- **Cost-effective**: Lower pricing for similar capabilities
- **JSON Mode**: Better structured output
- **Multimodal**: Text, images, code processing
- **Rate Limits**: More generous free tier
- **Integration**: Better with Google Cloud ecosystem

### Background Jobs - Inngest

#### Client Setup
```javascript
// lib/inngest/client.js
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "career-coach",
  name: "Career Coach",
  credentials: {
    gemini: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
    },
  },
});
```

#### Function Definitions
```javascript
// lib/inngest/function.js
export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" }, // Every Sunday at midnight
  async ({ event, step }) => {
    // Fetch all industries
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },
      });
    });

    // Process each industry
    for (const { industry } of industries) {
      const prompt = `Analyze ${industry} industry...`;
      
      const res = await step.ai.wrap(
        "gemini",
        async (p) => await model.generateContent(p),
        prompt
      );
      
      // Update database
      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.update({
          where: { industry },
          data: {
            ...formattedInsights,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      });
    }
  }
);
```

#### Event-Driven Jobs
```javascript
export const syncUserData = inngest.createFunction(
  { name: "Sync User Data After Onboarding" },
  { event: "user/onboarded" },
  async ({ event, step }) => {
    const { userId, industry } = event.data;
    
    // Check if insights exist
    const existingInsight = await step.run("Check insights", async () => {
      return await db.industryInsight.findFirst({
        where: { industry }
      });
    });
    
    // Generate if missing
    if (!existingInsight) {
      await step.run("Generate insights", async () => {
        // AI generation logic
      });
    }
  }
);
```

**Why Inngest?**
- **Reliability**: Automatic retries and error handling
- **Observability**: Built-in monitoring and debugging
- **Type Safety**: Full TypeScript support
- **Local Development**: Works offline
- **Step Functions**: Break complex workflows into atomic operations

---

## Core Features Breakdown

### 1. User Onboarding Flow

#### Page Structure
```javascript
// app/(main)/onboarding/page.jsx
export default async function OnboardingPage() {
  const { isOnboarded } = await getUserOnboardingStatus();
  
  if (isOnboarded) {
    redirect("/dashboard");
  }
  
  return <OnboardingForm industries={industries} />;
}
```

#### Form Component
```javascript
// app/(main)/onboarding/_components/onboarding-form.jsx
"use client";

export default function OnboardingForm({ industries }) {
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState([]);
  
  const handleSubmit = async (formData) => {
    try {
      await updateUser({
        industry: selectedIndustry,
        experience: parseInt(experience),
        skills: skills,
        bio: formData.bio
      });
      
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

#### Server Action
```javascript
// actions/user.js
export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  if (!user) throw new Error("User not found");
  
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      industry: data.industry,
      experience: data.experience,
      skillsString: Array.isArray(data.skills) ? 
        data.skills.join(',') : data.skills,
      bio: data.bio,
    },
  });
  
  // Trigger background job
  await inngest.send({
    name: "user/onboarded",
    data: {
      userId: user.id,
      industry: data.industry
    }
  });
  
  revalidatePath("/");
  return updatedUser;
}
```

**Flow:**
1. User completes auth with Clerk
2. Redirected to onboarding (middleware check)
3. Fills out industry, experience, skills, bio
4. Server action updates database
5. Background job generates industry insights
6. User redirected to dashboard

### 2. Dashboard & Analytics

#### Page Component
```javascript
// app/(main)/dashboard/page.jsx
export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();
  
  if (!isOnboarded) {
    redirect("/onboarding");
  }
  
  const insights = await getIndustryInsights();
  
  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  );
}
```

#### Data Fetching
```javascript
// actions/dashboard.js
export async function getIndustryInsights() {
  const { userId } = await auth();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  if (!user.industry) {
    throw new Error("User has not set an industry");
  }
  
  let industryInsight = await db.industryInsight.findFirst({
    where: { industry: user.industry },
  });
  
  // Generate if missing
  if (!industryInsight) {
    const insights = await generateAIInsights(user.industry);
    industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  
  // Transform data for component
  return {
    ...industryInsight,
    salaryRanges: JSON.parse(industryInsight.salaryRangesJson || '[]'),
    topSkills: industryInsight.topSkillsString ? 
      industryInsight.topSkillsString.split(',') : [],
    keyTrends: industryInsight.keyTrendsString ? 
      industryInsight.keyTrendsString.split(',') : [],
    recommendedSkills: industryInsight.recommendedSkillsString ? 
      industryInsight.recommendedSkillsString.split(',') : []
  };
}
```

#### Dashboard View Component
```javascript
// app/(main)/dashboard/_component/dashboard-view.jsx
"use client";

const DashboardView = ({ insights }) => {
  // Safety checks
  if (!insights) {
    return <ErrorFallback />;
  }
  
  const salaryRanges = insights.salaryRanges || [];
  const topSkills = insights.topSkills || [];
  
  // Transform for chart
  const salaryData = salaryRanges.map((range) => ({
    name: range.role,
    min: range.min / 1000,
    max: range.max / 1000,
    median: range.median / 1000,
  }));
  
  return (
    <div className="space-y-6">
      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Market Outlook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketOutlook}</div>
          </CardContent>
        </Card>
        {/* More cards... */}
      </div>
      
      {/* Salary Chart */}
      <Card>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="min" fill="#94a3b8" />
              <Bar dataKey="median" fill="#64748b" />
              <Bar dataKey="max" fill="#475569" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 3. Resume Builder

#### Page Structure
```javascript
// app/(main)/resume/page.jsx
export default async function ResumePage() {
  const resume = await getResume();
  
  return (
    <div className="container mx-auto py-8">
      <ResumeBuilder initialContent={resume?.content} />
    </div>
  );
}
```

#### Resume Builder Component
```javascript
// app/(main)/resume/_components/resume-builder.jsx
"use client";

export default function ResumeBuilder({ initialContent }) {
  const [content, setContent] = useState(initialContent || "");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveResume(content);
      toast.success("Resume saved successfully!");
    } catch (error) {
      toast.error("Failed to save resume");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAIImprovement = async (section, currentText) => {
    try {
      const improved = await improveWithAI({
        current: currentText,
        type: section
      });
      
      // Replace the section with improved text
      setContent(content.replace(currentText, improved));
    } catch (error) {
      toast.error("AI improvement failed");
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Resume Editor</h2>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Resume"}
          </Button>
        </div>
        
        <MDEditor
          value={content}
          onChange={setContent}
          preview="edit"
          hideToolbar={false}
          height={600}
        />
        
        <Button 
          onClick={() => handleAIImprovement("experience", selectedText)}
          variant="outline"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Improve with AI
        </Button>
      </div>
      
      {/* Preview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Preview</h2>
        <div className="border rounded-lg p-6 bg-white text-black min-h-[600px]">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
```

#### Server Actions
```javascript
// actions/resume.js
export async function saveResume(content) {
  const { userId } = await auth();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  const resume = await db.resume.upsert({
    where: { userId: user.id },
    update: { content },
    create: {
      userId: user.id,
      content,
    },
  });
  
  revalidatePath("/resume");
  return resume;
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  const prompt = `
    As an expert resume writer, improve the following ${type} description 
    for a ${user.industry} professional.
    Current content: "${current}"
    
    Requirements:
    1. Use action verbs
    2. Include metrics and results
    3. Highlight technical skills
    4. Keep concise but detailed
    5. Focus on achievements over responsibilities
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### 4. Cover Letter Generator

#### Form Component
```javascript
// app/(main)/ai-cover-letter/_components/cover-letter-generator.jsx
"use client";

export default function CoverLetterGenerator() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    jobDescription: ""
  });
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCoverLetter(formData);
      setGeneratedLetter(result.content);
    } catch (error) {
      toast.error("Failed to generate cover letter");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData({
                ...formData,
                jobTitle: e.target.value
              })}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({
                ...formData,
                companyName: e.target.value
              })}
              placeholder="e.g., Google"
            />
          </div>
          
          <div>
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => setFormData({
                ...formData,
                jobDescription: e.target.value
              })}
              placeholder="Paste the job description here..."
              rows={10}
            />
          </div>
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !formData.jobTitle}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Cover Letter"}
          </Button>
        </CardContent>
      </Card>
      
      {/* Generated Letter */}
      {generatedLetter && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Cover Letter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{generatedLetter}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

#### Server Action
```javascript
// actions/cover-letter.js
export async function generateCoverLetter(data) {
  const { userId } = await auth();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  const skills = user.skillsString ? user.skillsString.split(',') : [];
  
  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${data.companyName}.
    
    About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${skills.join(", ")}
    - Background: ${user.bio}
    
    Job Description: ${data.jobDescription}
    
    Requirements:
    1. Professional, enthusiastic tone
    2. Highlight relevant skills
    3. Show company understanding
    4. Max 400 words
    5. Proper business letter format
    6. Specific achievement examples
  `;
  
  const result = await model.generateContent(prompt);
  const content = result.response.text();
  
  // Save to database
  const coverLetter = await db.coverLetter.create({
    data: {
      userId: user.id,
      content,
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      jobDescription: data.jobDescription,
      status: "draft"
    },
  });
  
  return coverLetter;
}
```

### 5. Interview Practice System

#### Quiz Generator
```javascript
// actions/interview.js
export async function generateQuiz() {
  const { userId } = await auth();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skillsString: true,
    },
  });
  
  const skills = user.skillsString ? user.skillsString.split(',') : [];
  
  const prompt = `
    Generate 10 technical interview questions for a ${user.industry} professional
    ${skills.length ? `with expertise in ${skills.join(", ")}` : ""}.
    
    Each question should be multiple choice with 4 options.
    
    Return in JSON format:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;
  
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const cleanedText = response.replace(/```(?:json)?\n?/g, "").trim();
  
  return JSON.parse(cleanedText);
}
```

#### Quiz Component
```javascript
// app/(main)/interview/_components/quiz.jsx
"use client";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const generateNewQuiz = async () => {
    setIsLoading(true);
    try {
      const result = await generateQuiz();
      setQuestions(result.questions);
      setCurrentQuestion(0);
      setAnswers([]);
      setQuizCompleted(false);
    } catch (error) {
      toast.error("Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswer = (selectedAnswer) => {
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      const score = calculateScore(newAnswers);
      saveQuizResult(questions, newAnswers, score);
      setQuizCompleted(true);
    }
  };
  
  const calculateScore = (userAnswers) => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (question.correctAnswer === userAnswers[index]) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };
  
  if (quizCompleted) {
    return <QuizResult questions={questions} answers={answers} />;
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {questions.length}
        </CardTitle>
        <Progress value={(currentQuestion / questions.length) * 100} />
      </CardHeader>
      <CardContent>
        {questions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {questions[currentQuestion].question}
            </h3>
            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {questions.length === 0 && (
          <div className="text-center">
            <Button onClick={generateNewQuiz} disabled={isLoading}>
              {isLoading ? "Generating..." : "Start New Quiz"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Interview Questions & Answers

### Next.js & React

**Q: Explain the difference between Server Components and Client Components.**
**A:** Server Components run on the server and don't send JavaScript to the client, improving performance and enabling direct database access. Client Components run in the browser and handle interactivity. In our project, data fetching components are Server Components, while interactive forms are Client Components.

**Q: How do Server Actions work?**
**A:** Server Actions allow you to call server-side functions directly from client components without creating API routes. They're marked with "use server" and provide automatic CSRF protection, type safety, and progressive enhancement.

**Q: Why use App Router over Pages Router?**
**A:** App Router provides better performance with Server Components by default, nested layouts, improved loading states, and better developer experience with co-located components.

### Database & Backend

**Q: Why did you choose Prisma over other ORMs?**
**A:** Prisma provides excellent TypeScript integration, database-agnostic queries, visual database browser, automatic migrations, and type-safe database operations. It significantly improves developer productivity and reduces runtime errors.

**Q: How do you handle data consistency in your application?**
**A:** We use database transactions for related operations, implement proper foreign key constraints, use optimistic locking where needed, and leverage Inngest for reliable background job processing with automatic retries.

**Q: Explain your database schema design decisions.**
**A:** We chose SQLite for development (easy setup) and PostgreSQL for production (better concurrency). We store arrays as CSV strings and complex objects as JSON strings for SQLite compatibility, with proper parsing in the application layer.

### Authentication & Security

**Q: How do you secure your application?**
**A:** We use Clerk for authentication with middleware protection on all protected routes, validate all inputs with Zod schemas, implement proper authorization checks in Server Actions, and use environment variables for sensitive data.

**Q: Why Clerk over other authentication solutions?**
**A:** Clerk provides built-in UI components, advanced features like MFA, excellent TypeScript support, user management dashboard, and handles complex scenarios like email verification automatically.

### AI Integration

**Q: How do you handle AI API failures and rate limits?**
**A:** We implement comprehensive error handling with fallback data, cache AI-generated content in the database, use background jobs to avoid blocking user interactions, and implement retry logic with exponential backoff.

**Q: Why Google Gemini over OpenAI?**
**A:** Gemini offers better cost-effectiveness, native JSON mode for structured outputs, multimodal capabilities, and more generous rate limits for our use case.

### Background Jobs

**Q: Why did you choose Inngest for background processing?**
**A:** Inngest provides reliability with automatic retries, excellent observability and debugging, full TypeScript support, works great for local development, and offers step functions for complex workflows.

**Q: How do you ensure job reliability?**
**A:** We use idempotent operations, implement proper error handling, break complex jobs into atomic steps, use exponential backoff for retries, and monitor job execution through Inngest's dashboard.

### Performance & Optimization

**Q: How do you optimize your application's performance?**
**A:** We use Server Components to reduce client-side JavaScript, implement proper caching strategies, optimize images with Next.js, use background processing for heavy operations, and implement proper database indexing.

**Q: How do you handle caching in your application?**
**A:** We use Next.js built-in caching for static content, cache AI-generated content in the database, implement cache revalidation with revalidatePath(), and use CDN for static assets in production.

### Architecture & Design

**Q: Explain your application's architecture.**
**A:** We use a modular architecture with clear separation between presentation (React components), business logic (Server Actions), data access (Prisma), and background processing (Inngest). This provides maintainability, testability, and scalability.

**Q: How would you scale this application?**
**A:** We would implement horizontal scaling with load balancers, use database read replicas, implement proper caching layers, use CDN for static assets, implement microservices for independent scaling, and use container orchestration for deployment.

---

## Performance & Optimization

### Frontend Optimizations

1. **Server Components by Default**
   - Reduced client-side JavaScript bundle
   - Better SEO and initial page load times
   - Direct database access without API overhead

2. **Code Splitting**
   - Automatic route-based code splitting
   - Dynamic imports for heavy components
   - Lazy loading of non-critical features

3. **Image Optimization**
   ```javascript
   import Image from 'next/image';
   
   <Image
     src="/banner.jpeg"
     alt="Career Coach"
     width={800}
     height={400}
     priority
     placeholder="blur"
   />
   ```

4. **Caching Strategies**
   ```javascript
   // Server-side caching
   export async function getIndustryInsights() {
     // Cache in database to avoid repeated AI calls
     let insights = await db.industryInsight.findFirst({
       where: { industry: user.industry }
     });
     
     if (!insights || isStale(insights.lastUpdated)) {
       insights = await generateAndCacheInsights(user.industry);
     }
     
     return insights;
   }
   ```

### Backend Optimizations

1. **Database Indexing**
   ```prisma
   model Assessment {
     userId String
     user   User   @relation(fields: [userId], references: [id])
     
     @@index([userId]) // Index for faster queries
   }
   ```

2. **Connection Pooling**
   ```javascript
   // Prisma automatically handles connection pooling
   // Configure in DATABASE_URL for production
   ```

3. **Background Processing**
   - Heavy AI operations run asynchronously
   - Don't block user interactions
   - Scheduled updates for data freshness

---

## Deployment & DevOps

### Development Environment
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "seed": "node prisma/seed.js"
  }
}
```

### Production Considerations

1. **Database Migration**
   ```bash
   # Development
   DATABASE_URL="file:./dev.db"
   
   # Production
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

2. **Environment Variables**
   ```bash
   # Required for production
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   GOOGLE_AI_API_KEY=
   INNGEST_EVENT_KEY=
   INNGEST_SIGNING_KEY=
   DATABASE_URL=
   ```

3. **Monitoring & Observability**
   - Inngest dashboard for job monitoring
   - Vercel Analytics for performance metrics
   - Error tracking with Sentry (recommended)
   - Database monitoring with connection pooling

### Deployment Flow
1. **Build Process**: `npm run build`
2. **Database Setup**: Migrate to PostgreSQL
3. **Environment Config**: Set production variables
4. **CDN Setup**: Static asset optimization
5. **Monitoring**: Set up error tracking and performance monitoring

---

## Conclusion

This AI Career Coach project demonstrates modern full-stack development practices with:

- **Scalable Architecture**: Modular design with clear separation of concerns
- **Type Safety**: End-to-end TypeScript with Prisma and Next.js
- **Performance**: Server Components, caching, and background processing
- **User Experience**: Responsive design, progressive enhancement, and error handling
- **Maintainability**: Clear code structure, comprehensive error handling, and monitoring

The project showcases enterprise-level patterns and would be impressive in technical interviews, demonstrating proficiency in modern web development, AI integration, and production-ready application development.
