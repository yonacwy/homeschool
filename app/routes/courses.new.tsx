import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { createCourse } from "~/models/course.server";
import React from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;

  if (!title) {
    return json({ error: "Title is required" }, { status: 400 });
  }

  try {
    await createCourse({ title, description: description || "", userId });
    return redirect("/courses");
  } catch (error) {
    return json({ error: "Failed to create course" }, { status: 500 });
  }
};

export default function NewCoursePage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-4">New Course</h1>
      <Form method="post" className="space-y-4 max-w-md">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            defaultValue=""
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            defaultValue=""
          />
        </div>

        {actionData?.error && (
          <p className="text-red-500 text-sm">{actionData.error}</p>
        )}

        <button
          type="submit"
          disabled={navigation.state === "submitting"}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {navigation.state === "submitting" ? "Creating..." : "Create Course"}
        </button>
      </Form>
    </div>
  );
}