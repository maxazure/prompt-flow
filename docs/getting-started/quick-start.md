# ⚡ Quick Start Guide

Get PromptFlow running in just 5 minutes! This guide will have you up and running with a fully functional prompt management system.

## 🎯 What You'll Achieve

By the end of this guide, you'll have:
- ✅ PromptFlow running locally
- ✅ Created your first user account
- ✅ Built your first prompt
- ✅ Organized prompts with categories

## 📋 Prerequisites

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **Git** for cloning the repository
- **Terminal/Command Prompt** access

## 🚀 Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/maxazure/prompt-flow.git
cd prompt-flow

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## ⚙️ Step 2: Environment Setup

Create environment files with default settings:

```bash
# In the project root
cp .env.example .env

# In the frontend directory
cd frontend
cp .env.example .env
```

**Default configuration works out of the box!** No changes needed for local development.

## 🏃‍♂️ Step 3: Start the Services

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
✅ Backend running at `http://localhost:3001`

**Terminal 2 - Frontend Application:**
```bash
cd frontend
npm run dev
```
✅ Frontend running at `http://localhost:5173`

## 🎉 Step 4: Access PromptFlow

1. **Open your browser** and navigate to `http://localhost:5173`
2. **Register a new account** with your email and password
3. **Login** with your newly created credentials

## 📝 Step 5: Create Your First Prompt

1. **Click "New Prompt"** in the top-right corner
2. **Fill in the details:**
   - **Title**: "My First Prompt"
   - **Content**: "You are a helpful AI assistant. Please provide a detailed answer to: {question}"
   - **Category**: Select "Uncategorized" or create a new category
   - **Tags**: Add relevant tags like "assistant", "general"
3. **Click "Save Prompt"**

## 🗂️ Step 6: Organize with Categories

1. **Create a new category** using the "+" button in the sidebar
2. **Name your category** (e.g., "AI Assistants")
3. **Choose a color** for visual organization
4. **Move your prompt** to the new category

## 🎨 Step 7: Explore Key Features

### 🤖 AI-Powered Analysis
- Click on your prompt and select "Analyze"
- View AI-generated insights and optimization suggestions

### 📊 Version Control
- Edit your prompt and save changes
- View version history and compare different versions

### 👥 Team Collaboration (Optional)
- Create a team from the Teams page
- Invite team members via email
- Share prompts and collaborate

## ✅ Verification Checklist

Ensure everything is working:

- [ ] ✅ Backend server responds at `http://localhost:3001/api/health`
- [ ] ✅ Frontend loads without errors
- [ ] ✅ User registration and login work
- [ ] ✅ Can create and view prompts
- [ ] ✅ Categories can be created and managed
- [ ] ✅ AI analysis features respond (if OpenAI API is configured)

## 🔧 Common Issues

### Port Already in Use
```bash
# Kill processes on ports 3001 and 5173
npx kill-port 3001 5173
```

### Database Issues
```bash
# Reset the database (will lose data)
cd backend
rm database.sqlite
npm run dev  # Will recreate the database
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Next Steps

Now that you have PromptFlow running:

1. **[Configure OpenAI API](./configuration.md#openai-setup)** for advanced AI features
2. **[Explore the User Guide](../guides/user-guide.md)** for detailed feature explanations
3. **[Set up team collaboration](../guides/team-collaboration.md)** if working with others
4. **[Learn about deployment](../deployment/overview.md)** for production use

## 💡 Pro Tips

- **Keyboard Shortcuts**: Use `Ctrl+B` (or `Cmd+B` on Mac) to toggle the sidebar
- **Search Everything**: Use the search bar to quickly find prompts across categories
- **Color Coding**: Use different colors for categories to visually organize your workflow
- **Version History**: Always review version history before making major prompt changes

## 🆘 Need Help?

- **Issues**: Check the [Troubleshooting Guide](../reference/troubleshooting.md)
- **Questions**: Visit [GitHub Discussions](https://github.com/maxazure/prompt-flow/discussions)
- **Bugs**: Report on [GitHub Issues](https://github.com/maxazure/prompt-flow/issues)

**Congratulations! 🎉** You now have a fully functional PromptFlow installation. Happy prompting!