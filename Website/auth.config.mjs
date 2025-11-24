import { defineConfig } from "auth-astro";

const ISSUER = import.meta.env.AUTHENTIK_ISSUER;

export default defineConfig({
  providers: [
    {
      id: "mu-h-si-c-portal",
      name: "MuHSiC Portal",
      type: "oidc",

      issuer: import.meta.env.AUTHENTIK_ISSUER,

      clientId: import.meta.env.AUTHENTIK_CLIENT_ID,
      clientSecret: import.meta.env.AUTHENTIK_CLIENT_SECRET,

      idToken: true,
      checks: ["pkce", "state"],

      authorization: { params: { scope: "openid email profile role" } },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.role = profile.role;
        token.id_token = account.id_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token.provider === "mu-h-si-c-portal") {
        try {
          const logOutUrl = new URL(
            `${import.meta.env.AUTHENTIK_ISSUER}/if/logout/`,
          );
          logOutUrl.searchParams.set("id_token_hint", token.id_token);
          await fetch(logOutUrl);
        } catch (err) {
          console.error("Logout failed:", err);
        }
      }
    },
  },
});
