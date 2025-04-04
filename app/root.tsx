import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  Form,
  useLoaderData,
} from "@remix-run/react";

import { getUser } from "~/session.server";
import stylesheet from "~/tailwind.css";
import React, { useState } from 'react';

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ user: await getUser(request) });
};

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const data = useLoaderData<typeof loader>();
  const user = data.user;

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <header className="fixed top-0 left-0 right-0 flex items-center justify-between bg-slate-800 p-4 text-white z-50 shadow-md">
          <div className="flex items-center">
            <button onClick={() => setDrawerOpen(!drawerOpen)} className="text-white hover:text-gray-300 focus:outline-none mr-4">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold">
              <Link to="/">Home</Link>
            </h1>
          </div>
          <div className="relative">
            <button 
              onClick={() => setProfilePopupOpen(!profilePopupOpen)}
              className="text-white hover:text-gray-300 focus:outline-none"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </button>

            {profilePopupOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-60">
                <div className="px-4 py-2 text-sm text-gray-700">
                  Signed in as: {user?.email}
                </div>
                <Link 
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setProfilePopupOpen(false)}
                >
                  Profile
                </Link>
                <Link 
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setProfilePopupOpen(false)}
                >
                  Settings
                </Link>
                <Form action="/logout" method="post" className="mt-2">
                  <button
                    type="submit"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </Form>
              </div>
            )}
          </div>
        </header>

        <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md p-4 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 z-40`} style={{ marginTop: '64px' }}>
          <button onClick={() => setDrawerOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 focus:outline-none">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <h2 className="font-bold mb-4">Navigation</h2>
          <ul>
            <li className="mb-2"><Link to="/portal" className="block py-2 px-4 hover:bg-gray-100" onClick={() => setDrawerOpen(false)}>Portal</Link></li>
            <li className="mb-2"><Link to="/bible" className="block py-2 px-4 hover:bg-gray-100" onClick={() => setDrawerOpen(false)}>Bible</Link></li>
            <li className="mb-2"><Link to="/notes" className="block py-2 px-4 hover:bg-gray-100" onClick={() => setDrawerOpen(false)}>Notes</Link></li>
          </ul>
        </div>

        <div className="ml-0 transition-margin duration-300" style={{ marginLeft: drawerOpen ? '64px' : '0', marginTop: '64px' }}>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </div>
      </body>
    </html>
  );
}