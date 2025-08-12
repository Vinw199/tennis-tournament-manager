export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen grid place-items-center p-6 md:p-8">
      <main className="w-full max-w-lg">{children}</main>
    </div>
  );
}



