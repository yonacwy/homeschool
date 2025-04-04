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
import React, { useState } from 'react'; // Import React and useState

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ user: await getUser(request) });
};

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false); // State for drawer
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
        <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
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
          <div className="flex items-center">
            <p className="mr-4">{user?.email}</p>
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
              >
                Logout
              </button>
            </Form>
          </div>
        </header>
        <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md p-4 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 z-50`}>
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
        <div className="ml-0 transition-margin duration-300" style={{ marginLeft: drawerOpen ? '64px' : '0' }}>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </div>
      </body>
    </html>
  );
}
