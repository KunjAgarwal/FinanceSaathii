'use strict'

const axios           = require('axios')
const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')
const { docClient }   = require('../utils/db')
const r               = require('../utils/response')
const { verifyToken } = require('../utils/authorizer')

const GEMINI_KEY     = process.env.GEMINI_API_KEY
const AI_PROVIDER    = process.env.AI_PROVIDER || 'gemini'
const CHATS_TABLE    = process.env.AI_CHATS_TABLE || 'fs-ai-chats-prod'

const SYSTEM_PROMPT = `You are FinanceSaathi AI, a professional financial advisor specializing in Indian personal finance. 
Your expertise covers budget planning, spending analysis, and Indian investment instruments (Mutual Funds, SIPs, PPF, Tax-saving).
Guidelines:
- Provide detailed, multi-paragraph advice.
- Use markdown formatting and ₹ (INR) for currency.
- Be encouraging and professional.`

/**
 * Loads last 10 messages from DynamoDB.
 */
async function getChatHistory(userId) {
  try {
    const res = await docClient.send(new QueryCommand({
      TableName: CHATS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
      Limit: 10,
    }))
    return (res.Items || []).map(i => ({ role: i.role, content: i.content })).reverse()
  } catch (error) {
    console.error('[DB ERROR] Failed to fetch history:', error.message)
    return []
  }
}

/**
 * Saves message to DynamoDB.
 */
async function saveMsg(userId, role, content) {
  try {
    await docClient.send(new PutCommand({
      TableName: CHATS_TABLE,
      Item: {
        userId,
        messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        role,
        content,
        createdAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + (30 * 86400)
      }
    }))
  } catch (error) {
    console.error('[DB ERROR] Failed to save message:', error.message)
  }
}

/**
 * Calls Gemini 2.0 Flash (latest stable model).
 */
async function callGemini(message, systemPrompt, history) {
  try {
    // Using gemini-2.0-flash as identified in model list
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
    
    // Structure contents for multi-turn
    const contents = [
      { role: 'user', parts: [{ text: `System Instructions: ${systemPrompt}` }] },
      { role: 'model', parts: [{ text: 'Understood. I am FinanceSaathi AI, ready to assist.' }] }
    ]

    history.forEach(h => {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })
    })
    
    contents.push({ role: 'user', parts: [{ text: message }] })

    const response = await axios.post(url, {
      contents,
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
    }, { timeout: 25000 })

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!reply) throw new Error('Empty response from Gemini')
    
    return reply
  } catch (error) {
    console.error('[AI ERROR] Gemini failed:', error.response?.data || error.message)
    throw error
  }
}

exports.query = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  
  try {
    const { userId } = verifyToken(event)
    const { message, context } = JSON.parse(event.body || '{}')

    if (!message?.trim()) return r.badReq('Message is required')

    // 1. Get History & Context
    const history = await getChatHistory(userId)
    const contextStr = context ? `\n\nFinancial Snapshot: ${JSON.stringify(context)}` : ''
    const fullSystem = SYSTEM_PROMPT + contextStr

    // 2. Call AI
    const reply = await callGemini(message, fullSystem, history)

    // 3. Persist
    await saveMsg(userId, 'user', message)
    await saveMsg(userId, 'assistant', reply)

    return r.ok({ reply: reply.trim() })

  } catch (error) {
    console.error('[QUERY ERROR] handler failed:', error.message)
    return r.ok({ 
      reply: "I encountered an error while thinking. Please try again in a moment.",
      error: error.message 
    })
  }
}
