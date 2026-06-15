import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "client") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="orb-purple" />
      <div className="orb-cyan" />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/[0.06] glass-sidebar">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center glow-violet">
              <span className="text-[10px] font-bold text-white">SP</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide">SOUTH PROJECTS</p>
              <p className="text-[9px] text-muted-foreground -mt-0.5">Portal de Clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-muted-foreground">{session.user.name}</p>
            <form action="/api/auth/signout" method="POST">
              <input type="hidden" name="callbackUrl" value="/login" />
              <button type="submit" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
