import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { nan, z } from 'zod'
import { getStringFromBuffer } from './lib/utils'
import { getUser } from './app/login/actions'
import { getAgentIds } from './app/(chat)/agent/actions'
import { nanoid } from 'nanoid'
import axios from 'axios'

const BackendServiceIp = process.env.BackendServiceIp
const BackendServicePort = process.env.BackendServicePort

const IP_ADDRESS = `http://${BackendServiceIp}:${BackendServicePort}`;

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        try{
          const parsedCredentials = z
            .object({
              username: z.string(),
              password: z.string().min(6)
            })
            .safeParse(credentials)
          if (parsedCredentials.success) {
            const { username, password } = parsedCredentials.data
            const sessionId = nanoid()
            const data = {
              username: username,
              password: password,
              sessionId: sessionId,
              deviceHash: sessionId,
            }
            const response = await axios.post(`${IP_ADDRESS}/api/login`, data);
            if (response.data.status_code === 200) {
              const user = response.data
              const hierarchyId = Object.keys(user.role.user)[0]
              const role = Object.values(user.role.user)[0]
              user.role = role
              user.hierarchyId = hierarchyId
              getAgentIds(user)
              return user
            } else {
              return null
            }
          }
          return null
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null;
        }
      }
    })
  ]
})
