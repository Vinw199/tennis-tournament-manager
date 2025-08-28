import Sidebar from "../../components/Sidebar";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveSpaceId } from "@/lib/supabase/spaces";

export default async function WithSidebarLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const spaceId = await getActiveSpaceId();

  let spaceName = "";
  if (spaceId) {
    const { data } = await supabase
      .from("spaces")
      .select("name")
      .eq("id", spaceId)
      .single();
    spaceName = data?.name || "";
  }
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar spaceName={spaceName} />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  );
}


