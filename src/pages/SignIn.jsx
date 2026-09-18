import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">🍿 Sign in to PopnChill</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Welcome back! Please sign in to continue</h1>
          <p className="mt-2 text-sm text-white/55">Access your watchlist and account from any device.</p>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
      </div>
    </main>
  );
}
