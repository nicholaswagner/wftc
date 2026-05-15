import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">War for the Crown</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Campaign notes and documentation for our Pathfinder 2e game.
        </p>
        <a
          href="/docs"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          View Documentation
        </a>
      </div>
    </HomeLayout>
  );
}
