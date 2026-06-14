import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("avatar") as File | null;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Use JPG, PNG, WebP or GIF." }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split(".").pop() || "jpg";
        const userId = (session.user as any).id || session.user.email?.replace(/[^a-z0-9]/gi, "") || "user";
        const fileName = `avatar-${userId}.${ext}`;

        const avatarsDir = join(process.cwd(), "public", "avatars");
        await mkdir(avatarsDir, { recursive: true });
        await writeFile(join(avatarsDir, fileName), buffer);

        return NextResponse.json({ success: true, avatarUrl: `/avatars/${fileName}` });
    } catch (err: any) {
        console.error("Avatar upload error:", err);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}