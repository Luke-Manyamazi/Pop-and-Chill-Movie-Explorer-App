import { SignIn } from "@clerk/react";

const clerkAppearance = {
  variables: {
    colorBackground: '#111827',
    colorText: '#ffffff',
    colorTextSecondary: '#cbd5e1',
    colorPrimary: '#14b8a6',
    colorNeutral: '#ffffff',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'w-full max-w-md bg-gray-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl',
    headerTitle: 'text-white font-black',
    headerSubtitle: 'text-slate-300',
    formFieldLabel: 'text-white/80',
    formFieldInput: 'bg-gray-950 border border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-teal-400',
    formButtonPrimary: 'bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold',
    footerActionLink: 'text-teal-300 hover:text-teal-200',
    identityPreview: 'bg-white/5 border border-white/10 rounded-xl',
    dividerLine: 'bg-white/10',
    dividerText: 'text-slate-500',
    socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl',
    socialButtonsBlockButtonText: 'text-white',
    otpCodeFieldInput: 'bg-gray-950 border-white/10 text-white',
  },
};

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">🍿 Sign in to Pop & Chill</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Welcome back! Please sign in to continue</h1>
          <p className="mt-2 text-sm text-white/55">Access your watchlist and account from any device.</p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={clerkAppearance}
        />
      </div>
    </main>
  );
}
