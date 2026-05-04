import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface ValidationErrors {
  title?: string;
  boardIdentifier?: string;
}

interface BoardFormData {
  title: string;
  boardIdentifier: string;
}

/**
 * Custom hook for board form validation
 * Centralizes validation logic for board create/edit forms
 */
export function useBoardValidation() {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateTitle = useCallback(
    (title: string): string | undefined => {
      if (!title.trim()) {
        return t('validation.titleRequired');
      }
      if (title.trim().length < 3) {
        return t('validation.titleMin3');
      }
      if (title.length > 50) {
        return t('validation.titleMax50');
      }
      return undefined;
    },
    [t]
  );

  const validateBoardIdentifier = useCallback(
    (boardIdentifier: string): string | undefined => {
      if (!boardIdentifier.trim()) {
        return undefined;
      }

      if (boardIdentifier.trim().length < 2) {
        return t('validation.identifierMin2');
      }
      if (boardIdentifier.trim().length > 10) {
        return t('validation.identifierMax10');
      }
      if (!/^[A-Za-z0-9-]+$/.test(boardIdentifier.trim())) {
        return t('validation.identifierFormat');
      }
      return undefined;
    },
    [t]
  );

  const validate = useCallback(
    (data: BoardFormData): boolean => {
      const newErrors: ValidationErrors = {};

      const titleError = validateTitle(data.title);
      if (titleError) {
        newErrors.title = titleError;
      }

      const identifierError = validateBoardIdentifier(data.boardIdentifier);
      if (identifierError) {
        newErrors.boardIdentifier = identifierError;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validateTitle, validateBoardIdentifier]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: keyof ValidationErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  return {
    errors,
    validate,
    validateTitle,
    validateBoardIdentifier,
    clearErrors,
    setError,
    setErrors,
  };
}

