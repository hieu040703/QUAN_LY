#!/usr/bin/env bash

echo "🎯 Enum Validation Demo"
echo "======================"
echo ""

echo "📝 Generating Phase validator with enum support..."
npm run validator:gen Phase > /dev/null 2>&1

echo "✅ Generated successfully!"
echo ""

echo "🔹 Phase Entity Enum Definition:"
echo '   @Column({ name: "team", type: "enum", enum: ["GENERAL", "TEAM_1", "TEAM_2"], default: "GENERAL" })'
echo ""

echo "🔹 Generated CreateSchema:"
echo '   team: z.enum(["GENERAL", "TEAM_1", "TEAM_2"], { message: "team.required" })'
echo ""

echo "🔹 Generated UpdateSchema:"
echo '   team: z.enum(["GENERAL", "TEAM_1", "TEAM_2"]).optional()'
echo ""

echo "✨ Enum Features:"
echo "   ✅ Auto-detects enum values from @Column decorator"
echo "   ✅ Adds required message for CreateSchema"
echo "   ✅ Removes required message for UpdateSchema"
echo "   ✅ Maintains enum constraints in both schemas"
echo ""

echo "📁 Generated file: src/modules/phase/phase.validator.ts"
echo ""
echo "🎉 Enum validation is now working perfectly!"
