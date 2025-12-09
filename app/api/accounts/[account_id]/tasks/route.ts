import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type TaskPayload = {
  title: string
  assignee?: string
  dueDate?: string
  priority?: string
  status?: string
  description?: string
  tags?: string[]
}

function normalizeTask(task: any) {
  return {
    ...task,
    tags: task.tags ? (typeof task.tags === "string" ? JSON.parse(task.tags) : task.tags) : [],
  }
}

export async function GET(_req: Request, { params }: { params: { account_id: string } }) {
  try {
    const account = await prisma.account.findUnique({
      where: { account_id: params.account_id },
      select: { accountSeq: true },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const taskClient = (prisma as typeof prisma & { task: any }).task
    const tasks = (await taskClient.findMany({
      where: { accountSeq: account.accountSeq },
      orderBy: { createdAt: "desc" },
    })) as any[]

    return NextResponse.json(tasks.map(normalizeTask))
  } catch (error) {
    console.error("[tasks][GET]", error)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { account_id: string } }) {
  try {
    const body = (await req.json()) as TaskPayload
    if (!body?.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const account = await prisma.account.findUnique({
      where: { account_id: params.account_id },
      select: { accountSeq: true },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const taskClient = (prisma as typeof prisma & { task: any }).task

    const task = (await taskClient.create({
      data: {
        accountSeq: account.accountSeq,
        title: body.title.trim(),
        assignee: body.assignee?.trim() || null,
        dueDate: body.dueDate?.trim() || null,
        priority: body.priority || "Normal",
        status: body.status || "Todo",
        description: body.description?.trim() || null,
        tags: body.tags ? JSON.stringify(body.tags) : "[]",
      },
    })) as any

    return NextResponse.json(normalizeTask(task), { status: 201 })
  } catch (error) {
    console.error("[tasks][POST]", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { account_id: string } }) {
  try {
    const body = (await req.json()) as TaskPayload & { id: string }
    if (!body?.id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }
    if (!body?.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const account = await prisma.account.findUnique({
      where: { account_id: params.account_id },
      select: { accountSeq: true },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const taskClient = (prisma as typeof prisma & { task: any }).task

    // Check if task exists and belongs to this account
    const existingTask = await taskClient.findFirst({
      where: {
        id: body.id,
        accountSeq: account.accountSeq,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const task = (await taskClient.update({
      where: { id: body.id },
      data: {
        title: body.title.trim(),
        assignee: body.assignee?.trim() || null,
        dueDate: body.dueDate?.trim() || null,
        priority: body.priority || existingTask.priority,
        status: body.status || existingTask.status,
        description: body.description?.trim() || null,
        tags: body.tags ? JSON.stringify(body.tags) : existingTask.tags,
      },
    })) as any

    return NextResponse.json(normalizeTask(task))
  } catch (error) {
    console.error("[tasks][PUT]", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { account_id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("id")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const account = await prisma.account.findUnique({
      where: { account_id: params.account_id },
      select: { accountSeq: true },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const taskClient = (prisma as typeof prisma & { task: any }).task

    // Check if task exists and belongs to this account
    const existingTask = await taskClient.findFirst({
      where: {
        id: taskId,
        accountSeq: account.accountSeq,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await taskClient.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[tasks][DELETE]", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}

