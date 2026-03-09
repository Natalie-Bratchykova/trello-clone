# Завантаження зображення профілю користувача

## Огляд
Модуль користувача тепер підтримує завантаження зображень профілю через GraphQL мутацію.

## Функціонал

### 1. Мутація для завантаження зображення профілю

```graphql
mutation UploadProfileImage($userId: ID!, $file: Upload!) {
  uploadProfileImage(userId: $userId, file: $file) {
    id
    email
    name
    profileImage
    createdAt
    updatedAt
  }
}
```

### 2. Створення користувача з зображенням профілю

Ви можете передати URL зображення при створенні користувача:

```graphql
mutation CreateUser($data: CreateUserInput!) {
  createUser(data: $data) {
    id
    email
    name
    profileImage
  }
}
```

Приклад змінних:
```json
{
  "data": {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "profileImage": "/uploads/profile-image.jpg"
  }
}
```

### 3. Оновлення зображення профілю

Через мутацію `updateUser`:

```graphql
mutation UpdateUser($id: ID!, $data: UpdateUserInput!) {
  updateUser(id: $id, data: $data) {
    id
    profileImage
  }
}
```

## Технічні деталі

### Файли, що були змінені:

1. **user.input.ts** - додано поле `profileImage` до `CreateUserInput`
2. **user.resolver.ts** - додано мутацію `uploadProfileImage`
3. **user.module.ts** - підключено `ImageService`

### Як працює завантаження:

1. Клієнт відправляє файл через GraphQL мутацію `uploadProfileImage`
2. `ImageService` зберігає файл у директорії `backend/uploads/`
3. Повертається URL типу `/uploads/timestamp-uuid-filename.jpg`
4. URL зберігається в базі даних для користувача
5. Клієнт може використовувати цей URL для відображення зображення

### Приклад використання в frontend (React + Apollo):

```typescript
import { useMutation, gql } from '@apollo/client';

const UPLOAD_PROFILE_IMAGE = gql`
  mutation UploadProfileImage($userId: ID!, $file: Upload!) {
    uploadProfileImage(userId: $userId, file: $file) {
      id
      profileImage
    }
  }
`;

function ProfileImageUpload({ userId }) {
  const [uploadImage] = useMutation(UPLOAD_PROFILE_IMAGE);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const { data } = await uploadImage({
          variables: { userId, file },
        });
        console.log('Image uploaded:', data.uploadProfileImage.profileImage);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleFileChange} 
    />
  );
}
```

## Важливі примітки

- Зображення зберігаються в директорії `backend/uploads/`
- Імена файлів генеруються автоматично з timestamp та UUID для уникнення конфліктів
- Backend повертає відносний шлях `/uploads/filename`
- Переконайтесь, що директорія `backend/uploads/` існує та має права на запис
- Для обслуговування статичних файлів потрібно налаштувати Express middleware в `main.ts`

## Налаштування статичних файлів

Якщо ще не налаштовано, додайте в `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Обслуговування статичних файлів
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  
  await app.listen(3000);
}
bootstrap();
```

