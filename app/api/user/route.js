import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user exists
    let dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id }
    });

    // Create user if doesn't exist (using correct schema fields)
    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          clerkUserId: user.id,
          email: user.emailAddresses[0].emailAddress,
          firstName: user.firstName || "",  // ✅ Use firstName
          lastName: user.lastName || "",    // ✅ Use lastName
          imageUrl: user.imageUrl || "",    // ✅ Add imageUrl
        }
      });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}