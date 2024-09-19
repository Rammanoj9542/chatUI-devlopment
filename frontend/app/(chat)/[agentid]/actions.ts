import { createRedisInstance } from '../../../redis'
import axios from 'axios'

const BackendServiceIp = process.env.BackendServiceIp
const BackendServicePort = process.env.BackendServicePort

const IP_ADDRESS = `http://${BackendServiceIp}:${BackendServicePort}`;

const redis = createRedisInstance();

export async function getUserAgents(userId: string) {
  const agents = await redis.hgetall(`user:${userId}agents`)
  return agents
}

// get agent questions from backend api route
export async function getAgentQuestions(sessionId: string, agentId: string, userId: string) {
  const questions: any = await redis.hget(`userId:${userId}:questions`, agentId)
  if (!questions) {
    const data = {
      sessionId: sessionId,
      agentId: agentId
    }
    try {
      const response = await axios.post(`${IP_ADDRESS}/chatbot/getQuestionCards`, data);
      const apiQuestions = response.data.questions
      if (response.data.status_code == 200) {
        await redis.hmset(`userId:${userId}:questions`, { [agentId]: apiQuestions }).catch((error) => {
          console.error('Error setting agent questions in redis:', error);
        });
        return apiQuestions
      } else {
        return []
      }
    }
    catch (error: any) {
      console.error('Error:', error.message);
      return []
    }
  }
  const splitList: string[] = questions.split(',');
  return splitList
}
