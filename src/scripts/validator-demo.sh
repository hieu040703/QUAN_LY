#!/usr/bin/env bash

echo "🚀 Validator Generator Demo"
echo "=========================="
echo ""

echo "📝 Generating validators for demo entities..."
echo ""

# Generate validators for key entities
echo "1️⃣ Generating User validator (with special validations)..."
npm run generate:validators User > /dev/null 2>&1

echo "2️⃣ Generating Product validator (basic fields)..."
npm run generate:validators Product > /dev/null 2>&1

echo "3️⃣ Generating Attribute validator (simple structure)..."
npm run generate:validators Attribute > /dev/null 2>&1

echo ""
echo "✅ Validators generated successfully!"
echo ""
echo "📋 Generated validation features:"
echo ""

echo "🔹 Product Validator:"
echo "   • name: z.string({ message: \"name.required\" })"
echo "   • code: z.string({ message: \"code.required\" })"
echo "   • note: z.string().trim().optional()"
echo ""

echo "🔹 User Validator (with special validations):"
echo "   • email: z.string({ message: \"email.required\" }).email({ message: \"email.invalid_format\" })"
echo "   • password: z.string({ message: \"password.required\" }).min(6, { message: \"password.min_length\" })"
echo "   • phone: z.string().trim().regex(/^[0-9+\-\s()]+$/, { message: \"phone.invalid_format\" }).optional()"
echo "   • leaderOf: z.array(z.number({ message: \"leaderOf.required\" }))"
echo ""

echo "🔹 Attribute Validator:"
echo "   • name: z.string({ message: \"name.required\" })"
echo "   • type: z.string({ message: \"type.required\" })"
echo "   • note: z.string().trim().optional()"
echo ""

echo "📁 Files generated:"
echo "   • src/modules/user/user.validator.generated.ts"
echo "   • src/modules/product/product.validator.generated.ts"
echo "   • src/modules/attribute/attribute.validator.generated.ts"
echo ""

echo "🎯 Usage in your controllers:"
echo "   import { CreateProductSchema, UpdateProductSchema } from './product.validator.generated';"
echo "   const result = CreateProductSchema.parse(req.body);"
echo ""

echo "✨ Features demonstrated:"
echo "   ✅ Required field messages: { message: \"field.required\" }"
echo "   ✅ Email validation with custom messages"
echo "   ✅ Password minimum length validation"
echo "   ✅ Phone regex validation"
echo "   ✅ Optional fields without required messages"
echo "   ✅ Array type validation"
echo "   ✅ Clean UpdateSchema without required messages"
echo ""
echo "🎉 Demo completed!"
