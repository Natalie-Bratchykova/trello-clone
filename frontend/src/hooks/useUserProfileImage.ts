import { useState } from "react";
import {useMutation} from "@apollo/client/react";
import { useTranslation } from 'react-i18next';
import { UPLOAD_PROFILE_IMAGE } from "../helpers/gql/userGQL";

const STORAGE_USER_KEY = 'user';

const rewriteStoredUserProfileImage = (userId: string, profileImage?: string | null) => {
    if (!profileImage) return;

    try {
        const raw = localStorage.getItem(STORAGE_USER_KEY);
        if (!raw) return;

        const storedUser = JSON.parse(raw) as { id?: string; profileImage?: string };
        if (!storedUser?.id || storedUser.id !== userId) return;

        localStorage.setItem(
            STORAGE_USER_KEY,
            JSON.stringify({
                ...storedUser,
                profileImage,
            }),
        );
    } catch {
        // Ignore malformed localStorage payloads.
    }
};

type UserRefetchResult = {
    data?: {
        user?: {
            profileImage?: string | null;
        };
    };
};

export const useUserProfileImageUpload = (
    userId: string,
    refetch: () => Promise<UserRefetchResult>,
) => {
    const [uploadProfileImage] = useMutation<unknown, { userId: string; file: File }>(UPLOAD_PROFILE_IMAGE);
    const { t } = useTranslation();
    const tr = (key: string) => t(key as never);

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
                message: tr('profile.selectImage'),
                severity: "error",
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setSnackbar({
                open: true,
                message: tr('profile.fileSizeLimit'),
                severity: "error",
            });
            return;
        }

        try {
            await uploadProfileImage({
                variables: { userId, file },
            } as never);

            setSnackbar({
                open: true,
                message: tr('profile.photoUpdated'),
                severity: "success",
            });

            const data = await refetch();
            const profileImage = data?.data?.user?.profileImage as string | undefined;

            rewriteStoredUserProfileImage(userId, profileImage ?? null);
            window.dispatchEvent(
                new CustomEvent('update-image', {
                    detail: {
                        data: profileImage,
                    },
                }),
            );
        } catch (err) {
            setSnackbar({
                open: true,
                message: tr('profile.photoError'),
                severity: "error",
            });
        }
    };

    return { handleImageUpload, snackbar, setSnackbar };
};