import { Paper, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface BasicInfoSectionProps {
  title: string;
  setTitle: (value: string) => void;
  boardIdentifier: string;
  setBoardIdentifier: (value: string) => void;
  errors: { title?: string; boardIdentifier?: string };
  setHasChanges: (changed: boolean) => void;
}

export default function BasicInfoSection({
  title,
  setTitle,
  boardIdentifier,
  setBoardIdentifier,
  errors,
  setHasChanges,
}: BasicInfoSectionProps) {
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {t('projectEdit.basicInfo')}
      </Typography>

      <TextField
        fullWidth
        label={t('projectEdit.projectName')}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setHasChanges(true);
        }}
        error={!!errors.title}
        helperText={errors.title}
        margin="normal"
        inputProps={{ maxLength: 50 }}
      />

      <TextField
        fullWidth
        label={t('projectEdit.projectIdentifier')}
        placeholder={t('createBoard.projectIdentifierPlaceholder')}
        value={boardIdentifier}
        onChange={(e) => {
          setBoardIdentifier(e.target.value.toUpperCase());
          setHasChanges(true);
        }}
        error={!!errors.boardIdentifier}
        helperText={errors.boardIdentifier || t('projectEdit.identifierHelp')}
        margin="normal"
        inputProps={{ maxLength: 10 }}
      />
    </Paper>
  );
}

