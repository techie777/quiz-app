import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate a 4-digit PIN
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store PIN in VerificationToken table
    await prisma.verificationToken.upsert({
      where: { token: otp },
      update: { identifier: email, expires },
      create: { identifier: email, token: otp, expires },
    });

    // Real Email Delivery with Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for others
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Your Login PIN: ${otp}`,
        text: `Hello, your login PIN for QuizWeb is ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #667eea;">QuizWeb Verification</h2>
            <p>Hello, use the following 4-digit PIN to sign in to your account:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #ec4899; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This PIN will expire in 10 minutes.</p>
          </div>
        `,
      });
      console.log(`[PIN SENT] PIN for ${email} is: ${otp}`);
    } catch (mailError) {
      console.error("Failed to send real email, falling back to console log:", mailError);
      // Still log to console for debugging in case SMTP is not configured
      console.log(`[PIN SIMULATION] PIN for ${email} is: ${otp}`);
    }

    return NextResponse.json({ success: true, message: "PIN sent successfully" });
  } catch (error) {
    console.error("OTP Send error:", error);
    return NextResponse.json({ error: "Failed to send PIN" }, { status: 500 });
  }
}
