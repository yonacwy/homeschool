import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { getCourse, updateCourse, deleteCourse } from "~/models/course.server"; // Import deleteCourse
import React from 'react';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  if (!params.courseId) {
    throw new Response("Course ID is required", { status: 400 });
  }

  const course = await getCourse({ id: params.courseId, userId });
  if (!course) {
    throw new Response("Course not found", { status: 404 });
  }

  return json({ course });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  if (!params.courseId) {
    return json({ error: "Course ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "update") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;

    if (!title) {
      return json({ error: "Title is required" }, { status: 400 });
    }

    try {
      await updateCourse({ id: params.courseId, title, description: description || "", userId });
      return redirect(`/courses/${params.courseId}`);
    } catch (error) {
      return json({ error: "Failed to update course" }, { status: 500 });
    }
  } else if (intent === "delete") {
    try {
      await deleteCourse({ id: params.courseId, userId }); // Now this should work
      return redirect("/courses");
    } catch (error) {
      return json({ error: "Failed to delete course" }, { status: 500 });
    }
  }

  return null;
};

export default function CoursePage() {
  const { course } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-4">Course: {course.title}</h1>
      <Form method="post" className="space-y-4 max-w-md">
        <input type="hidden" name="_intent" value="update" />
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={course.title}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={course.description || ""}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>

        {actionData?.error && (
          <p className="text-red-500 text-sm">{actionData.error}</p>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={navigation.state === "submitting"}
            className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {navigation.state === "submitting" ? "Saving..." : "Save Changes"}
          </button>

          <Form method="post" onSubmit={(event) => {
            if (!confirm("Are you sure you want to delete this course?")) {
              event.preventDefault();
            }
          }}>
            <input type="hidden" name="_intent" value="delete" />
            <button
              type="submit"
              className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Course
            </button>
          </Form>
        </div>
      </Form>
    </div>
  );
}