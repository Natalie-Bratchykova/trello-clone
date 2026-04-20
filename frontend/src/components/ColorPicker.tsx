import { useTranslation } from 'react-i18next';
import {Box, Paper, Tooltip, Typography} from "@mui/material";

const PRESET_COLORS = [
    { nameKey: 'colors.blue', value: '#0079bf' },
    { nameKey: 'colors.green', value: '#61bd4f' },
    { nameKey: 'colors.orange', value: '#ff9f1a' },
    { nameKey: 'colors.red', value: '#eb5a46' },
    { nameKey: 'colors.purple', value: '#c377e0' },
    { nameKey: 'colors.pink', value: '#ff78cb' },
    { nameKey: 'colors.lightBlue', value: '#00c2e0' },
    { nameKey: 'colors.lime', value: '#51e898' },
    { nameKey: 'colors.darkBlue', value: '#344563' },
    { nameKey: 'colors.gray', value: '#838c91' },
];

interface ColorPickerProps {
    color: string;
    setColor: (color: string) => void;
    setHasChanges: (changed: boolean) => void;
    title: string;
    boardIdentifier: string;
}

export default function ColorPicker({ color, setColor, setHasChanges, title, boardIdentifier }: ColorPickerProps) {
    const { t } = useTranslation();
    
    return(
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {t('projectEdit.projectColor')}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 1.5,
                    maxWidth: 320,
                }}
            >
                {PRESET_COLORS.map((c) => (
                    <Tooltip key={c.value} title={t(c.nameKey)}>
                        <Box
                            onClick={() => { setColor(c.value); setHasChanges(true); }}
                            sx={{
                                width: '100%',
                                aspectRatio: '1',
                                backgroundColor: c.value,
                                borderRadius: 1,
                                cursor: 'pointer',
                                border: color === c.value ? '3px solid' : '2px solid transparent',
                                borderColor: color === c.value ? 'primary.main' : 'transparent',
                                transition: 'all 0.2s',
                                position: 'relative',
                                '&:hover': { transform: 'scale(1.1)', boxShadow: 2 },
                            }}
                        >
                            {color === c.value && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: 'white',
                                        fontSize: 20,
                                        fontWeight: 700,
                                    }}
                                >
                                    ✓
                                </Box>
                            )}
                        </Box>
                    </Tooltip>
                ))}
            </Box>

            {/* Preview */}
            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderTop: `4px solid ${color}`,
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {title || t('projectEdit.projectName')}
                </Typography>
                {boardIdentifier && (
                    <Typography variant="body2" color="text.secondary">
                        {t('createBoard.identifier')}: <strong>{boardIdentifier}</strong>
                    </Typography>
                )}
            </Box>
        </Paper>
    )
}