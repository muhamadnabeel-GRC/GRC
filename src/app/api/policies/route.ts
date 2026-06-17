import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const policies = await prisma.policy.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(policies);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const policy = await prisma.policy.create({ data: body });
  return NextResponse.json(policy, { status: 201 });
}
