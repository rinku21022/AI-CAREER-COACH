import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";
import { redirect } from "next/navigation";

export default async function ResumePage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  try {
    // Ensure user exists in database (using correct schema)
    let dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id }
    });

    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          email: user.emailAddresses[0].emailAddress,
          firstName: user.firstName || "",  // ✅ Correct field
          lastName: user.lastName || "",    // ✅ Correct field
          imageUrl: user.imageUrl || "",    // ✅ Add this
        }
      });
    }

    const resume = await getResume();
    
    return <ResumeBuilder initialContent={resume?.content || ""} />;
  } catch (error) {
    console.error("Resume page error:", error);
    return <div>Error loading resume. Please try again.</div>;
  }
}
