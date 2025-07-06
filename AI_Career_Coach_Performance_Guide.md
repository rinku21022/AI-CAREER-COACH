# ⚡ AI Career Coach - Performance Optimization Guide

## 🎯 Performance Philosophy

Performance is not just about speed - it's about providing an exceptional user experience. For the AI Career Coach application, performance optimization focuses on:

- **Fast Initial Load**: Users see content quickly
- **Smooth Interactions**: UI remains responsive during operations
- **Efficient Data Loading**: Only fetch what's needed
- **Smart Caching**: Reduce redundant requests
- **Optimized Assets**: Minimal bundle sizes

---

## 📊 Performance Metrics & Targets

### **Core Web Vitals**
```
🎯 Target Scores:
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- First Contentful Paint (FCP): < 1.8s
- Time to Interactive (TTI): < 3.5s
```

### **Application-Specific Metrics**
```
🎯 Performance Targets:
- Initial Page Load: < 3 seconds
- AI Response Time: < 10 seconds
- Database Queries: < 200ms
- Bundle Size: < 500KB (gzipped)
- Image Loading: < 1 second
```

---

## 🚀 Next.js Optimizations

### **1. App Router Benefits**
```javascript
// app/layout.js - Root Layout with optimizations
import { Inter } from 'next/font/google'
import './globals.css'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevents layout shift
  preload: true
})

export const metadata = {
  title: 'AI Career Coach',
  description: 'AI-powered career development platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

### **2. Server Components (Default)**
```javascript
// app/(main)/dashboard/page.jsx
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import DashboardClient from './_components/dashboard-client'

// Server Component - runs on server, reduces client bundle
export default async function DashboardPage() {
  const { userId } = auth()
  
  // Fetch data on server
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true,
      // Only select needed fields
    }
  })
  
  const recentResumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5, // Limit results
    select: {
      id: true,
      title: true,
      updatedAt: true,
      // Minimal fields for list view
    }
  })
  
  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <DashboardClient 
        user={user} 
        recentResumes={recentResumes} 
      />
    </div>
  )
}
```

### **3. Smart Loading Strategies**
```javascript
// app/(main)/resume/page.jsx
import { Suspense } from 'react'
import ResumeList from './_components/resume-list'
import ResumeListSkeleton from './_components/resume-list-skeleton'

export default function ResumePage() {
  return (
    <div>
      <h1>My Resumes</h1>
      
      {/* Progressive loading with Suspense */}
      <Suspense fallback={<ResumeListSkeleton />}>
        <ResumeList />
      </Suspense>
    </div>
  )
}
```

### **4. Image Optimization**
```javascript
// components/ui/optimized-image.jsx
import Image from 'next/image'

export default function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      quality={85}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        width: '100%',
        height: 'auto',
      }}
      {...props}
    />
  )
}
```

---

## 🔧 Database Optimization

### **1. Efficient Prisma Queries**
```javascript
// actions/dashboard.js
import { prisma } from '@/lib/prisma'

export async function getDashboardData(userId) {
  // Single query with includes instead of multiple queries
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resumes: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          updatedAt: true,
          // Only fetch necessary fields
        }
      },
      coverLetters: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          jobTitle: true,
          company: true,
          createdAt: true,
        }
      },
      interviews: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          type: true,
          score: true,
          createdAt: true,
        }
      }
    }
  })
  
  return userData
}
```

### **2. Database Indexing Strategy**
```sql
-- prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  
  // Indexed fields for common queries
  resumes      Resume[]
  coverLetters CoverLetter[]
  interviews   Interview[]
  
  @@index([email])
  @@index([createdAt])
}

model Resume {
  id        String   @id @default(cuid())
  userId    String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  // Composite index for user's resumes ordered by date
  @@index([userId, updatedAt])
}
```

### **3. Connection Pooling**
```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Connection pooling configuration
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Optimize connection pool
export const prismaOptimized = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=20&pgbouncer=true`,
    },
  },
})
```

---

## 🎨 Frontend Performance

### **1. Code Splitting & Lazy Loading**
```javascript
// app/(main)/interview/page.jsx
import { lazy, Suspense } from 'react'
import LoadingSpinner from '@/components/ui/loading-spinner'

// Lazy load heavy components
const InterviewQuiz = lazy(() => import('./_components/interview-quiz'))
const PerformanceChart = lazy(() => import('./_components/performance-chart'))

export default function InterviewPage() {
  return (
    <div>
      <h1>Interview Preparation</h1>
      
      <Suspense fallback={<LoadingSpinner />}>
        <InterviewQuiz />
      </Suspense>
      
      <Suspense fallback={<div>Loading charts...</div>}>
        <PerformanceChart />
      </Suspense>
    </div>
  )
}
```

### **2. Optimized Bundle Analysis**
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    return config
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['prisma'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression
  compress: true,
}

export default nextConfig
```

### **3. Asset Optimization**
```javascript
// components/ui/icon-sprite.jsx
// Use SVG sprites for icons instead of individual files
export const IconSprite = () => (
  <svg style={{ display: 'none' }}>
    <defs>
      <symbol id="icon-resume" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </symbol>
      <symbol id="icon-cover-letter" viewBox="0 0 24 24">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <path d="M22 6l-10 7L2 6" />
      </symbol>
    </defs>
  </svg>
)

// Use the sprite
export const ResumeIcon = ({ className }) => (
  <svg className={className}>
    <use href="#icon-resume" />
  </svg>
)
```

---

## 🔄 Caching Strategies

### **1. Server-Side Caching**
```javascript
// app/(main)/dashboard/page.jsx
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Cache dashboard data for 5 minutes
const getCachedDashboardData = unstable_cache(
  async (userId) => {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        resumes: {
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
      },
    })
    return userData
  },
  ['dashboard-data'],
  { revalidate: 300 } // 5 minutes
)

// React cache for request deduplication
const getDashboardData = cache(async (userId) => {
  return await getCachedDashboardData(userId)
})
```

### **2. Client-Side Caching**
```javascript
// hooks/use-cached-data.js
import { useState, useEffect } from 'react'

export function useCachedData(key, fetcher, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { cacheTime = 5 * 60 * 1000 } = options // 5 minutes default
  
  useEffect(() => {
    const cachedData = localStorage.getItem(key)
    const cachedTime = localStorage.getItem(`${key}_timestamp`)
    
    const isStale = cachedTime && 
      Date.now() - parseInt(cachedTime) > cacheTime
    
    if (cachedData && !isStale) {
      setData(JSON.parse(cachedData))
      setLoading(false)
      return
    }
    
    // Fetch fresh data
    fetcher()
      .then(result => {
        setData(result)
        localStorage.setItem(key, JSON.stringify(result))
        localStorage.setItem(`${key}_timestamp`, Date.now().toString())
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [key, fetcher, cacheTime])
  
  return { data, loading, error }
}
```

### **3. Background Sync**
```javascript
// lib/background-sync.js
export class BackgroundSync {
  constructor() {
    this.syncQueue = []
    this.isOnline = navigator.onLine
    
    window.addEventListener('online', this.processSyncQueue.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }
  
  async addToQueue(action, data) {
    this.syncQueue.push({ action, data, timestamp: Date.now() })
    
    if (this.isOnline) {
      await this.processSyncQueue()
    }
  }
  
  async processSyncQueue() {
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift()
      
      try {
        await this.executeAction(item.action, item.data)
      } catch (error) {
        // Re-queue failed items
        this.syncQueue.unshift(item)
        console.error('Sync failed:', error)
        break
      }
    }
  }
  
  async executeAction(action, data) {
    switch (action) {
      case 'createResume':
        return await fetch('/api/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      // Add other actions
    }
  }
}
```

---

## 🤖 AI Performance Optimization

### **1. Request Batching**
```javascript
// lib/ai-batch-processor.js
class AIBatchProcessor {
  constructor() {
    this.requestQueue = []
    this.batchSize = 5
    this.batchTimeout = 1000 // 1 second
    this.processingBatch = false
  }
  
  async addRequest(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ prompt, options, resolve, reject })
      
      if (!this.processingBatch) {
        this.scheduleBatchProcess()
      }
    })
  }
  
  scheduleBatchProcess() {
    this.processingBatch = true
    
    setTimeout(() => {
      this.processBatch()
    }, this.batchTimeout)
  }
  
  async processBatch() {
    const batch = this.requestQueue.splice(0, this.batchSize)
    
    if (batch.length === 0) {
      this.processingBatch = false
      return
    }
    
    try {
      const results = await Promise.all(
        batch.map(item => this.processAIRequest(item.prompt, item.options))
      )
      
      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      batch.forEach(item => item.reject(error))
    }
    
    // Continue processing if there are more requests
    if (this.requestQueue.length > 0) {
      this.scheduleBatchProcess()
    } else {
      this.processingBatch = false
    }
  }
  
  async processAIRequest(prompt, options) {
    // Actual AI API call
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, ...options })
    })
    
    return response.json()
  }
}

export const aiBatchProcessor = new AIBatchProcessor()
```

### **2. AI Response Caching**
```javascript
// lib/ai-cache.js
import { LRUCache } from 'lru-cache'

const aiCache = new LRUCache({
  max: 1000, // Maximum 1000 cached responses
  ttl: 1000 * 60 * 60 * 24, // 24 hours
  updateAgeOnGet: true,
})

export async function getCachedAIResponse(prompt, options = {}) {
  const cacheKey = `ai_${hashString(prompt)}_${JSON.stringify(options)}`
  
  // Check cache first
  const cached = aiCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Generate new response
  const response = await generateAIContent(prompt, options)
  
  // Cache the response
  aiCache.set(cacheKey, response)
  
  return response
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}
```

### **3. Progressive AI Enhancement**
```javascript
// components/ai-cover-letter-generator.jsx
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

export default function AICoverLetterGenerator() {
  const [jobDescription, setJobDescription] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  
  // Debounce input to avoid too many API calls
  const debouncedJobDescription = useDebounce(jobDescription, 500)
  
  // Generate suggestions as user types
  useEffect(() => {
    if (debouncedJobDescription && debouncedJobDescription.length > 50) {
      generateSuggestions(debouncedJobDescription)
    }
  }, [debouncedJobDescription])
  
  const generateSuggestions = async (description) => {
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobDescription: description,
          type: 'cover-letter-hints'
        })
      })
      
      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    }
  }
  
  const generateFullCoverLetter = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription })
      })
      
      const data = await response.json()
      setCoverLetter(data.coverLetter)
    } catch (error) {
      console.error('Failed to generate cover letter:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="job-description">Job Description</label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          rows={6}
        />
        
        {/* Progressive enhancement - show suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 rounded">
            <p className="text-sm font-medium text-blue-900">
              AI Suggestions:
            </p>
            <ul className="mt-1 text-sm text-blue-800">
              {suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <button
        onClick={generateFullCoverLetter}
        disabled={isGenerating || !jobDescription}
        className="btn btn-primary"
      >
        {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
      </button>
      
      {coverLetter && (
        <div className="mt-4">
          <h3>Generated Cover Letter</h3>
          <div className="p-4 bg-gray-50 rounded">
            <pre className="whitespace-pre-wrap">{coverLetter}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 📊 Performance Monitoring

### **1. Real User Monitoring**
```javascript
// lib/performance-monitor.js
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.setupPerformanceObserver()
  }
  
  setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('LCP', entry.startTime)
          }
          
          if (entry.entryType === 'first-input') {
            this.recordMetric('FID', entry.processingStart - entry.startTime)
          }
          
          if (entry.entryType === 'layout-shift') {
            if (!entry.hadRecentInput) {
              this.recordMetric('CLS', entry.value)
            }
          }
        })
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    }
  }
  
  recordMetric(name, value) {
    this.metrics.set(name, value)
    
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        page_title: document.title,
        page_location: window.location.href
      })
    }
  }
  
  // Custom timing for AI operations
  async measureAIOperation(operation, promise) {
    const startTime = performance.now()
    
    try {
      const result = await promise
      const endTime = performance.now()
      
      this.recordMetric(`AI_${operation}`, endTime - startTime)
      return result
    } catch (error) {
      const endTime = performance.now()
      this.recordMetric(`AI_${operation}_ERROR`, endTime - startTime)
      throw error
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### **2. Database Query Monitoring**
```javascript
// lib/db-monitor.js
import { prisma } from './prisma'

export function withQueryMonitoring(prismaClient) {
  return prismaClient.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        const startTime = Date.now()
        
        return query(args).then(result => {
          const endTime = Date.now()
          const duration = endTime - startTime
          
          // Log slow queries
          if (duration > 100) {
            console.warn(`Slow query detected: ${model}.${operation} took ${duration}ms`)
          }
          
          // Send to monitoring service
          if (process.env.NODE_ENV === 'production') {
            // Send to your monitoring service
            console.log(`Query: ${model}.${operation}, Duration: ${duration}ms`)
          }
          
          return result
        })
      }
    }
  })
}

export const monitoredPrisma = withQueryMonitoring(prisma)
```

---

## 🎯 Performance Testing

### **1. Load Testing Script**
```javascript
// scripts/load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 20 },  // Ramp up to 20 users
    { duration: '5m', target: 20 },  // Stay at 20 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
}

export default function() {
  // Test landing page
  let response = http.get('https://your-app.vercel.app/')
  check(response, {
    'landing page loads': (r) => r.status === 200,
    'landing page fast': (r) => r.timings.duration < 1000,
  })
  
  // Test dashboard (authenticated)
  response = http.get('https://your-app.vercel.app/dashboard', {
    headers: { 'Authorization': 'Bearer your-test-token' }
  })
  check(response, {
    'dashboard loads': (r) => r.status === 200,
    'dashboard fast': (r) => r.timings.duration < 2000,
  })
  
  sleep(1)
}
```

### **2. Lighthouse CI Configuration**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli@0.12.x
        lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## 🏆 Performance Best Practices

### **1. Bundle Optimization**
```javascript
// Analyze bundle size
npm run build
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build

// Tree shaking - import only what you need
import { Button } from '@/components/ui/button'  // ✅ Good
import * as UI from '@/components/ui'           // ❌ Bad

// Use dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
})
```

### **2. Memory Management**
```javascript
// Clean up event listeners
useEffect(() => {
  const handleScroll = () => {
    // Handle scroll
  }
  
  window.addEventListener('scroll', handleScroll)
  
  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}, [])

// Cleanup timers
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000)
  
  return () => clearInterval(timer)
}, [])
```

### **3. Render Optimization**
```javascript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data)
}, [data])

// Memoize components
const MemoizedComponent = memo(({ data }) => {
  return <div>{data}</div>
})

// Use callback for event handlers
const handleClick = useCallback(() => {
  // Handle click
}, [dependency])
```

---

## 🎯 Interview Questions About Performance

### Q: "How do you optimize a slow-loading React application?"
**A**: "I follow a systematic approach:
1. **Measure first** - Use React DevTools Profiler and Lighthouse
2. **Code splitting** - Dynamic imports and lazy loading
3. **Optimize images** - Next.js Image component with proper formats
4. **Reduce bundle size** - Tree shaking, analyze bundle
5. **Database optimization** - Efficient queries, indexing
6. **Caching** - Server-side and client-side caching
7. **Server Components** - Reduce client-side JavaScript"

### Q: "What's your approach to AI performance optimization?"
**A**: "For AI features, I focus on:
1. **Caching responses** - Avoid duplicate API calls
2. **Background processing** - Use Inngest for non-blocking operations
3. **Progressive enhancement** - Show suggestions while typing
4. **Request batching** - Group similar requests
5. **Fallback strategies** - Graceful degradation when AI is slow
6. **Monitoring** - Track AI response times and errors"

### Q: "How do you handle database performance?"
**A**: "I optimize database performance through:
1. **Proper indexing** - Index frequently queried fields
2. **Query optimization** - Select only needed fields
3. **Connection pooling** - Efficient database connections
4. **Caching** - Cache frequent queries
5. **Pagination** - Limit result sets
6. **Monitoring** - Track slow queries and optimize them"

This performance guide demonstrates your understanding of modern web performance principles and shows you can build scalable, fast applications!
