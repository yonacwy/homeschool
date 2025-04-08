import { prisma } from "~/db.server";
import type { Course } from "@prisma/client";

export async function getCourseListItems({ userId }: { userId: string }) {
  return prisma.course.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCourse({ id, userId }: { id: string; userId: string }) {
  return prisma.course.findFirst({
    where: { id, userId },
  });
}

export async function createCourse({
  title,
  description,
  userId,
  structure,
}: {
  title: string;
  description?: string;
  userId: string;
  structure?: string | null;
}): Promise<Course> {
  console.log("Creating course with:", { title, description, userId, structure });
  try {
    return await prisma.course.create({
      data: {
        title,
        description: description || "",
        userId,
        structure,
      },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    throw new Error(`Failed to create course: ${(error as Error).message}`);
  }
}

export async function updateCourse({
  id,
  title,
  description,
  structure, // Added structure parameter
  userId,
}: {
  id: string;
  title?: string;
  description?: string;
  structure?: string | null; // Optional, matches schema
  userId: string;
}) {
  console.log("Updating course with:", { id, title, description, structure, userId });
  try {
    return await prisma.course.update({
      where: { id_userId: { id, userId } },
      data: {
        title,
        description,
        structure, // Include structure in the update
      },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    throw new Error(`Failed to update course: ${(error as Error).message}`);
  }
}

export async function deleteCourse({ id, userId }: { id: string; userId: string }) {
  return prisma.course.delete({
    where: { id_userId: { id, userId } },
  });
}