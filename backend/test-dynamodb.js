const { QueryCommand } = require('@aws-sdk/lib-dynamodb')
const params = {
  TableName: 'fs-transactions',
  IndexName: 'userId-createdAt-index',
  KeyConditionExpression: 'userId = :uid',
  ExpressionAttributeValues: { ':uid': '123' },
}
console.log(new QueryCommand(params))
