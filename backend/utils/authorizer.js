'use strict'
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Lambda authorizer — validates Bearer JWT and returns allow/deny policy.
 * Also used directly by Lambda functions for inline auth.
 */
exports.handler = async (event) => {
  try {
    const token = extractToken(event.authorizationToken)
    const decoded = jwt.verify(token, JWT_SECRET)
    return generatePolicy(decoded.userId, 'Allow', event.methodArn, decoded)
  } catch {
    return generatePolicy('user', 'Deny', event.methodArn)
  }
}

/**
 * Inline auth — call from Lambda functions when not using API Gateway authorizer.
 * Returns { userId, email } or throws 401.
 */
exports.verifyToken = (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  if (!token) throw { statusCode: 401, message: 'No token provided' }
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    throw { statusCode: 401, message: 'Invalid or expired token' }
  }
}

function extractToken(authHeader = '') {
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
}

function generatePolicy(principalId, effect, resource, context = {}) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: resource }],
    },
    context: {
      userId: context.userId || principalId,
      email:  context.email  || '',
    },
  }
}
