import { useLogout, useSession } from "@/api/queries/auth";
import { AuthNotice, PrimaryButton } from "@/components/auth";
import { getAuthErrorMessage } from "@/lib";

export const RoadmapsPage = () => {
  const { data: session } = useSession();
  const { mutate: logout, isPending, error } = useLogout();

  return (
    <main className="nebula flex min-h-dvh items-center justify-center px-5 sm:px-8">
      <div className="flex w-full flex-col gap-6 sm:w-113">
        <div className="flex flex-col gap-1">
          {session?.user.image && (
            <img src={session?.user.image ?? ""} alt="" className="w-12 h-12 rounded-full" />
          )}
          <h1 className="font-display text-2xl font-bold text-text-primary sm:text-4xl">
            {session?.user.name}
          </h1>
          <p className="font-body text-text-primary">{session?.user.email}</p>
        </div>
        {error && <AuthNotice variant="error">{getAuthErrorMessage(error)}</AuthNotice>}
        <PrimaryButton loading={isPending} loadingLabel="Cerrando sesión…" onClick={() => logout()}>
          Cerrar sesión
        </PrimaryButton>
      </div>
    </main>
  );
};
