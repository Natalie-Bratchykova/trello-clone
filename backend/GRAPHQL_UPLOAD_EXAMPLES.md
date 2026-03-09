# GraphQL Запити для тестування завантаження зображень

## Використання через GraphQL Playground

### 1. Завантаження зображення профілю

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

**Variables:**
```json
{
  "userId": "ваш-user-id"
}
```

**Для відправки файлу через Playground:**
1. У правій панелі "HTTP HEADERS" додайте:
```json
{
  "Apollo-Require-Preflight": "true"
}
```

2. У секції "Query Variables" внизу буде кнопка для вибору файлу

---

### 2. Загальне завантаження зображення

```graphql
mutation UploadImage($file: Upload!) {
  uploadImage(file: $file)
}
```

**Повертає:** `/uploads/timestamp-uuid-filename.jpg`

---

### 3. Отримання інформації про користувача з зображенням

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
    profileImage
  }
}
```

---

### 4. Оновлення зображення профілю через updateUser

```graphql
mutation UpdateUser($id: ID!, $data: UpdateUserInput!) {
  updateUser(id: $id, data: $data) {
    id
    email
    name
    profileImage
  }
}
```

**Variables:**
```json
{
  "id": "user-id",
  "data": {
    "profileImage": "/uploads/new-image.jpg"
  }
}
```

---

### 5. Створення користувача з зображенням

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

**Variables:**
```json
{
  "data": {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "profileImage": "/uploads/default-avatar.jpg"
  }
}
```

---

## Приклад використання через curl

### Завантаження зображення

```bash
curl http://localhost:3000/graphql \
  -F operations='{"query": "mutation UploadImage($file: Upload!) { uploadImage(file: $file) }", "variables": {"file": null}}' \
  -F map='{"0": ["variables.file"]}' \
  -F 0=@/path/to/your/image.jpg
```

### Завантаження зображення профілю

```bash
curl http://localhost:3000/graphql \
  -F operations='{"query": "mutation UploadProfileImage($userId: ID!, $file: Upload!) { uploadProfileImage(userId: $userId, file: $file) { id profileImage } }", "variables": {"userId": "YOUR_USER_ID", "file": null}}' \
  -F map='{"0": ["variables.file"]}' \
  -F 0=@/path/to/your/avatar.jpg
```

---

## Доступ до завантажених зображень

Після завантаження зображення буде доступне за адресою:

```
http://localhost:3000/uploads/{filename}
```

Наприклад:
```
http://localhost:3000/uploads/1772453923456-a1b2c3d4-avatar.jpg
```

---

## Тестування у React/TypeScript

```typescript
import { gql, useMutation } from '@apollo/client';

const UPLOAD_PROFILE_IMAGE = gql`
  mutation UploadProfileImage($userId: ID!, $file: Upload!) {
    uploadProfileImage(userId: $userId, file: $file) {
      id
      profileImage
    }
  }
`;

function useProfileImageUpload() {
  const [uploadMutation, { loading, error }] = useMutation(UPLOAD_PROFILE_IMAGE);

  const uploadImage = async (userId: string, file: File) => {
    try {
      const { data } = await uploadMutation({
        variables: { userId, file },
      });
      return data.uploadProfileImage.profileImage;
    } catch (err) {
      console.error('Upload failed:', err);
      throw err;
    }
  };

  return { uploadImage, loading, error };
}

// Використання:
function ProfileEditor({ userId }: { userId: string }) {
  const { uploadImage, loading } = useProfileImageUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = await uploadImage(userId, file);
      console.log('Image uploaded to:', imageUrl);
      // Тепер можна показати зображення:
      // <img src={`http://localhost:3000${imageUrl}`} />
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
      disabled={loading}
    />
  );
}
```

---

## Можливі помилки та їх вирішення

### 1. "Cannot determine a GraphQL input type (Upload)"
**Рішення:** Переконайтеся, що `UploadScalar` додано до providers в `app.module.ts`

### 2. "File size too large"
**Рішення:** Збільшіть `maxFileSize` в `graphqlUploadExpress` в `main.ts`

### 3. "ENOENT: no such file or directory"
**Рішення:** Створіть директорію `uploads` в корені backend:
```bash
mkdir -p backend/uploads
```

### 4. "403 Forbidden" при доступі до /uploads
**Рішення:** Переконайтеся, що в `main.ts` додано:
```typescript
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
```

---

## Перевірка налаштування

Після перезапуску сервера перевірте у GraphQL Playground Schema:

```graphql
# Повинен бути присутній scalar:
scalar Upload

# Повинні бути мутації:
type Mutation {
  uploadImage(file: Upload!): String!
  uploadProfileImage(userId: ID!, file: Upload!): UserObject!
  # ...інші мутації
}
```

