'use server'

import { createRedisInstance } from '@/redis'
import { redirect } from 'next/navigation';
import axios from 'axios';
import { isEmptyObj } from 'openai/core';


const BackendServiceIp = process.env.BackendServiceIp
const BackendServicePort = process.env.BackendServicePort

const IP_ADDRESS = `http://${BackendServiceIp}:${BackendServicePort}`;
const redis = createRedisInstance();

export async function saveAgentInfo(userId:string,agentId:string,agentInfo:string) {
  const serializedData =  {[agentId]:JSON.stringify(agentInfo)} 
    await redis.hmset(`user:${userId}agents`, serializedData).catch((error) => {
      console.error('Error setting agent object:', error);
    });
    redirect(`/${agentId}`)
}

export async function getAgentIds(user : object) {
  const agents = await redis.hgetall(`user:${user.id}`)
  if(isEmptyObj(agents)){
    try{
      const data = {
        userId: user.id,
        sessionId: user.deviceHash,
        role: user.role,
        org: user.org,
        position: user.position,
        hierarchyId : user.hierarchyId
      }
      const response = await axios.post(`${IP_ADDRESS}/chatbot/getAgentIds`, data);
      const apiAgents = response.data.agentIds
      const jsonStringifiedAgents: any = {}
      for (const key in apiAgents) {
        if (apiAgents.hasOwnProperty(key)) {
          jsonStringifiedAgents[key] = JSON.stringify(apiAgents[key]);
        }
      }
        return jsonStringifiedAgents
    }
    catch (error: any) {
      console.error('Error:', error.message);
      return null
    }
  }
return agents
}

export async function agentsInfo(userId:string) {
  const agents = await redis.hgetall(`user:${userId}agents`)
  return agents
}

export async function removeAgent(userId:string,agentId:string) {
  await redis.hdel(`user:${userId}agents`,`${agentId}`)
  return 
}