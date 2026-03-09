# Інтеграція завантаження зображення профілю - Підсумок

## Що було зроблено

Я успішно інтегрував функціонал завантаження зображення профілю користувача до вашого NestJS додатку.

### Змінені файли:

#### 1. `/backend/src/user/user.input.ts`
- ✅ Додано поле `profileImage?: string` до `CreateUserInput`
- ✅ Поле `profileImage` вже було в `UpdateUserInput`

#### 2. `/backend/src/user/user.resolver.ts`
- ✅ Додано імпорти `ImageService`, `Upload`, та `FileUpload`
- ✅ Додано `ImageService` в конструктор резолвера
- ✅ Додано нову мутацію `uploadProfileImage`:
```typescript
@Mutation(() => UserObject)
async uploadProfileImage(
  @Args('userId', { type: () => ID }) userId: string,
  @Args({ name: 'file', type: () => Upload }) file: Promise<FileUpload>,
) {
  const resolvedFile = await file;
  const imageUrl = await this.imageService.saveImage(resolvedFile);
  return this.userService.updateUser(userId, { profileImage: imageUrl });
}
```

#### 3. `/backend/src/user/user.module.ts`
- ✅ Додано імпорт `ImageService`
- ✅ Додано `ImageService` до providers

#### 4. `/backend/src/app.module.ts`
- ✅ Додано імпорти `UploadScalar`, `ImageResolver`, `ImageService`
- ✅ Додано всі три до providers: `[AppService, UploadScalar, ImageResolver, ImageService]`

#### 5. `/backend/src/main.ts`
- ✅ Додано імпорти `express` та `join` з `path`
- ✅ Додано обслуговування статичних файлів:
```typescript
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
```

## Як це працює

1. **Завантаження через мутацію**:
   - Клієнт викликає `uploadProfileImage(userId: ID!, file: Upload!)`
   - Файл зберігається в `backend/uploads/` з унікальним ім'ям
   - URL зображення (`/uploads/filename`) зберігається в базі даних

2. **Створення користувача з зображенням**:
   - При створенні користувача можна передати `profileImage` URL

3. **Оновлення зображення**:
   - Через `updateUser` можна оновити поле `profileImage`

## 🔴 ВАЖЛИВО: Перезапустіть сервер!

Після всіх змін **обов'язково перезапустіть** ваш NestJS сервер:

1. Зупиніть поточний процес (Ctrl+C в терміналі де запущений сервер)
2. Запустіть знову:
```bash
cd "/home/nata/ROAD MAPS/roadmap-to-04/backend"
npm run start:dev
```

Після перезапуску сервер повинен:
- ✅ Успішно запуститись без помилок про "Cannot determine a GraphQL input type"
- ✅ Згенерувати оновлену схему з мутаціями `uploadImage` та `uploadProfileImage`
- ✅ Додати scalar `Upload` до GraphQL схеми

## GraphQL мутації

Після успішного перезапуску у вас будуть доступні наступні мутації:

### 1. Завантаження зображення профілю
```graphql
mutation UploadProfileImage($userId: ID!, $file: Upload!) {
  uploadProfileImage(userId: $userId, file: $file) {
    id
    email
    name
    profileImage
  }
}
```

### 2. Завантаження зображення (загальна мутація)
```graphql
mutation UploadImage($file: Upload!) {
  uploadImage(file: $file)
}
```

### 3. Створення користувача з зображенням
```graphql
mutation CreateUser($data: CreateUserInput!) {
  createUser(data: $data) {
    id
    email
    profileImage
  }
}
```

## Приклад використання у Frontend (React + Apollo)

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
  const [uploadImage, { loading, error }] = useMutation(UPLOAD_PROFILE_IMAGE);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const { data } = await uploadImage({
          variables: { userId, file },
        });
        console.log('Uploaded:', data.uploadProfileImage.profileImage);
        // Показати зображення: http://localhost:3000${data.uploadProfileImage.profileImage}
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={loading}
      />
      {loading && <p>Завантаження...</p>}
      {error && <p>Помилка: {error.message}</p>}
    </div>
  );
}
```

## Технічні деталі

- **Шлях завантаження**: `/home/nata/ROAD MAPS/roadmap-to-04/backend/uploads/`
- **Формат імені файлу**: `{timestamp}-{uuid}-{original-filename}`
- **URL доступу**: `http://localhost:3000/uploads/{filename}`
- **Максимальний розмір**: 10MB (налаштовано в `graphqlUploadExpress`)
- **Максимум файлів**: 10 за раз

## Перевірка після перезапуску

1. Відкрийте GraphQL Playground: http://localhost:3000/graphql
2. Перевірте, чи є в схемі:
   - Scalar `Upload`
   - Mutation `uploadImage(file: Upload!): String!`
   - Mutation `uploadProfileImage(userId: ID!, file: Upload!): UserObject!`
3. Спробуйте завантажити файл через Playground або frontend

## Створена документація

- `/backend/src/user/PROFILE_IMAGE_UPLOAD.md` - детальна документація про використання

## Наступні кроки

1. ✅ **Перезапустіть сервер** (найважливіше!)
2. Перевірте, що мутації з'явились в GraphQL схемі
3. Протестуйте завантаження зображення через GraphQL Playground
4. Інтегруйте у frontend для завантаження аватарів користувачів

