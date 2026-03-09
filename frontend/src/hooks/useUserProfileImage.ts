import { gql,  } from "@apollo/client";
import { useState } from "react";
import {useMutation} from "@apollo/client/react";

const UPLOAD_PROFILE_IMAGE = gql`
  mutation UploadProfileImage($userId: ID!, $file: Upload!) {
    uploadProfileImage(userId: $userId, file: $file) {
      id
      profileImage
    }
  }
`;

export const useUserProfileImage = (userId: string, refetch: () => void) => {
    const [uploadProfileImage] = useMutation(UPLOAD_PROFILE_IMAGE);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setSnackbar({
                open: true,
                message: "Будь ласка, виберіть зображення",
                severity: "error",
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setSnackbar({
                open: true,
                message: "Розмір файлу не повинен перевищувати 10MB",
                severity: "error",
            });
            return;
        }

        try {
            await uploadProfileImage({
                variables: { userId, file },
            });

            setSnackbar({
                open: true,
                message: "Фото профілю оновлено!",
                severity: "success",
            });

            refetch();
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Помилка при завантаженні фото",
                severity: "error",
            });
        }
    };

    return { handleImageUpload, snackbar, setSnackbar };
};