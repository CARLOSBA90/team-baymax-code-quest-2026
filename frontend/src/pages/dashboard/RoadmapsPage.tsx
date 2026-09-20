import { useLogout, useSession } from "@/api/queries/auth";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export const RoadmapsPage = () => {
  const { data: session } = useSession();
  const { mutate: logout, isPending, error } = useLogout();

  return (
    <main className="nebula flex min-h-dvh items-center justify-center px-5 sm:px-8">
      <div className="flex w-full flex-col gap-6 sm:w-113">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold text-text-primary sm:text-4xl">
            {session?.user.name}
          </h1>
          <p className="font-body text-text-primary">{session?.user.email}</p>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-xl px-3 py-3 font-body text-xs"
            style={{
              backgroundColor: "rgba(248, 113, 113, 0.10)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "rgba(248, 113, 113, 0.30)",
              color: "#FCA5A5",
            }}
          >
            {getAuthErrorMessage(error)}
          </div>
        )}
        <PrimaryButton loading={isPending} loadingLabel="Cerrando sesión…" onClick={() => logout()}>
          Cerrar sesión
        </PrimaryButton>
      </div>
    </main>
  );
};
