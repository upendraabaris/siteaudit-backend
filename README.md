# Website Audit Backend API

A Node.js backend service for analyzing websites across multiple dimensions including SEO, Performance, Accessibility, and Best Practices.

## Features

- 🔍 **SEO Analysis** - Title tags, meta descriptions, headings, images alt text
- ⚡ **Performance Analysis** - Load times, page size, compression, caching
- ♿ **Accessibility Analysis** - WCAG compliance, alt text, form labels, ARIA
- ✅ **Best Practices** - HTTPS, security headers, mobile viewport, external links

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Setup

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Complete Audit
```
POST /api/audit/run
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### Individual Analysis
```
POST /api/seo/analyze
POST /api/performance/analyze
```

## Response Format

```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "results": {
    "overall": {
      "score": 85,
      "grade": "B"
    },
    "seo": {
      "score": 90,
      "grade": "A",
      "issues": [],
      "recommendations": []
    },
    "performance": {
      "score": 80,
      "grade": "B",
      "metrics": {
        "loadTime": 1200,
        "pageSize": 450
      }
    },
    "accessibility": {
      "score": 85,
      "grade": "B"
    },
    "bestPractices": {
      "score": 85,
      "grade": "B"
    }
  }
}
```

## Project Structure

```
audit-backend/
├── routes/           # API route handlers
├── services/         # Business logic for analysis
├── utils/           # Utility functions
├── server.js        # Main server file
├── package.json     # Dependencies
└── README.md        # This file
```

## Development

The backend is designed to work without a database, making it simple to deploy and scale. All analysis is performed in real-time.

### Adding New Analysis Features

1. Create a new service in `services/`
2. Add route handler in `routes/`
3. Integrate with main audit service

### CORS Configuration

The server is configured to accept requests from the frontend running on `http://localhost:5173`. Update `FRONTEND_URL` in `.env` for different configurations.

## Deployment

This backend can be deployed to any Node.js hosting platform:

- Heroku
- Vercel
- Railway
- DigitalOcean App Platform
- AWS Lambda (with serverless framework)

## License

MIT License"# siteaudit-backend" 
