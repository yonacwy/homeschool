import { prisma } from "~/db.server";

export async function getCourseListItems({ userId }: { userId: string }) {
  return prisma.course.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
    },
    orderBy: { updatedAt: "desc" }, // Order by most recently updated
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
}: {
  title: string;
  description?: string;
  userId: string;
}) {
  return prisma.course.create({
    data: {
      title,
      description: description || "",
      userId,
    },
  });
}

export async function updateCourse({
  id,
  title,
  description,
  userId,
}: {
  id: string;
  title?: string;
  description?: string;
  userId: string;
}) {
  return prisma.course.update({
    where: { id_userId: { id, userId } },
    data: {
      title,
      description,
    },
  });
}

export async function deleteCourse({ id, userId }: { id: string; userId: string }) {
  return prisma.course.delete({
    where: { id_userId: { id, userId } },
  });
}