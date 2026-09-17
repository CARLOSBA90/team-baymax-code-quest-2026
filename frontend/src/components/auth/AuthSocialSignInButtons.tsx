import { FaDiscord, FaGithubAlt, FaGoogle } from "react-icons/fa6";

const socialButtonClassName =
  "flex h-11 items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 cursor-pointer";

export function AuthSocialSignInButtons() {
  const handleSignIn = (provider: string) => console.log(`Sign In with ${provider}`);

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => handleSignIn("discord")}
        type="button"
        className={`${socialButtonClassName} w-full`}
      >
        <FaDiscord size={20} />
        Ingresa con Discord
      </button>
      <div className="flex flex-col gap-3 w-full md:flex-row">
        <button
          onClick={() => handleSignIn("google")}
          type="button"
          className={`${socialButtonClassName} w-full md:grow`}
        >
          <FaGoogle size={20} />
          Ingresa con Google
        </button>
        <button
          onClick={() => handleSignIn("github")}
          type="button"
          className={`${socialButtonClassName} w-full md:grow`}
        >
          <FaGithubAlt size={20} />
          Ingresa con GitHub
        </button>
      </div>
    </div>
  );
}
