import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Background gradient orbs */}
      <div className="orb-purple" />
      <div className="orb-cyan" />

      <Sidebar userEmail={session.user?.email} />
      <main className="flex-1 overflow-y-auto min-w-0 relative z-10">
        {children}
      </main>
    </div>
  );
}
