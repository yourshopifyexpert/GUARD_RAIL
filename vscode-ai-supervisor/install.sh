#!/bin/bash

# AI Supervisor Extension - Quick Install Script
# This script packages and installs the extension

set -e

echo "🔧 AI Supervisor Extension Installer"
echo "===================================="
echo ""

# Navigate to extension directory
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the right directory?"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 2: Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed! Please fix TypeScript errors first."
    exit 1
fi

echo ""
echo "✅ Compilation successful! (0 errors)"
echo ""
echo "Choose installation method:"
echo ""
echo "1) 🚀 Launch in Development Mode (F5) - Quick test"
echo "2) 📦 Package as VSIX - Install like a real extension"
echo "3) 🔗 Copy to VS Code extensions folder - Direct install"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Development Mode Selected"
        echo ""
        echo "Instructions:"
        echo "1. Open this folder in VS Code:"
        echo "   code /home/user/GUARD_RAIL/vscode-ai-supervisor"
        echo ""
        echo "2. Press F5 (or Run → Start Debugging)"
        echo ""
        echo "3. A new VS Code window will open with the extension active"
        echo ""
        echo "Opening VS Code now..."
        code /home/user/GUARD_RAIL/vscode-ai-supervisor
        ;;

    2)
        echo ""
        echo "📦 Packaging Extension..."

        # Check if vsce is installed
        if ! command -v vsce &> /dev/null; then
            echo "Installing vsce (VS Code Extension Manager)..."
            npm install -g @vscode/vsce
        fi

        # Package the extension
        vsce package --no-yarn

        VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

        if [ -f "$VSIX_FILE" ]; then
            echo ""
            echo "✅ Extension packaged successfully!"
            echo ""
            echo "📦 VSIX File: $VSIX_FILE"
            echo ""
            echo "To install:"
            echo "1. Open VS Code"
            echo "2. Go to Extensions (Ctrl+Shift+X)"
            echo "3. Click '...' → 'Install from VSIX...'"
            echo "4. Select: $PWD/$VSIX_FILE"
            echo ""
            echo "Or run: code --install-extension $PWD/$VSIX_FILE"
            echo ""
            read -p "Install now? (y/n): " install_now

            if [ "$install_now" = "y" ]; then
                code --install-extension "$PWD/$VSIX_FILE"
                echo "✅ Extension installed! Reload VS Code to activate."
            fi
        else
            echo "❌ Failed to create VSIX package"
            exit 1
        fi
        ;;

    3)
        echo ""
        echo "🔗 Installing to VS Code extensions folder..."

        # Detect OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            VSCODE_EXT_DIR="$HOME/.vscode/extensions"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            VSCODE_EXT_DIR="$HOME/.vscode/extensions"
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            VSCODE_EXT_DIR="$USERPROFILE/.vscode/extensions"
        else
            echo "❌ Unsupported OS: $OSTYPE"
            exit 1
        fi

        EXT_NAME="ai-supervisor-0.1.0"
        INSTALL_DIR="$VSCODE_EXT_DIR/$EXT_NAME"

        echo "Installing to: $INSTALL_DIR"

        # Create directory
        mkdir -p "$INSTALL_DIR"

        # Copy files
        cp -r out package.json README.md LICENSE "$INSTALL_DIR/"

        if [ -d "node_modules" ]; then
            cp -r node_modules "$INSTALL_DIR/"
        fi

        echo ""
        echo "✅ Extension installed to: $INSTALL_DIR"
        echo ""
        echo "Please reload VS Code (Ctrl+R) to activate the extension"
        ;;

    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "🎉 Installation Complete!"
echo "================================================"
echo ""
echo "Next Steps:"
echo ""
echo "1️⃣  Configure Guardian AI Provider"
echo "   - Open Settings: Ctrl+,"
echo "   - Search: 'AI Supervisor Guardian'"
echo "   - Set provider (openai/anthropic/ollama/google)"
echo "   - Add API key (or use Ollama for free local AI)"
echo ""
echo "2️⃣  Define Your First Goal"
echo "   - Command Palette: Ctrl+Shift+P"
echo "   - Run: 'AI Supervisor: Manage Goals'"
echo "   - Add a goal for your project"
echo ""
echo "3️⃣  Test the Extension"
echo "   - Show Activity Monitor: Ctrl+Shift+P → 'AI Supervisor: Show Activity Monitor'"
echo "   - Make a code change and save"
echo "   - Try emergency stop: Ctrl+Shift+Alt+S"
echo ""
echo "📖 Documentation: See INSTALL.md for detailed guide"
echo ""
echo "Happy supervising! 🚀"
