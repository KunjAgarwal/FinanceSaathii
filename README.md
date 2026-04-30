# FinanceSaathi 💰

> AI-powered Financial Analytics & Budget Management System — built serverless on AWS

A full-stack, production-ready financial app with a crypto-inspired dark UI, real-time analytics, and an AI advisor.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │                 FRONTEND                     │
                    │   React (Vite) + Tailwind + Recharts         │
                    │   Hosted on S3 + CloudFront (CDN)            │
                    └──────────────────┬──────────────────────────┘
                                       │ HTTPS
                    ┌──────────────────▼──────────────────────────┐
                    │              API GATEWAY                     │
                    │         REST API + JWT Authorizer            │
                    └──┬───────┬──────┬──────┬─────┬─────────────┘
                       │       │      │      │     │
              ┌────────▼─┐ ┌───▼──┐ ┌─▼──┐ ┌▼──┐ ┌▼────────┐
              │  Lambda  │ │Lambda│ │    │ │   │ │ Lambda  │
              │   Auth   │ │ Txns │ │ AI │ │$$│ │Currency │
              └────────┬─┘ └───┬──┘ └─┬──┘ └┬──┘ └┬────────┘
                       │       │      │     │      │
              ┌────────▼───────▼──────┼─────▼──────▼────────┐
              │              DynamoDB                         │
              │  Users │ Transactions │ Budgets │ Cache       │
              └────────────────────────────────────────────┘
                                   │
              ┌────────────────────▼────────────────────────┐
              │         External APIs                        │
              │  OpenAI / Gemini │ ExchangeRate-API          │
              └─────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
financesaathi/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/Layout.jsx       # Sidebar + main layout
│   │   │   ├── CurrencySelector.jsx    # Currency switcher
│   │   │   └── LoadingScreen.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx       # Stats + charts
│   │   │   ├── TransactionsPage.jsx    # CRUD transactions
│   │   │   ├── AnalyticsPage.jsx       # Detailed charts
│   │   │   ├── BudgetPage.jsx          # Budget planner
│   │   │   ├── AIAssistantPage.jsx     # Chat interface
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # JWT auth state
│   │   │   └── ThemeContext.jsx        # Dark/light mode
│   │   ├── services/
│   │   │   └── api.js                  # Axios service layer
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                  # Global + utility classes
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── lambdas/
│   │   ├── auth.js         # signup, login, getProfile, updateProfile
│   │   ├── transactions.js # create, getAll, update, delete
│   │   ├── analytics.js    # getSummary, getMonthlyTrend, getCategoryBreakdown
│   │   ├── budget.js       # create, getAll, update, delete, getRecommendations
│   │   ├── ai.js           # query (OpenAI/Gemini/fallback)
│   │   └── currency.js     # convert, getRates
│   ├── utils/
│   │   ├── authorizer.js   # JWT Lambda authorizer
│   │   ├── response.js     # HTTP response helpers
│   │   └── db.js           # DynamoDB document client
│   └── package.json
│
├── infrastructure/
│   └── template.yaml       # AWS SAM template
│
├── deploy.sh               # One-command deployment
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- AWS CLI configured (`aws configure`)
- AWS SAM CLI ([install guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- OpenAI API key (optional — has fallback)
- ExchangeRate-API key (optional — has static fallback)

### Deploy in one command
```bash
chmod +x deploy.sh
./deploy.sh prod
```

### Manual deployment

#### Backend
```bash
cd backend
npm install --omit=dev

# Deploy (guided first-time setup)
sam deploy \
  --template-file ../infrastructure/template.yaml \
  --stack-name financesaathi-prod \
  --guided
```

#### Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/Prod" > .env.production
npm run build

# Upload to S3
aws s3 sync dist/ s3://YOUR_BUCKET_NAME/ --delete
```

---

## 🔐 Environment Variables

### Backend (set via SAM parameters)
| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Min 32-char secret for JWT signing |
| `OPENAI_API_KEY` | ⚪ | OpenAI key for AI assistant |
| `GEMINI_API_KEY` | ⚪ | Gemini key (alternative to OpenAI) |
| `AI_PROVIDER` | ⚪ | `openai` or `gemini` (default: `openai`) |
| `EXCHANGE_RATE_API_KEY` | ⚪ | ExchangeRate-API key |
| `ALLOWED_ORIGIN` | ⚪ | Your CloudFront URL for CORS |

### Frontend (.env.production)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | API Gateway endpoint URL |

---

## 📊 DynamoDB Schema

### fs-users
| Attribute | Type | Notes |
|---|---|---|
| `userId` | String (PK) | UUID |
| `email` | String (GSI) | Unique, lowercase |
| `name` | String | |
| `password` | String | bcrypt hash, never returned |
| `currency` | String | INR/USD/EUR etc. |
| `createdAt` | ISO string | | 

### fs-transactions
| Attribute | Type | Notes |
|---|---|---|
| `id` | String (PK) | UUID |
| `userId` | String (GSI) | |
| `amount` | Number | |
| `type` | String | `income` or `expense` |
| `category` | String | Food/Travel/Bills etc. |
| `description` | String | Max 200 chars |
| `date` | String | YYYY-MM-DD |
| `createdAt` | ISO string | GSI range key |

### fs-budgets
| Attribute | Type | Notes |
|---|---|---|
| `budgetId` | String (PK) | UUID |
| `userId` | String (GSI) | |
| `category` | String | |
| `limit` | Number | Monthly limit |
| `month` | String | YYYY-MM |

### fs-analytics-cache
| Attribute | Type | Notes |
|---|---|---|
| `userId` | String (PK) | Or `RATES` for currency |
| `cacheKey` | String (SK) | e.g. `summary:2024-01` |
| `data` | String | JSON encoded |
| `expiresAt` | Number | Unix timestamp (TTL) |

---

## 🌐 API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login → JWT |
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update name/currency |
| POST | `/transactions` | Add transaction |
| GET | `/transactions` | List (filters: type, category, month, limit) |
| PUT | `/transactions/{id}` | Update |
| DELETE | `/transactions/{id}` | Delete |
| GET | `/analytics` | Monthly summary |
| GET | `/analytics/trend` | 6-month trend |
| GET | `/analytics/categories` | Category breakdown |
| POST | `/budget` | Create budget |
| GET | `/budget` | List budgets (with actual spend) |
| PUT | `/budget/{id}` | Update limit |
| DELETE | `/budget/{id}` | Remove |
| GET | `/budget/recommendations` | AI recommendations |
| POST | `/ai/query` | Chat with AI advisor |
| GET | `/currency/rates` | Get exchange rates |
| GET | `/currency/convert` | Convert amount |

---

## 🎨 UI Features

- **Dark / Light mode** — toggle in sidebar, persisted to localStorage
- **Crypto-style dashboard** — glassmorphism cards, neon accents
- **Fonts** — Orbitron (logo), Inter (body), JetBrains Mono (numbers)
- **Charts** — Recharts area, bar, pie charts with dark theme
- **Responsive** — mobile sidebar drawer + desktop persistent sidebar
- **Real-time feedback** — toast notifications, shimmer loading states
- **AI Chat** — streaming-style chat UI with typing indicator and suggested prompts

---

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens (30-day expiry, RS256-compatible)
- DynamoDB ownership checks before all mutations
- Input validation on all Lambda functions
- CORS configured with allowed origins
- DynamoDB PointInTimeRecovery on critical tables
- IAM roles scoped to minimum required permissions

---

## 💸 Estimated AWS Cost (prod)

| Service | Est. Monthly |
|---|---|
| Lambda (1M invocations) | ~$0.20 |
| DynamoDB (on-demand) | $1–5 |
| API Gateway | $3.50/M requests |
| S3 + CloudFront | < $1 |
| **Total** | **< $10/month** |

---

## 🛠️ Local Development

```bash
# Backend — local DynamoDB
docker run -p 8000:8000 amazon/dynamodb-local
IS_LOCAL=true node -e "require('./backend/lambdas/auth').signup({body: JSON.stringify({name:'Test',email:'test@test.com',password:'password123'})})"

# Frontend
cd frontend
npm run dev    # → http://localhost:3000
```
#   F i n a n c e S a a t h i i 
 
 
