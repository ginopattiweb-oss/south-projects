import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <div className="orb-purple" />
      <div className="orb-cyan" />
      <Sidebar
        userEmail={session.user?.email}
        userName={session.user?.name}
        role={session.user?.role ?? "employee"}
      />
      <main className="flex-1 overflow-y-auto min-w-0 relative z-10">
        {children}
      </main>
    </div>
  );
}
