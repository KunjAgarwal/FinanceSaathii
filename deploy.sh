#!/bin/bash
# FinanceSaathi — Full deployment script
# Usage: ./deploy.sh [dev|staging|prod]
set -euo pipefail

ENV=${1:-prod}
REGION=${AWS_REGION:-ap-south-1}
STACK_NAME="financesaathi-${ENV}"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     FinanceSaathi Deployment Script      ║"
echo "╚══════════════════════════════════════════╝"
echo "  Environment : $ENV"
echo "  Region      : $REGION"
echo "  Stack       : $STACK_NAME"
echo ""

# ── 1. Validate prerequisites ──────────────────────────────────────────────────
command -v aws    >/dev/null 2>&1 || { echo "❌ AWS CLI not found. Install: https://aws.amazon.com/cli/"; exit 1; }
command -v sam    >/dev/null 2>&1 || { echo "❌ SAM CLI not found. Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"; exit 1; }
command -v node   >/dev/null 2>&1 || { echo "❌ Node.js not found"; exit 1; }
command -v npm    >/dev/null 2>&1 || { echo "❌ npm not found"; exit 1; }

echo "✅ Prerequisites OK"

# ── 2. Collect parameters ──────────────────────────────────────────────────────
read -s -p "🔑 JWT Secret (min 32 chars): " JWT_SECRET
echo ""
read -s -p "🤖 OpenAI API Key (press Enter to skip): " OPENAI_KEY
echo ""
read -s -p "💱 ExchangeRate-API Key (press Enter to skip): " EXCHANGE_KEY
echo ""
read -p "🌐 Allowed Origin (press Enter for *): " ALLOWED_ORIGIN
ALLOWED_ORIGIN=${ALLOWED_ORIGIN:-'*'}

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "❌ JWT secret must be at least 32 characters"
  exit 1
fi

# ── 3. Build & deploy backend ──────────────────────────────────────────────────
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install --omit=dev && cd ..

echo "🏗️  Building SAM application..."
sam build \
  --template-file infrastructure/template.yaml \
  --build-dir .aws-sam/build \
  --region "$REGION"

echo "🚀 Deploying backend to AWS..."
sam deploy \
  --template-file infrastructure/template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --parameter-overrides \
    "JWTSecret=$JWT_SECRET" \
    "OpenAIKey=${OPENAI_KEY:-placeholder}" \
    "ExchangeRateKey=${EXCHANGE_KEY:-placeholder}" \
    "AIProvider=openai" \
    "AllowedOrigin=$ALLOWED_ORIGIN" \
    "Environment=$ENV" \
  --no-fail-on-empty-changeset

echo "✅ Backend deployed!"

# ── 4. Get API URL from stack outputs ─────────────────────────────────────────
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" \
  --output text)

CF_DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[0].DomainName | starts_with(@, '${BUCKET_NAME}')].Id" \
  --output text 2>/dev/null || echo "")

echo ""
echo "API URL: $API_URL"
echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront: $CF_URL"

# ── 5. Build & deploy frontend ─────────────────────────────────────────────────
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🏗️  Building frontend..."
echo "VITE_API_URL=$API_URL" > .env.production
npm run build

echo "☁️  Uploading to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "✅ Frontend uploaded!"

# ── 6. CloudFront invalidation ─────────────────────────────────────────────────
if [ -n "$CF_DIST_ID" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*" \
    --region us-east-1 \
    --query "Invalidation.Id" \
    --output text
  echo "✅ Cache invalidated!"
fi

cd ..

# ── 7. Done ────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        🎉 FinanceSaathi is LIVE!             ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  App URL  : $CF_URL"
echo "║  API URL  : $API_URL"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Visit $CF_URL to access your app"
echo "  2. Create your account and start tracking!"
echo "  3. Monitor Lambda logs: aws logs tail /aws/lambda/fs-auth-${ENV}"
echo ""
