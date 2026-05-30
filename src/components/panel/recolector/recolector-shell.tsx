import { logoutAction } from "@/app/login/actions";
import { RecolectorBottomNav } from "@/components/panel/recolector/recolector-bottom-nav";

type Props = {
  children: React.ReactNode;
  userName: string;
};

export function RecolectorShell({ children, userName }: Props) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col bg-zinc-100 dark:bg-zinc-950">
      <header
        className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {userName}
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Recolector · Campo
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-[2.75rem] rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 active:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:active:bg-zinc-800"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">{children}</main>

      <RecolectorBottomNav />
    </div>
  );
}
