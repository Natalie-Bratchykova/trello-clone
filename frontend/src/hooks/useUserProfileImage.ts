import { useState } from "react";
import {useMutation} from "@apollo/client/react";
import { useTranslation } from 'react-i18next';
import { UPLOAD_PROFILE_IMAGE } from "../helpers/gql/userGQL";


export const useUserProfileImageUpload = (userId: string, refetch: () => void) => {
    const [uploadProfileImage] = useMutation(UPLOAD_PROFILE_IMAGE);
    const { t } = useTranslation();

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
                message: t('profile.selectImage'),
                severity: "error",
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setSnackbar({
                open: true,
                message: t('profile.fileSizeLimit'),
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
                message: t('profile.photoUpdated'),
                severity: "success",
            });

            refetch();
        } catch (err) {
            setSnackbar({
                open: true,
                message: t('profile.photoError'),
                severity: "error",
            });
        }
    };

    return { handleImageUpload, snackbar, setSnackbar };
};