"use server";

import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function saveResume(content) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Ensure user exists (using correct schema)
  let dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
  });

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        email: user.emailAddresses[0].emailAddress,
        firstName: user.firstName || "", // ✅ Use firstName
        lastName: user.lastName || "", // ✅ Use lastName
        imageUrl: user.imageUrl || "", // ✅ Add imageUrl
      },
    });
  }

  // Save or update resume
  const resume = await db.resume.upsert({
    where: { userId: dbUser.id },
    update: { content },
    create: {
      userId: dbUser.id,
      content,
    },
  });

  revalidatePath("/resume");
  return resume;
}

export async function getResume() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Ensure user exists
  let dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
    include: {
      resumes: true,
    },
  });

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        email: user.emailAddresses[0].emailAddress,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        imageUrl: user.imageUrl || "",
      },
    });
  }

  return dbUser.resumes?.[0] || null;
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}
