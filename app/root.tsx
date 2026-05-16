import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';
import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import SearchDialog from './components/search';
import { baseOptions } from '@/lib/layout.shared';
import '../styles/app.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>War for the Crown</title>
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  // On a static SPA deploy the most common error is a missing data sidecar
  // (i.e. user landed on a URL that wasn't prerendered). React Router wraps
  // those in an internal class that doesn't expose `.status`, so default to
  // 404 unless we can prove otherwise via `isRouteErrorResponse`.
  const status = isRouteErrorResponse(error) ? error.status : 404;
  const is404 = status === 404;
  const heading = is404 ? '404' : `${status}`;
  const message = is404
    ? "We couldn't find that page in the vault."
    : isRouteErrorResponse(error)
      ? error.statusText || 'An unexpected error occurred.'
      : 'An unexpected error occurred.';

  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col items-center justify-center flex-1 py-24 px-4 text-center gap-6">
        {is404 && (
          <img
            src={`${import.meta.env.BASE_URL}vault/404.png`}
            alt=""
            className="max-w-sm w-full h-auto rounded-lg"
          />
        )}
        <h1 className="text-6xl font-bold tracking-tight">{heading}</h1>
        <p className="text-lg text-fd-muted-foreground max-w-md">{message}</p>
        <Link
          to="/"
          className="bg-fd-primary text-fd-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
      </div>
    </HomeLayout>
  );
}
