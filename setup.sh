#!/usr/bin/env bash
# Peter Markdown — Setup Script
# Run this script to install dependencies and start the dev server.

set -e

echo "🚀 Peter Markdown — Setup"
echo "=========================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation succeeded
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Dependencies installed successfully!"
  echo ""
  echo "🎯 Available commands:"
  echo "   npm run dev         Start development server (hot reload)"
  echo "   npm run build       Build for production"
  echo "   npm test            Run unit tests"
  echo "   npm run test:watch  Run tests in watch mode"
  echo ""
  echo "📁 Project structure:"
  echo "   electron/        Electron main process + preload"
  echo "   src/             React renderer"
  echo "     components/    UI components"
  echo "     editor/        ProseMirror editor (WYSIWYG)"
  echo "     parser/        Markdown parser engine"
  echo "     renderer/      Code highlighter + renderer"
  echo "     file/          File service (read/write)"
  echo "     store/         Zustand state management"
  echo "     styles/        CSS variables + layout + markdown"
  echo "   tests/           Unit, integration, e2e tests"
  echo ""
  echo "▶️  Run 'npm run dev' to start editing!"
else
  echo "❌ Installation failed. Check the error messages above."
  exit 1
fi
