import Image from "next/image";

export default function AuthLayout({ children }) {

  return (
    <div className="min-h-screen grid place-items-center p-6 md:p-8">
      <Image src="/auth-background.jpg" alt="Tennis Court Background" fill className="object-cover" layout="fill" />
      <div className="absolute inset-0 bg-black/30" />
      <main className="w-full max-w-lg z-20">{children}</main>
    </div>
  );
}