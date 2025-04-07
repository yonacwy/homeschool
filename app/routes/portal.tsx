import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { prisma } from "~/db.server"; // Import Prisma client
import React from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const noteCount = await prisma.note.count({ where: { userId } });
  const courseCount = await prisma.course.count({ where: { userId } });
  return json({ userId, noteCount, courseCount });
};

export default function PortalPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <main className="flex-1 flex flex-col bg-white" style={{ paddingTop: '64px' }}>
        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ marginTop: '64px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Access Cards */}
            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Recent Bible Readings</h3>
              <p className="text-gray-600">View your latest Bible chapters and verses.</p>
              <Link to="/bible" className="text-blue-500 hover:text-blue-700 mt-2 block">
                Go to Bible →
              </Link>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Recent Notes</h3>
              <p className="text-gray-600">Check your most recent notes.</p>
              <Link to="/notes" className="text-blue-500 hover:text-blue-700 mt-2 block">
                Go to Notes →
              </Link>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Active Courses</h3>
              <p className="text-gray-600">Manage your current courses.</p>
              <Link to="/courses" className="text-blue-500 hover:text-blue-700 mt-2 block">
                Go to Courses →
              </Link>
            </div>

            {/* Stats or Metrics Card */}
            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow col-span-1 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold mb-2">Dashboard Overview</h3>
              <p className="text-gray-600">Track your progress and activity across all tools.</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-100 p-3 rounded">
                  <p className="text-sm text-gray-500">Total Notes</p>
                  <p className="text-lg font-bold">{data.noteCount}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <p className="text-sm text-gray-500">Courses Enrolled</p>
                  <p className="text-lg font-bold">{data.courseCount}</p>
                </div>
              </div>
            </div>
          </div>
          <Outlet /> {/* Renders nested routes if any */}
        </div>
      </main>
    </div>
  );
}