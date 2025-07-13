"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skillsString: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
Generate 10 technical interview questions for a ${user.industry} professional${
    user.skillsString ? ` with expertise in ${user.skillsString}` : ""
  }.

Each question should be multiple choice with 4 options.

Return ONLY valid JSON in the following format — no markdown, no extra explanation:

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

  try {
    const result = await model.generateContent(prompt);
    const rawText = await result.response.text();

    // Remove ```json ... ``` markdown blocks if they exist
    const cleaned = rawText
      .replace(/^```json/gm, "")
      .replace(/^```/gm, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format from LLM.");
    }

    return parsed.questions;
  } catch (error) {
    console.error("❌ Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
The user got the following ${user.industry} technical interview questions wrong:

${wrongQuestionsText}

Based on these mistakes, provide a short, specific improvement tip.
Don't mention the mistakes. Focus on the topic or skill to improve.
Keep it under 2 sentences and be encouraging.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);
      improvementTip = tipResult.response.text().trim();
    } catch (error) {
      console.error("⚠️ Failed to generate improvement tip:", error);
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        score: score,
        totalQuestions: questions.length,
        correctAnswers: score,
        results: questionResults,
        category: "Technical",
        improvementTip,
        type: "QUIZ",
      },
    });

    return assessment;
  } catch (error) {
    console.error("❌ Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return assessments.map((assessment) => ({
      ...assessment,
      quizScore: assessment.score ?? 0,
      questions: assessment.results || [],
    }));
  } catch (error) {
    console.error("❌ Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}
