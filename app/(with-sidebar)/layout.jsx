import Sidebar from "../../components/Sidebar";

export default function WithSidebarLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  );
}


