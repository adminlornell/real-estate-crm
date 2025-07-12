#!/bin/bash

echo "🚀 Setting up Git repository for Real Estate CRM"
echo "=============================================="

# Add GitHub remote
echo "📡 Adding GitHub remote..."
git remote add origin https://github.com/adminlornell/crm.git

# Check if we have any commits
if [ -z "$(git log --oneline 2>/dev/null)" ]; then
    echo "📝 No commits found. Creating initial commit..."
    
    # Add all files
    git add .
    
    # Create initial commit
    git commit -m "🎉 Initial commit: Real Estate CRM with Supabase integration

Features included:
- Next.js 13+ with TypeScript
- Supabase authentication and database
- Property, Client, and Agent management
- Dashboard with basic analytics
- Responsive Tailwind CSS styling
- Row Level Security (RLS) policies

Database tables:
- properties, agents, clients, inquiries
- showings, documents, communications, tasks

Ready for UI/UX enhancements!"

else
    echo "📋 Existing commits found. Checking for uncommitted changes..."
    
    # Check for changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "📝 Found uncommitted changes. Staging and committing..."
        git add .
        git commit -m "💾 Save current state before UI/UX enhancements

- Preserved existing functionality
- Ready for feature branch development
- Supabase integration working
- All core components functional"
    else
        echo "✅ Working directory clean. No changes to commit."
    fi
fi

# Set up the main branch
echo "🌟 Setting up main branch..."
git branch -M main

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Git setup complete!"
echo "🌐 Your repository is now connected to: https://github.com/adminlornell/crm"
echo ""
echo "🚀 Next steps:"
echo "   1. Run this script: chmod +x setup-git.sh && ./setup-git.sh"
echo "   2. Verify on GitHub: https://github.com/adminlornell/crm"
echo "   3. Ready to create feature branches for enhancements!"
echo ""
