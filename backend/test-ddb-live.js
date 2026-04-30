const { QueryCommand } = require('@aws-sdk/lib-dynamodb')
const { docClient } = require('./utils/db')

async function run() {
  try {
    const params = {
      // TableName removed
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': '123' },
    }
    await docClient.send(new QueryCommand(params))
    console.log("Success")
  } catch (e) {
    console.log("NAME:", e.name)
    console.log("MESSAGE:", e.message)
    console.log("FULL:", e)
  }
}
run()
