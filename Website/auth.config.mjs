import { defineConfig } from 'auth-astro';
import Keycloak from '@auth/core/providers/keycloak';

export default defineConfig({
  providers: [
    Keycloak({
      issuer: import.meta.env.AUTH_KEYCLOAK_ISSUER,
      clientId: import.meta.env.AUTH_KEYCLOAK_ID,
      clientSecret: import.meta.env.AUTH_KEYCLOAK_SECRET,
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.role = profile.role
        token.id_token = account.id_token
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session
    }
  },
  events: {
    async signOut({ token }) {
      if (token.provider === "keycloak") {
        const logOutUrl = new URL(`${import.meta.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`)
        logOutUrl.searchParams.set("id_token_hint", token.id_token)
        await fetch(logOutUrl);
      }
    },
  },
});
