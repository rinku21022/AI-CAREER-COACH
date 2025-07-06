# 🧪 AI Career Coach - Testing Strategy & Guide

## 🎯 Testing Philosophy

Testing is crucial for maintaining code quality and ensuring reliable user experiences. For the AI Career Coach application, I would implement a comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests.

## 📋 Testing Pyramid

```
    🔺 E2E Tests (Few)
   ----🔺---- Integration Tests (Some)
  -------🔺------- Unit Tests (Many)
```

### **Unit Tests (70%)**
- Individual functions and components
- Fast execution, isolated testing
- High coverage for business logic

### **Integration Tests (20%)**
- Component interactions
- API endpoint testing
- Database operations

### **End-to-End Tests (10%)**
- Full user workflows
- Cross-browser compatibility
- Critical path validation

---

## 🛠️ Testing Stack

### **Framework & Tools**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "msw": "^2.0.0",
    "playwright": "^1.40.0",
    "prisma": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### **Configuration Files**

#### **jest.config.js**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'actions/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### **jest.setup.js**
```javascript
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({ userId: 'test-user-id' })),
  currentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
}))

// Mock Inngest
jest.mock('./lib/inngest/client', () => ({
  inngest: {
    send: jest.fn(),
  },
}))

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## 🔍 Unit Testing Examples

### **1. Testing Utility Functions**

#### **lib/helper.test.js**
```javascript
import { generateCoverLetter, validateEmail, formatDate } from './helper'

describe('Helper Functions', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
    })

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('January 15, 2024')
    })
  })

  describe('generateCoverLetter', () => {
    it('should generate cover letter with correct structure', async () => {
      const mockAI = jest.fn().mockResolvedValue('Generated cover letter')
      
      const result = await generateCoverLetter('Job description', 'Resume content')
      
      expect(result).toContain('Generated cover letter')
    })
  })
})
```

### **2. Testing React Components**

#### **components/ui/Button.test.jsx**
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const mockClick = jest.fn()
    render(<Button onClick={mockClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### **3. Testing Form Components**

#### **components/onboarding/OnboardingForm.test.jsx**
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingForm from './OnboardingForm'

// Mock the update action
jest.mock('@/actions/user', () => ({
  updateUser: jest.fn(),
}))

describe('OnboardingForm', () => {
  it('renders all form fields', () => {
    render(<OnboardingForm />)
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/experience level/i)).toBeInTheDocument()
  })

  it('submits form with correct data', async () => {
    const user = userEvent.setup()
    const mockUpdate = require('@/actions/user').updateUser
    
    render(<OnboardingForm />)
    
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.selectOptions(screen.getByLabelText(/industry/i), 'Technology')
    await user.click(screen.getByRole('button', { name: /complete profile/i }))
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        industry: 'Technology',
        experienceLevel: expect.any(String),
      })
    })
  })

  it('displays validation errors', async () => {
    const user = userEvent.setup()
    render(<OnboardingForm />)
    
    await user.click(screen.getByRole('button', { name: /complete profile/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    })
  })
})
```

---

## 🔗 Integration Testing

### **1. Testing Server Actions**

#### **actions/resume.test.js**
```javascript
import { createResume, updateResume } from './resume'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs'

// Mock Clerk auth
jest.mock('@clerk/nextjs')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

describe('Resume Actions', () => {
  beforeEach(() => {
    auth.mockReturnValue({ userId: 'test-user-id' })
  })

  describe('createResume', () => {
    it('creates a resume successfully', async () => {
      const mockResume = {
        id: 'resume-1',
        userId: 'test-user-id',
        title: 'Software Engineer',
        content: 'Resume content',
      }

      prisma.resume.create.mockResolvedValue(mockResume)

      const result = await createResume({
        title: 'Software Engineer',
        content: 'Resume content',
      })

      expect(result.success).toBe(true)
      expect(result.resume).toEqual(mockResume)
      expect(prisma.resume.create).toHaveBeenCalledWith({
        data: {
          userId: 'test-user-id',
          title: 'Software Engineer',
          content: 'Resume content',
        },
      })
    })

    it('handles errors gracefully', async () => {
      prisma.resume.create.mockRejectedValue(new Error('Database error'))

      const result = await createResume({
        title: 'Software Engineer',
        content: 'Resume content',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })
})
```

### **2. Testing API Routes**

#### **app/api/resume/route.test.js**
```javascript
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

describe('/api/resume', () => {
  describe('GET', () => {
    it('returns user resumes', async () => {
      const request = new NextRequest('http://localhost:3000/api/resume')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.resumes).toBeDefined()
    })
  })

  describe('POST', () => {
    it('creates a new resume', async () => {
      const request = new NextRequest('http://localhost:3000/api/resume', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Software Engineer',
          content: 'Resume content',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.resume).toBeDefined()
    })
  })
})
```

---

## 🎭 End-to-End Testing

### **Playwright Configuration**

#### **playwright.config.js**
```javascript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### **E2E Test Examples**

#### **e2e/auth.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can sign in and access dashboard', async ({ page }) => {
    await page.goto('/')
    
    // Click sign in button
    await page.click('text=Sign In')
    
    // Fill in credentials (using test account)
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome')
  })

  test('protected routes redirect to sign in', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to sign in
    await expect(page).toHaveURL(/sign-in/)
  })
})
```

#### **e2e/resume-builder.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('Resume Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
  })

  test('user can create a new resume', async ({ page }) => {
    await page.goto('/resume')
    
    // Click create new resume
    await page.click('text=Create New Resume')
    
    // Fill in resume details
    await page.fill('[name="title"]', 'Software Engineer Resume')
    await page.fill('[name="summary"]', 'Experienced software engineer...')
    
    // Add work experience
    await page.click('text=Add Experience')
    await page.fill('[name="jobTitle"]', 'Software Engineer')
    await page.fill('[name="company"]', 'Tech Corp')
    await page.fill('[name="duration"]', '2020-2024')
    
    // Save resume
    await page.click('button[type="submit"]')
    
    // Should see success message
    await expect(page.locator('.success-message')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Software Engineer Resume')
  })

  test('resume preview updates in real-time', async ({ page }) => {
    await page.goto('/resume/new')
    
    // Fill in name
    await page.fill('[name="name"]', 'John Doe')
    
    // Check preview updates
    await expect(page.locator('.resume-preview')).toContainText('John Doe')
  })
})
```

#### **e2e/ai-features.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in and navigate to cover letter generator
    await page.goto('/sign-in')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
  })

  test('AI cover letter generation works', async ({ page }) => {
    await page.goto('/ai-cover-letter')
    
    // Input job description
    await page.fill('[name="jobDescription"]', 'Software Engineer position at Google')
    
    // Click generate
    await page.click('text=Generate Cover Letter')
    
    // Should show loading state
    await expect(page.locator('.loading-spinner')).toBeVisible()
    
    // Should show generated content
    await expect(page.locator('.cover-letter-content')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.cover-letter-content')).toContainText('Dear Hiring Manager')
  })

  test('handles AI service errors gracefully', async ({ page }) => {
    // Mock AI service to fail
    await page.route('**/api/ai/**', route => route.abort())
    
    await page.goto('/ai-cover-letter')
    await page.fill('[name="jobDescription"]', 'Test job description')
    await page.click('text=Generate Cover Letter')
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('AI service is temporarily unavailable')
  })
})
```

---

## 🎯 Testing Best Practices

### **1. Test Structure (AAA Pattern)**
```javascript
describe('Component/Function Name', () => {
  it('should do something when condition is met', () => {
    // Arrange
    const mockData = { id: 1, name: 'Test' }
    const mockCallback = jest.fn()
    
    // Act
    const result = processData(mockData, mockCallback)
    
    // Assert
    expect(result).toBe(expectedValue)
    expect(mockCallback).toHaveBeenCalledWith(mockData)
  })
})
```

### **2. Mock External Dependencies**
```javascript
// Mock AI service
jest.mock('@/lib/ai-service', () => ({
  generateContent: jest.fn().mockResolvedValue('Generated content'),
}))

// Mock database
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))
```

### **3. Test Data Management**
```javascript
// Test fixtures
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
}

const mockResume = {
  id: 'resume-1',
  userId: 'test-user-id',
  title: 'Software Engineer',
  content: 'Resume content',
}
```

### **4. Error Handling Tests**
```javascript
it('handles network errors gracefully', async () => {
  const mockError = new Error('Network error')
  mockApi.get.mockRejectedValue(mockError)
  
  const result = await fetchData()
  
  expect(result.error).toBe('Network error')
  expect(result.data).toBeNull()
})
```

---

## 📊 Test Coverage & Reporting

### **Coverage Configuration**
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'actions/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
}
```

### **NPM Scripts**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 🎪 Interview Questions About Testing

### Q: "How do you approach testing in React applications?"
**A**: "I follow the testing pyramid - lots of unit tests for individual components and functions, some integration tests for component interactions, and few but critical end-to-end tests for user workflows. I use React Testing Library for component testing because it encourages testing behavior rather than implementation details."

### Q: "How do you test Server Actions?"
**A**: "I test Server Actions by mocking the database operations and authentication. I verify that the correct data is passed to the database layer and that errors are handled gracefully. I also test the integration between the client components and server actions."

### Q: "What's your strategy for testing AI features?"
**A**: "For AI features, I mock the AI service responses to ensure consistent, fast tests. I test both success and failure scenarios, including rate limiting and service unavailability. I also test the user interface states like loading spinners and error messages."

### Q: "How do you handle flaky tests?"
**A**: "I prevent flaky tests by using proper waits instead of arbitrary timeouts, mocking external dependencies, and ensuring tests are isolated. For E2E tests, I use Playwright's built-in retry mechanism and proper selectors that aren't dependent on dynamic content."

---

## 🚀 Continuous Integration

### **GitHub Actions Example**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

This comprehensive testing strategy demonstrates your commitment to code quality and helps ensure the AI Career Coach application is robust, maintainable, and user-friendly!
