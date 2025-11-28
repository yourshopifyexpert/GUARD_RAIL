#!/bin/bash

# AI Supervisor Extension - Readiness Check
# This script verifies the extension is ready to install and run

set -e

echo "🔍 AI Supervisor Extension - Readiness Check"
echo "=============================================="
echo ""

cd "$(dirname "$0")"

ERRORS=0
WARNINGS=0

# Check 1: package.json exists
echo "✓ Checking package.json..."
if [ ! -f "package.json" ]; then
    echo "  ❌ package.json not found"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ package.json found"
fi

# Check 2: Node modules installed
echo "✓ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "  ⚠️  node_modules not found - running npm install..."
    npm install
    WARNINGS=$((WARNINGS + 1))
else
    # Check for missing dependencies
    MISSING=$(npm list --depth=0 2>&1 | grep -c "UNMET\|missing" || echo "0")
    if [ "$MISSING" != "0" ]; then
        echo "  ⚠️  Missing dependencies detected - installing..."
        npm install
        WARNINGS=$((WARNINGS + 1))
    else
        echo "  ✅ All dependencies installed"
    fi
fi

# Check 3: TypeScript compiles
echo "✓ Checking TypeScript compilation..."
npm run compile > /tmp/compile-output.txt 2>&1
if [ $? -ne 0 ]; then
    echo "  ❌ TypeScript compilation failed"
    cat /tmp/compile-output.txt
    ERRORS=$((ERRORS + 1))
else
    # Check for warnings/errors in output
    if grep -q "ERROR" /tmp/compile-output.txt; then
        echo "  ❌ Compilation has errors"
        grep "ERROR" /tmp/compile-output.txt
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✅ Compilation successful (0 errors)"
    fi
fi

# Check 4: Main extension file exists
echo "✓ Checking dist/extension.js..."
if [ ! -f "dist/extension.js" ]; then
    echo "  ❌ dist/extension.js not found"
    ERRORS=$((ERRORS + 1))
else
    SIZE=$(stat -f%z "dist/extension.js" 2>/dev/null || stat -c%s "dist/extension.js" 2>/dev/null)
    echo "  ✅ dist/extension.js found (${SIZE} bytes)"
fi

# Check 5: Required AI packages
echo "✓ Checking AI provider packages..."
PACKAGES=("@anthropic-ai/sdk" "@google/generative-ai" "@iarna/toml" "ollama" "openai")
for pkg in "${PACKAGES[@]}"; do
    if npm list "$pkg" > /dev/null 2>&1; then
        echo "  ✅ $pkg installed"
    else
        echo "  ❌ $pkg NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check 6: VSCode engine version
echo "✓ Checking VS Code engine..."
ENGINE=$(grep '"vscode"' package.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
echo "  ℹ️  Requires VS Code $ENGINE or higher"

# Check 7: Activation events
echo "✓ Checking activation events..."
if grep -q "onStartupFinished" package.json; then
    echo "  ✅ Activates on startup"
else
    echo "  ⚠️  No startup activation event"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 8: Commands registered
echo "✓ Checking registered commands..."
CMD_COUNT=$(grep -c '"command":' package.json || echo "0")
echo "  ℹ️  $CMD_COUNT commands registered"

# Check 9: Source files
echo "✓ Checking source files..."
REQUIRED_FILES=(
    "src/extension.ts"
    "src/commands/Commands.ts"
    "src/panels/ActivityMonitor.ts"
    "src/panels/GoalManager.ts"
    "src/admin/AdminCoordinator.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "  ❌ Missing: $file"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "  ✅ All required source files present"
fi

echo ""
echo "=============================================="
echo "Results:"
echo "=============================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ READY TO INSTALL!"
    echo ""
    echo "The extension is fully configured and ready to use."
    echo ""
    echo "Installation options:"
    echo "  1. Development mode: code . && Press F5"
    echo "  2. Run install script: ./install.sh"
    echo "  3. Package as VSIX: npm run package"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  READY WITH WARNINGS ($WARNINGS warnings)"
    echo ""
    echo "The extension should work but has some minor issues."
    echo "Review the warnings above."
    exit 0
else
    echo "❌ NOT READY ($ERRORS errors, $WARNINGS warnings)"
    echo ""
    echo "Please fix the errors above before installing."
    echo ""
    echo "Quick fixes:"
    echo "  - Install dependencies: npm install"
    echo "  - Fix compilation: npm run compile"
    echo "  - Check package.json configuration"
    exit 1
fi
