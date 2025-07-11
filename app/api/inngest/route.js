import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// Import functions
import { generateIndustryInsights } from "@/lib/inngest/function";

// Serve Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateIndustryInsights,
  ],
  // Optional: Add middleware for error handling
  middleware: [],
});