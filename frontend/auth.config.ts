import { TokenClassificationPipeline } from '@xenova/transformers'
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    newUser: '/signup'
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.startsWith('/login')
      const isOnSignupPage = nextUrl.pathname.startsWith('/signup')

      if (isLoggedIn) {
        if (isOnLoginPage || isOnSignupPage) {
          return Response.redirect(new URL('/', nextUrl))
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, id: user.userId, name: user.userName, org: user.org, position: user.position, deviceHash: user.deviceHash, role:user.role, hierarchyId: user.hierarchyId}
      
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        const { id } = token as { id: string }
        const { org } = token as { org: string}
        const {position} = token as { position: string}
        const {deviceHash} = token as { deviceHash: string}
        const {role} = token as {role: string}
        const {hierarchyId} = token as {hierarchyId : string}
        const { user } = session
        session = { ...session, user: { ...user, id , org, position, deviceHash, role, hierarchyId} }
      }
      return session
    }
  },
  providers: []
} satisfies NextAuthConfig
