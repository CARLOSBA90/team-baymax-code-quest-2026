import { AuthField } from "./AuthField";

export const AuthLoginForm = () => {
  return (
    <form className="flex flex-col gap-5">
      <AuthField id="email" label="Email" type="email" name="email" autoComplete="email" />
      <AuthField
        id="password"
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="current-password"
      />
      <button
        type="submit"
        className="mt-1 h-11 rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
      >
        Ingresar
      </button>
    </form>
  );
};
