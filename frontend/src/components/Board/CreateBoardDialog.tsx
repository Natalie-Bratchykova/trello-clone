import {useState} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import {Close} from '@mui/icons-material';
import {useTranslation} from 'react-i18next';
import {formatDate} from "../../helpers/utils/dateLocale.ts";
import {useBoardActions} from "../../hooks/useBoardActions.ts";
import {useBoardValidation} from "../../hooks/useBoardValidation.ts";

interface CreateBoardData {
    createBoard: {
        id: string;
        title: string;
        color: string;
        boardIdentifier: string;
        createdAt: string;
        updatedAt: string;
    };
}

interface CreateBoardVars {
    title: string;
    color: string;
    userId: string|undefined;
    boardIdentifier?: string;
}

interface CreateBoardDialogProps {
    onClose: () => void,
    userId?: string,
    onBoardCreated: () => void,
    open?: boolean
}

const COLOR_KEYS = ['blue', 'green', 'orange', 'red', 'purple', 'pink', 'lightBlue', 'lime', 'darkBlue', 'gray'];
const COLOR_VALUES = ['#0079bf', '#61bd4f', '#ff9f1a', '#eb5a46', '#c377e0', '#ff78cb', '#00c2e0', '#51e898', '#344563', '#838c91'];

export default function CreateBoardDialog({onClose, userId, onBoardCreated, open}: CreateBoardDialogProps) {
    const {t, i18n} = useTranslation();
    const [title, setTitle] = useState('');
    const [boardIdentifier, setBoardIdentifier] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLOR_VALUES[0]);

    const {createBoard, createBoardLoading} = useBoardActions();
    const validation = useBoardValidation();

    const handleCreateSuccess = (data: CreateBoardData) => {
        if (data.createBoard) {
            onBoardCreated();
            handleClose();
        }
    };

    const handleCreateError = (error: Error) => {
        console.error('Error creating board:', error);
    };

    const handleClose = () => {
        setTitle('');
        setBoardIdentifier('');
        setSelectedColor(COLOR_VALUES[0]);
        validation.clearErrors();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validation.validate({ title, boardIdentifier })) {
            return;
        }

        try {
            const variables: CreateBoardVars = {
                title: title.trim(),
                color: selectedColor,
                userId,
                boardIdentifier: boardIdentifier.trim()
            };
            if (boardIdentifier.trim()) {
                variables.boardIdentifier = boardIdentifier.trim();
            }

            const result = await createBoard({variables});

            if (result.data) {
                handleCreateSuccess(result.data);
            }
        } catch (err) {
            if (err instanceof Error) {
                handleCreateError(err);
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {borderRadius: 2},
            }}
        >
            <DialogTitle sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Box component="span" sx={{fontSize: '1.25rem', fontWeight: 600}}>
                    {t('createBoard.title')}
                </Box>
                <Button
                    onClick={handleClose}
                    sx={{minWidth: 'auto', p: 0.5}}
                    disabled={createBoardLoading}
                >
                    <Close/>
                </Button>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label={t('createBoard.projectName')}
                        placeholder={t('createBoard.projectNamePlaceholder')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        error={!!validation.errors.title}
                        helperText={validation.errors.title}
                        margin="normal"
                        disabled={createBoardLoading}
                        inputProps={{maxLength: 50}}
                    />

                    <TextField
                        fullWidth
                        label={t('createBoard.projectIdentifier')}
                        placeholder={t('createBoard.projectIdentifierPlaceholder')}
                        value={boardIdentifier}
                        onChange={(e) => setBoardIdentifier(e.target.value.toUpperCase())}
                        error={!!validation.errors.boardIdentifier}
                        helperText={validation.errors.boardIdentifier || t('createBoard.identifierHelp')}
                        margin="normal"
                        disabled={createBoardLoading}
                        inputProps={{maxLength: 10}}
                    />

                    <Box sx={{mt: 3}}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('createBoard.chooseColor')}
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: 1.5,
                                mt: 2,
                            }}
                        >
                            {COLOR_VALUES.map((value, idx) => (
                                <Box
                                    key={value}
                                    onClick={() => !createBoardLoading && setSelectedColor(value)}
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        backgroundColor: value,
                                        borderRadius: 1,
                                        cursor: createBoardLoading ? 'not-allowed' : 'pointer',
                                        border: selectedColor === value ? '3px solid' : '2px solid transparent',
                                        borderColor: selectedColor === value ? 'primary.main' : 'transparent',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        '&:hover': {
                                            transform: createBoardLoading ? 'none' : 'scale(1.1)',
                                            boxShadow: createBoardLoading ? 0 : 2,
                                        },
                                    }}
                                    title={t(`colors.${COLOR_KEYS[idx]}`)}
                                >
                                    {selectedColor === value && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                color: 'white',
                                                fontSize: 20,
                                            }}
                                        >
                                            ✓
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{mt: 3}}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('createBoard.preview')}
                        </Typography>
                        <Box
                            sx={{
                                mt: 1,
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderTop: `4px solid ${selectedColor}`,
                            }}
                        >
                            <Typography variant="h6">
                                {title.trim() || t('createBoard.projectName')}
                            </Typography>
                            {boardIdentifier.trim() && (
                                <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                                    {t('createBoard.identifier')}: <strong>{boardIdentifier.trim()}</strong>
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                                {t('board.created')}: {formatDate(i18n.language, undefined, false)}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{px: 3, pb: 3}}>
                    <Button onClick={handleClose} disabled={createBoardLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={createBoardLoading}
                        startIcon={createBoardLoading ? <CircularProgress size={16}/> : null}
                    >
                        {createBoardLoading ? t('common.creating') : t('createBoard.createButton')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
