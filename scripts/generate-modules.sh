#!/bin/bash

# Script to generate modules from entities
# Usage: 
#   ./generate-modules.sh              # Generate all modules  
#   ./generate-modules.sh list         # List available entities
#   ./generate-modules.sh <EntityName> # Generate specific module

echo "🚀 Module Generator Script"

# Change to project directory
cd "$(dirname "$0")/.."

# Check arguments
if [ $# -eq 0 ]; then
    echo "📦 Generating all modules from entities..."
    npx ts-node src/shared/utils/generateModuleAuto.utils.ts
elif [ "$1" = "list" ]; then
    echo "📋 Listing available entities..."
    npx ts-node src/shared/utils/generateModuleAuto.utils.ts list
else
    echo "🎯 Generating module for: $1"
    npx ts-node src/shared/utils/generateModuleAuto.utils.ts generate "$1"
fi

echo "✅ Done!"
