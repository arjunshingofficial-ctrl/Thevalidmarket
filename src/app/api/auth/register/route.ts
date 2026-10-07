import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUserNotification, createAdminNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, referralCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 400 }
      );
    }

    // Validate referral code if provided
    let referrerUserId = null;
    if (referralCode) {
      const ref = await prisma.referralCode.findUnique({
        where: { code: referralCode.toUpperCase() }
      });
      if (!ref) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 400 }
        );
      }
      referrerUserId = ref.userId;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Fetch the CUSTOMER role ID
    let customerRole = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
    
    // Fallback if roles aren't seeded yet
    if (!customerRole) {
      customerRole = await prisma.role.create({ data: { name: "CUSTOMER" } });
    }

    // Create user securely (connect to CUSTOMER role)
    // Generate a unique 8-digit account ID safely
    let accountId = "";
    let user = null;
    let attempts = 0;
    
    while (!user && attempts < 10) {
      attempts++;
      accountId = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      try {
        user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            accountId,
            role: {
              connect: { id: customerRole.id }
            },
          },
        });
      } catch (err: any) {
        if (err.code === "P2002" && err.meta?.target?.includes("accountId")) {
          // Collision on accountId, try again
          continue;
        }
        throw err;
      }
    }

    if (!user) {
      throw new Error("Failed to generate a unique User ID after multiple attempts.");
    }

    // Create referral relationship if valid
    if (referrerUserId) {
      await prisma.referral.create({
        data: {
          referrerId: referrerUserId,
          referredId: user.id
        }
      });
    }

    // Generate own referral code
    const baseCode = name.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    let newCode = `${baseCode}${randomSuffix}`;
    
    // Quick fallback just in case of collision
    try {
      await prisma.referralCode.create({
        data: {
          userId: user.id,
          code: newCode
        }
      });
    } catch(e) {
      // Unlikely collision, just fallback to user ID part
      await prisma.referralCode.create({
        data: {
          userId: user.id,
          code: `REF${user.id.substring(user.id.length - 6).toUpperCase()}`
        }
      });
    }

    // Strip password hash from response
    const { password: _, ...userWithoutPassword } = user;

    // Trigger Notifications (Fire and forget to not block registration response)
    Promise.all([
      createUserNotification({
        userId: user.id,
        type: "ACCOUNT",
        title: "Welcome to Asia D Market",
        message: "Your account has been created successfully.",
        priority: "NORMAL",
        actionUrl: "/dashboard",
      }),
      createAdminNotification({
        type: "ACCOUNT",
        title: "New User Registered",
        message: `${name} (${email}) has joined the platform.`,
        priority: "NORMAL",
        actionUrl: "/admin/staff",
      })
    ]).catch(err => console.error("Notification trigger failed", err));

    return NextResponse.json(
      { success: true, user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
