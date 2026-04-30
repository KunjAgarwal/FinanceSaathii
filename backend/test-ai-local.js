'use strict'
const authorizer = require('./utils/authorizer')
authorizer.verifyToken = () => ({ userId: 'test-user' })

const { query } = require('./lambdas/ai')

// Mock event
const event = {
  httpMethod: 'POST',
  body: JSON.stringify({
    message: 'should i save more money?',
    context: {
      currency: 'INR',
      thisMonthIncome: 12000,
      thisMonthExpenses: 1000,
      savings: 11000,
      budgetUsed: 9
    }
  })
}

async function run() {
  console.log('Running AI query locally...')
  try {
    const res = await query(event)
    console.log('Response Status:', res.statusCode)
    const body = JSON.parse(res.body)
    console.log('AI Reply:', body.reply)
  } catch (err) {
    console.error('Error:', err)
  }
}

run()
