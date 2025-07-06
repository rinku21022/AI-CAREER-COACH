"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry) => {
  try {
    const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    
    const insights = JSON.parse(cleanedText);
    
    // Convert arrays and objects to strings for SQLite compatibility
    return {
      salaryRangesJson: JSON.stringify(insights.salaryRanges),
      growthRate: insights.growthRate,
      demandLevel: insights.demandLevel,
      topSkillsString: insights.topSkills.join(','),
      marketOutlook: insights.marketOutlook,
      keyTrendsString: insights.keyTrends.join(','),
      recommendedSkillsString: insights.recommendedSkills.join(',')
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    // Return fallback data if AI generation fails
    return {
      salaryRangesJson: JSON.stringify([
        { role: "Entry Level", min: 40000, max: 60000, median: 50000, location: "Remote" },
        { role: "Mid Level", min: 60000, max: 90000, median: 75000, location: "Remote" },
        { role: "Senior Level", min: 90000, max: 130000, median: 110000, location: "Remote" },
        { role: "Manager", min: 100000, max: 150000, median: 125000, location: "Remote" },
        { role: "Director", min: 130000, max: 200000, median: 165000, location: "Remote" }
      ]),
      growthRate: 5.0,
      demandLevel: "Medium",
      topSkillsString: "Skill 1,Skill 2,Skill 3,Skill 4,Skill 5",
      marketOutlook: "Neutral",
      keyTrendsString: "Trend 1,Trend 2,Trend 3,Trend 4,Trend 5",
      recommendedSkillsString: "Recommended 1,Recommended 2,Recommended 3,Recommended 4,Recommended 5"
    };
  }
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  
  if (!user.industry) {
    throw new Error("User has not set an industry");
  }

  // Find or create industry insights
  let industryInsight = await db.industryInsight.findFirst({
    where: { industry: user.industry },
  });

  // If no insights exist, generate them
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

  // Transform data back into the format expected by the component
  return {
    ...industryInsight,
    salaryRanges: JSON.parse(industryInsight.salaryRangesJson || '[]'),
    topSkills: industryInsight.topSkillsString ? industryInsight.topSkillsString.split(',') : [],
    keyTrends: industryInsight.keyTrendsString ? industryInsight.keyTrendsString.split(',') : [],
    recommendedSkills: industryInsight.recommendedSkillsString ? industryInsight.recommendedSkillsString.split(',') : []
  };
}
