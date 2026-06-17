import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const controls = await prisma.control.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(controls);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const control = await prisma.control.create({ data: body });
  return NextResponse.json(control, { status: 201 });
}
