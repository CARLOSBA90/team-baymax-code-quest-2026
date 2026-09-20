import { AuthError, authClient, buildFrontendUrl } from "@/lib";

export type SocialProvider = "google" | "github" | "discord";

type SignInInput = { email: string; password: string };
type SignUpInput = { name: string; email: string; password: string };

const DASHBOARD_PATH = "/dashboard/roadmaps";
const LOGIN_PATH = "/auth/login";

export async function signInEmail({ email, password }: SignInInput): Promise<void> {
  const { error } = await authClient.signIn.email({ email, password });
  if (error) throw new AuthError(error);
}

export async function signUpEmail({
  name,
  email,
  password,
}: SignUpInput): Promise<{ verificationUrl: string | null }> {
  let verificationUrl: string | null = null;
  const { error } = await authClient.signUp.email({
    name,
    email,
    password,
    callbackURL: buildFrontendUrl(DASHBOARD_PATH),
    fetchOptions: {
      onSuccess: (ctx) => {
        verificationUrl = ctx.response.headers.get("X-Verification-Url");
      },
    },
  });
  if (error) throw new AuthError(error);
  return { verificationUrl };
}

export async function signInSocial(provider: SocialProvider): Promise<void> {
  const { error } = await authClient.signIn.social({
    provider,
    callbackURL: buildFrontendUrl(DASHBOARD_PATH),
    errorCallbackURL: buildFrontendUrl(LOGIN_PATH),
  });
  if (error) throw new AuthError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new AuthError(error);
}
