# Backend Express.js với TypeORM

Dự án backend sử dụng Express.js, TypeORM, và kiến trúc module với Dependency Injection.

## 🚀 Tính năng

- **Kiến trúc Module**: Cấu trúc code rõ ràng theo từng module
- **TypeScript**: Type-safe development
- **TypeORM**: ORM mạnh mẽ với MySQL
- **Inversify**: Dependency Injection container
- **JWT Authentication**: Xác thực với access token và refresh token
- **Zod Validation**: Validation mạnh mẽ cho input data
- **Error Handling**: Xử lý lỗi tập trung
- **Transaction Support**: Hỗ trợ database transactions

## 📁 Cấu trúc thư mục

```
src/
├── config/           # Cấu hình ứng dụng
├── database/         # Entities, migrations, seeders
├── modules/          # Các module nghiệp vụ
│   ├── auth/         # Module xác thực
│   ├── user/         # Module người dùng
│   └── comment/      # Module bình luận
├── shared/           # Code dùng chung
│   ├── base/         # Base classes
│   ├── middleware/   # Middleware
│   ├── types/        # Type definitions
│   └── utils/        # Utility functions
└── index.ts         # Entry point
```

## 🛠️ Cài đặt

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd backend-express-typeorm
   ```

2. **Cài đặt dependencies**

   ```bash
   npm install
   ```

3. **Cấu hình môi trường**

   ```bash
   cp .env.example .env
   ```

   Cập nhật file `.env` với thông tin database của bạn.

4. **Tạo database**

   ```bash
   mysql -u root -p
   CREATE DATABASE backend_db;
   ```

5. **Chạy migrations** (nếu có)

   ```bash
   npm run db:migrate
   ```

6. **Seed dữ liệu ban đầu**
   ```bash
   npm run db:seed
   ```

## 🏃‍♂️ Chạy ứng dụng

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## 📚 API Documentation

### Authentication

#### Đăng ký

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Đăng nhập

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Lấy thông tin user hiện tại

```http
GET /api/auth/me
Cookie: access_token=<jwt_token>
```

#### Refresh token

```http
POST /api/auth/refresh
Cookie: refresh_token=<refresh_token>
```

#### Đăng xuất

```http
POST /api/auth/logout
Cookie: access_token=<jwt_token>
```

### Users

#### Lấy danh sách users

```http
GET /api/users?page=1&limit=10&search=john&isActive=true
Cookie: access_token=<jwt_token>
```

#### Lấy thông tin user

```http
GET /api/users/:id
Cookie: access_token=<jwt_token>
```

#### Cập nhật user

```http
PUT /api/users/:id
Content-Type: application/json
Cookie: access_token=<jwt_token>

{
  "firstName": "John Updated",
  "lastName": "Doe Updated"
}
```

### Comments

#### Lấy danh sách comments

```http
GET /api/comments?page=1&limit=10&userId=<user_id>
```

#### Tạo comment mới

```http
POST /api/comments
Content-Type: application/json
Cookie: access_token=<jwt_token>

{
  "content": "This is a comment",
  "parentId": "optional-parent-comment-id"
}
```

#### Cập nhật comment

```http
PUT /api/comments/:id
Content-Type: application/json
Cookie: access_token=<jwt_token>

{
  "content": "Updated comment content"
}
```

## 🔧 Scripts

- `npm run dev` - Chạy ở mode development
- `npm run build` - Build production
- `npm start` - Chạy production build
- `npm run db:migrate` - Chạy migrations
- `npm run db:seed` - Seed dữ liệu

## 🗃️ Database Schema

### Users Table

- `id` (UUID, Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `firstName`
- `lastName`
- `avatar` (Optional)
- `isActive` (Boolean)
- `refreshToken` (Optional)
- `createdAt`
- `updatedAt`

### Comments Table

- `id` (UUID, Primary Key)
- `content` (Text)
- `parentId` (Optional, Self-reference)
- `userId` (Foreign Key to Users)
- `isActive` (Boolean)
- `createdAt`
- `updatedAt`

## 🔐 Authentication

Ứng dụng sử dụng JWT với hai loại token:

- **Access Token**: Thời gian sống ngắn (15 phút), được gửi qua HTTP-only cookie
- **Refresh Token**: Thời gian sống dài (7 ngày), dùng để làm mới access token

## 🛡️ Security Features

- HTTP-only cookies cho tokens
- Password hashing với bcrypt
- CORS protection
- Helmet for security headers
- Input validation với Zod
- SQL injection protection với TypeORM

## 📦 Dependencies chính

- **Express.js**: Web framework
- **TypeORM**: Object-Relational Mapping
- **Inversify**: Dependency Injection
- **JWT**: JSON Web Tokens
- **Zod**: Schema validation
- **bcryptjs**: Password hashing
- **MySQL2**: MySQL driver

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License

## 🧪 Testing

### Chạy test tự động

```bash
./test-api.sh
```

### Test thủ công

Xem chi tiết trong [API_TESTING.md](./API_TESTING.md)

### Credentials mặc định sau khi seed

- **Email**: admin@example.com
- **Password**: password123

### Quick test endpoints

```bash
# Health check
curl http://localhost:4500/health

# Login
curl -c cookies.txt -X POST http://localhost:4500/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# Get profile
curl -b cookies.txt http://localhost:4500/api/v1/auth/me
```

    const typeMap : Record<any, any> = {
      "confirm": {
        "pending": "CUS PENDING",
        "customer_pending": "CONFIRM",
      },
      "reject": {
      },
    }

    const status = typeMap[body?.status]?[exist];


    if (data.details && data.details.length > 0) {
      const options: FindManyOptions<AttributeDetail> = {
        where: {
          id: In(data.details),
        },
      };
      const attributeDetails = await this.attributeDetailRepository.findByOptions(options, tx.manager);

      if (attributeDetails.length !== data.details.length) {
        throw new BadRequestError("Some attribute details not found");
      }
      // product.details = attributeDetails;
      await tx.manager.save(product);
    }
