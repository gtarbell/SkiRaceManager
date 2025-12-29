import { Amplify } from "aws-amplify";
import { fetchAuthSession, getCurrentUser, signInWithRedirect, signOut } from "aws-amplify/auth";
import { Role, User } from "../models";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const domain = (import.meta.env.VITE_COGNITO_DOMAIN || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");
const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI;
const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI ?? redirectUri;

// Configure Amplify Auth once on module load
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId: clientId,
      loginWith: {
        oauth: {
          domain,
          scopes: ["email", "openid", "profile"],
          redirectSignIn: [redirectUri],
          redirectSignOut: [logoutUri],
          responseType: "code",
        },
      },
    },
  },
});

function roleFromGroups(groups?: string[]): Role {
  if (!groups || groups.length === 0) return "COACH";
  return groups.includes("ADMIN") ? "ADMIN" : "COACH";
}

function parseTeamIds(claim?: unknown): string[] {
  if (!claim || typeof claim !== "string") return [];
  return claim
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentAppUser(): Promise<User | null> {
  try {
    const session = await fetchAuthSession();
    const user = await getCurrentUser();
    const idToken = session.tokens?.idToken;
    const claims = idToken?.payload ?? {};
    const groups = (claims["cognito:groups"] as string[]) || [];
    const teamIds = parseTeamIds(claims["custom:teamIds"]);
    const displayName =
      (claims["name"] as string) ||
      (claims["preferred_username"] as string) ||
      user.username ||
      (claims["email"] as string);

    return {
      id: user.userId,
      name: displayName,
      role: roleFromGroups(groups),
      teamIds,
    };
  } catch {
    return null;
  }
}

export function startLoginRedirect() {
  return signInWithRedirect();
}

export async function logoutCognito() {
  await signOut({ global: true });
}
