import { Terminal } from "@/components/terminal";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-4xl h-[70vh] min-h-[400px]">
        <h1 className="text-2xl font-bold text-center mb-4 text-primary-foreground">Linux Console Explorer</h1>
        <Terminal />
      </div>
    </main>
  );
}
