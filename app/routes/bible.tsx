import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import React, { useState } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  return json({ userId });
};

export default function BiblePage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Main container with padding-top to account for header */}
      <main className="flex-1 flex flex-col md:flex-row-reverse h-full bg-white" style={{ paddingTop: '64px' }}>
        {/* Hamburger menu button for mobile only, positioned below header on the right, hides when sidebar is open */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed top-16 right-4 z-50 p-4 text-blue-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        )}

        {/* Sidebar for Bible sections - hidden on mobile by default, fixed width on desktop, now on the right */}
        <div className={`
          fixed inset-y-0 right-0 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          md:relative md:translate-x-0 md:flex md:w-80 md:border-l md:bg-gray-50 md:shadow
          transition-transform duration-300 ease-in-out z-40
          h-full
        `} style={{ top: '64px', boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)' }}>
          <div className="h-full w-full overflow-y-auto">
            <hr />

            <ol>
              <li>
                <NavLink
                  className={({ isActive }) =>
                    `block border-b p-4 text-xl ${isActive ? "bg-white border-r-4 border-blue-500" : ""}`
                  }
                  to="old-testament"
                >
                  📖 Old Testament
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={({ isActive }) =>
                    `block border-b p-4 text-xl ${isActive ? "bg-white border-r-4 border-blue-500" : ""}`
                  }
                  to="new-testament"
                >
                  📖 New Testament
                </NavLink>
              </li>
            </ol>
          </div>

          {/* Close button for mobile sidebar - now on the right when sidebar is open */}
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Overlay for mobile when sidebar is open - now covers left side */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 md:hidden z-30"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main content area - adjusts for sidebar width on desktop, now on the left */}
        <div className="flex-1 p-6" style={{ marginRight: '320px', transition: 'margin-right 300ms ease-in-out' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}