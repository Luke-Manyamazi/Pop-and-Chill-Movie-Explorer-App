import { SignUp } from "@clerk/react";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">🍿 Pop & Chill</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-white/55">Save your favourites and keep your movie night history with you.</p>
        </div>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
      </div>
    </main>
  );
}
