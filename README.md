# FinanceSaathi 💰

**AI-Powered Financial Analytics & Budget Management System**

A full-stack, serverless financial application built on AWS, featuring real-time analytics, budget tracking, and an AI-powered financial advisor — all wrapped in a modern crypto-inspired UI.

---

## 🏗️ Architecture Overview

```text
Frontend (React + Vite + Tailwind + Recharts)
        │
        ▼
API Gateway (REST + JWT Auth)
        │
        ▼
AWS Lambda Functions (Microservices)
        │
        ▼
DynamoDB (NoSQL Database)
        │
        ▼
External APIs (OpenAI / Gemini / Exchange Rates)
```

### Key Highlights

- Fully serverless architecture
- Scalable and cost-efficient
- Secure JWT-based authentication
- Modular microservices using Lambda

---

## 📁 Project Structure

```text
financesaathi/
├── frontend/        # React frontend
├── backend/         # Lambda functions
├── infrastructure/  # AWS SAM template
├── deploy.sh        # Deployment script
└── README.md
```

---

## Frontend

- Built with React + Vite
- Styled using Tailwind CSS
- Charts powered by Recharts
- Context-based state management

---

## Backend

AWS Lambda-based microservices:

- Authentication
- Transactions
- Analytics
- Budgeting
- AI Assistant
- Currency conversion

---

## Infrastructure

Defined using AWS SAM (Serverless Application Model)

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v20+)
- AWS CLI configured
- AWS SAM CLI installed
- (Optional) OpenAI / Gemini API key
- (Optional) Exchange Rate API key

### 🔹 One-Command Deployment

```bash
chmod +x deploy.sh
./deploy.sh prod
```

### 🔹 Manual Deployment

#### Backend

```bash
cd backend
npm install --omit=dev

sam deploy \
  --template-file ../infrastructure/template.yaml \
  --stack-name financesaathi-prod \
  --guided
```

#### Frontend

```bash
cd frontend
npm install

echo "VITE_API_URL=YOUR_API_URL" > .env.production

npm run build

aws s3 sync dist/ s3://YOUR_BUCKET_NAME/ --delete
```

---

## 🔐 Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| JWT_SECRET | ✅ | Secret for JWT signing |
| OPENAI_API_KEY | ⚪ | AI integration |
| GEMINI_API_KEY | ⚪ | Alternative AI provider |
| AI_PROVIDER | ⚪ | `openai` or `gemini` |
| EXCHANGE_RATE_API_KEY | ⚪ | Currency API |
| ALLOWED_ORIGIN | ⚪ | CORS configuration |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | ✅ | API Gateway endpoint |

---

## 📊 Database Schema (DynamoDB)

### Users

Stores user profile & authentication data.

### Transactions

Tracks income & expenses.

### Budgets

Monthly category-wise limits.

### Analytics Cache

Improves performance with cached insights.

---

## 🌐 API Endpoints

### Authentication

- `POST /auth/signup`
- `POST /auth/login`

### User Profile

- `GET /profile`
- `PUT /profile`

### Transactions

- `POST /transactions`
- `GET /transactions`
- `PUT /transactions/{id}`
- `DELETE /transactions/{id}`

### Analytics

- `GET /analytics`
- `GET /analytics/trend`
- `GET /analytics/categories`

### Budget

- `POST /budget`
- `GET /budget`
- `PUT /budget/{id}`
- `DELETE /budget/{id}`
- `GET /budget/recommendations`

### AI Assistant

- `POST /ai/query`

### Currency

- `GET /currency/rates`
- `GET /currency/convert`

---

## 🎨 UI Features

- 🌙 Dark / Light mode
- 📊 Interactive charts (area, bar, pie)
- 💬 AI chat interface with suggestions
- ⚡ Real-time feedback (toasts & loaders)
- 📱 Fully responsive design
- 🎨 Modern crypto-style UI (glassmorphism + neon accents)

---

## 🔒 Security

- Password hashing using bcrypt
- JWT authentication (secure & scalable)
- Strict IAM role permissions
- Input validation across all APIs
- CORS protection
- DynamoDB data ownership checks

---

## 🔮 Future Enhancements

- 📱 Native mobile application (Android & iOS)
- 🏦 Bank account integration
- 📧 Email and SMS notifications
- 🔔 Push notifications
- 📄 PDF and Excel report export
- 📈 Investment portfolio tracking
- 💹 Stock & cryptocurrency integration
- 🎙️ Voice-enabled AI assistant
- 👨‍👩‍👧 Shared budgets and family expense management
- 🌍 Multi-language support
- 🔐 Multi-Factor Authentication (MFA)
