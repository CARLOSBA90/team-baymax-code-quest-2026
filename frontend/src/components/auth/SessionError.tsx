import { Notice, PrimaryButton } from "@/components/ui";

interface SessionErrorProps {
  onRetry: () => void;
}

export function SessionError({ onRetry }: SessionErrorProps) {
  return (
    <main className="nebula flex min-h-dvh items-center justify-center px-5 sm:px-8">
      <div className="flex w-full flex-col gap-4 sm:w-113">
        <Notice variant="error">
          No pudimos verificar tu sesión. Revisa tu conexión e inténtalo de nuevo.
        </Notice>
        <PrimaryButton onClick={onRetry}>Reintentar</PrimaryButton>
      </div>
    </main>
  );
}
