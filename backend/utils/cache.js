'use strict'
const { DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')
const { docClient } = require('./db')

const CACHE_TABLE = process.env.ANALYTICS_CACHE_TABLE || 'fs-analytics-cache'

/**
 * Invalidates all analytics cache entries for a given user.
 * This is called whenever a transaction is added, updated, or deleted.
 */
async function invalidateAnalyticsCache(userId) {
  if (!userId) return

  try {
    // Find all cache entries for the user
    // userId is the partition key
    const res = await docClient.send(new QueryCommand({
      TableName: CACHE_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }))

    const items = res.Items || []
    if (items.length === 0) return

    console.log(`Invalidating ${items.length} cache items for user: ${userId}`)

    // Delete each cache item
    const deletePromises = items.map(item => 
      docClient.send(new DeleteCommand({
        TableName: CACHE_TABLE,
        Key: { userId: item.userId, cacheKey: item.cacheKey }
      }))
    )

    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Failed to invalidate analytics cache:', error)
    // Non-blocking error
  }
}

module.exports = { invalidateAnalyticsCache }
