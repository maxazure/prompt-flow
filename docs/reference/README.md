# 📋 Reference Documentation

Quick reference materials and technical specifications for PromptFlow.

## 📚 Reference Materials

### 🔧 [Configuration Reference](./configuration.md)
Complete guide to all configuration options, environment variables, and settings.

### 🚨 [Error Codes](./error-codes.md)
Comprehensive list of API error codes, HTTP status codes, and error messages.

### 📈 [Changelog](./changelog.md)
Version history, release notes, and breaking changes.

### 🛠️ [Troubleshooting](./troubleshooting.md)
Common issues, solutions, and debugging guides.

### ❓ [FAQ](./faq.md)
Frequently asked questions and their answers.

### 🗺️ [Roadmap](./roadmap.md)
Future development plans and feature roadmap.

## 🔍 Quick References

### Environment Variables
```bash
# Core Application
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_key

# Database
DATABASE_TYPE=sqlite
DATABASE_URL=./database.sqlite

# AI Services (Optional)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4-turbo
```

### API Status Codes
| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal error |

### Default Ports
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:3001` (Express API)
- **Database**: SQLite file-based (no network port)

### Key File Locations
```
project-root/
├── .env                    # Environment configuration
├── backend/database.sqlite # SQLite database file
├── frontend/dist/         # Built frontend assets
├── backend/dist/          # Compiled backend code
└── docs/                  # Documentation files
```

## 🎯 Common Commands

### Development
```bash
# Start development servers
npm run dev              # Both frontend and backend
cd frontend && npm run dev   # Frontend only
cd backend && npm run dev    # Backend only

# Testing
npm test                 # All tests
npm run test:coverage    # With coverage
npm run test:e2e        # End-to-end tests

# Code quality
npm run lint            # ESLint check
npm run format          # Prettier format
npm run type-check      # TypeScript check
```

### Production
```bash
# Build for production
npm run build           # Build both frontend and backend
npm run start           # Start production server

# Docker deployment
docker-compose up -d    # Start with Docker
docker-compose logs     # View logs
docker-compose down     # Stop services
```

## 📊 System Requirements

### Development Environment
- **Node.js**: 18.0+ (20.0+ recommended)
- **npm**: 9.0+ or yarn 1.22+
- **Git**: 2.30+
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Production Environment
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB+ recommended)
- **Storage**: 10GB+ available space
- **Network**: Stable internet connection for AI features

### Browser Support
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 🔐 Security Checklist

### Development
- [ ] Use strong JWT secrets
- [ ] Keep dependencies updated
- [ ] Never commit secrets to Git
- [ ] Use HTTPS in production
- [ ] Validate all user inputs

### Production
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Enable request rate limiting
- [ ] Configure security headers
- [ ] Set up monitoring and alerts

## 📞 Support Resources

### Getting Help
- **[GitHub Issues](https://github.com/maxazure/prompt-flow/issues)** - Bug reports
- **[GitHub Discussions](https://github.com/maxazure/prompt-flow/discussions)** - Questions
- **[Documentation](../README.md)** - Complete docs
- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues

### Community
- **[Contributing Guide](../development/contributing.md)** - How to contribute
- **[Code of Conduct](./code-of-conduct.md)** - Community guidelines
- **[License](./license.md)** - MIT License terms

## 📅 Release Information

### Current Version
- **Version**: v1.0.0
- **Release Date**: 2025-06-27
- **Status**: Production Ready
- **Support**: Active development

### Version History
- **v1.0.0** (2025-06-27): Initial release with full feature set
- **v0.9.0** (2025-06-26): Phase 4 category management system
- **v0.8.0** (2025-06-25): AI features and team collaboration
- **v0.7.0** (2025-06-24): Version control and comments system

See [Changelog](./changelog.md) for detailed version history.