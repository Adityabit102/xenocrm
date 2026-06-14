import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
        }

        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await db.user.create({
            data: { name: name.trim(), email: email.trim().toLowerCase(), password: hashed },
        });

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
    } catch (err: any) {
        console.error("Signup error:", err);
        return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
    }
}