// "use client";

// import { useState } from "react";
// import Button from "../../../components/ui/Button";
// import { getBrowserSupabaseClient } from "../../../lib/supabase/client";

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPw, setShowPw] = useState(false);

//   const emailValid = /.+@.+\..+/.test(email);
//   const pwValid = password.length >= 8;
//   const canSubmit = emailValid && pwValid;

//   async function onSubmit(e) {
//     e.preventDefault();
//     if (!canSubmit) return;
//     const supabase = getBrowserSupabaseClient();
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) {
//       alert(error.message);
//       return;
//     }
//     window.location.href = "/";
//   }

//   return (
//     <div className="mx-auto max-w-md">
//       <h1 className="mb-6 text-2xl font-bold">Log in</h1>
//       <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-black/10 bg-white p-5">
//         <label className="block text-sm">
//           <span className="mb-1 block text-foreground/70">Email</span>
//           <input
//             type="email"
//             className="w-full rounded-md border px-3 py-2"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="you@example.com"
//           />
//         </label>
//         <label className="block text-sm">
//           <span className="mb-1 block text-foreground/70">Password</span>
//           <div className="flex items-center gap-2">
//             <input
//               type={showPw ? "text" : "password"}
//               className="w-full rounded-md border px-3 py-2"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="••••••••"
//             />
//             <button type="button" className="rounded-md border px-2 py-2 text-xs" onClick={() => setShowPw((s) => !s)}>
//               {showPw ? "Hide" : "Show"}
//             </button>
//           </div>
//           <div className="mt-1 text-xs text-foreground/60">At least 8 characters.</div>
//         </label>
//         <div className="pt-2">
//           <Button type="submit" disabled={!canSubmit} className="w-full">
//             Continue
//           </Button>
//         </div>
//         <div className="text-center text-sm text-foreground/70">
//           Don&apos;t have an account? <a className="text-brand underline" href="/signup">Sign up</a>
//         </div>
//       </form>
//     </div>
//   );
// }

import Link from 'next/link'
import { login } from '../actions'

export default async function LoginPage({ searchParams }) {
  const { error, message } = await searchParams
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="text-sm text-foreground/70">Welcome back</p>
      </div>
      <form className="space-y-4 rounded-lg border border-black/10 bg-white p-6">
        {/* Email Input */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-foreground/70">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-foreground/70">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button formAction={login} className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">
            Continue
          </button>
        </div>

        {/* Message/Error Display */}
        {error && (<p className="mt-4 text-center text-sm text-red-600">{error}</p>)}
        {message && (<p className="mt-4 text-center text-sm text-green-600">{message}</p>)}

        {/* Link to Signup Page */}
        <div className="pt-2 text-center text-sm text-foreground/70">
          Don&apos;t have an account? <Link href="/signup" className="text-brand underline">Sign up</Link>
        </div>
      </form>
    </div>
  )
}



