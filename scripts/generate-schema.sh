#!/bin/bash

# Script để tạo schema từ entities

echo "🔧 Qlbh - Schema Generation từ Entities"
echo "============================================="

# Kiểm tra môi trường
if [ ! -f "package.json" ]; then
    echo "❌ Không tìm thấy package.json. Chạy script từ thư mục gốc của dự án."
    exit 1
fi

# Menu lựa chọn
echo "Chọn hành động:"
echo "1. Tạo/cập nhật schema từ entities (giữ nguyên dữ liệu)"
echo "2. Tạo lại toàn bộ schema (XÓA toàn bộ dữ liệu cũ)"
echo "3. Kiểm tra trạng thái schema hiện tại"
echo "4. Thoát"

read -p "Nhập lựa chọn (1-4): " choice

case $choice in
    1)
        echo "🚀 Tạo/cập nhật schema từ entities..."
        npx ts-node src/database/schema-from-entities.ts
        ;;
    2)
        echo "⚠️  CẢNH BÁO: Hành động này sẽ XÓA toàn bộ dữ liệu hiện có!"
        read -p "Bạn có chắc chắn muốn tiếp tục? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            echo "🚀 Tạo lại toàn bộ schema..."
            npx ts-node src/database/schema-from-entities.ts --recreate
        else
            echo "❌ Đã hủy bỏ"
        fi
        ;;
    3)
        echo "🔍 Kiểm tra trạng thái schema..."
        npx ts-node src/database/check-sync.ts
        ;;
    4)
        echo "👋 Tạm biệt!"
        exit 0
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ"
        exit 1
        ;;
esac

echo "✅ Hoàn thành!"
