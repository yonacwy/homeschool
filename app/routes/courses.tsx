import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { getCourseListItems } from "~/models/course.server";
import React, { useState } from 'react';

// Define type for list items
type CourseListItem = { id: string; title: string; description: string | null };
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const courses = await getCourseListItems({ userId }); // Assuming this function exists
  return json({ courses });
};

export default function CoursesPage() {
  const { courses } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Main container with padding-top to account for header */}
      <main className="flex-1 flex flex-col h-full bg-white" style={{ paddingTop: '64px' }}>
        {/* Picker container fixed below header, ensuring it doesn't overlap nav drawer */}
        <div className="fixed top-16 left-0 right-0 bg-white shadow-md z-30 p-4 border-b" style={{ zIndex: 30 }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Course Selector (Picker) */}
            <select 
              className="w-full md:w-auto p-2 border rounded"
              onChange={(e) => {
                const courseId = e.target.value;
                if (courseId) {
                  window.location.href = `/courses/${courseId}`; // Navigate to the selected course
                }
              }}
            >
              <option value="">Select a Course</option>
              {courses.map((course: CourseListItem) => (
                <option key={course.id} value={course.id}>
                  📚 {course.title}
                </option>
              ))}
            </select>

            {/* New Course Link as a Button */}
            <Link to="new" className="w-full md:w-auto p-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
              + New Course
            </Link>
          </div>
        </div>

        {/* Main content area - adjusts for picker height, displays courses */}
        <div className="flex-1 p-4 md:p-6" style={{ paddingTop: '120px' }}> {/* Increased padding to account for picker */}
          <h1 className="text-2xl font-bold mb-4">Courses</h1>
          <div className="prose max-w-none">
            {courses.length > 0 ? ( // Explicitly type 'course' here as well
              courses.map((course: CourseListItem) => (
                <div key={course.id} className="mb-4 p-4 bg-gray-50 rounded-lg shadow">
                  <h2 className="text-xl font-semibold">{course.title}</h2>
                  <p className="text-gray-700">{course.description || "No description available."}</p>
                </div>
              ))
            ) : (
              <p>No courses available. Create a new course to get started!</p>
            )}
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}