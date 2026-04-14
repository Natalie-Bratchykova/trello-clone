
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Paper, TextField } from '@mui/material';
import { Add } from '@mui/icons-material';
import { CREATE_LIST_MUTATION } from '../../helpers/gql/listGQL';

interface AddListCardProps {
    boardId: string;
    onListCreated: () => void;
}

export default function AddListCard({ boardId, onListCreated }: AddListCardProps) {
    const { t } = useTranslation();
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');

    const [createList, { loading }] = useMutation(CREATE_LIST_MUTATION, {
        onCompleted: () => {
            setTitle('');
            setIsAdding(false);
            onListCreated();
        },
    });

    const handleCreate = async () => {
        if (!title.trim()) return;
        await createList({ variables: { title: title.trim(), boardId } });
    };

    return (
        <Paper sx={{ minWidth: 300, maxWidth: 300, maxHeight: 'calc(100vh - 250px)', backgroundColor: isAdding ? 'background.paper' : 'action.hover', p: 2 }}>
            {isAdding ? (
                <Box>
                    <TextField
                        fullWidth size="small"
                        placeholder={t('board.enterListName')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                        autoFocus disabled={loading}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button variant="contained" size="small" onClick={handleCreate} disabled={loading || !title.trim()}>
                            {t('common.add')}
                        </Button>
                        <Button size="small" onClick={() => { setIsAdding(false); setTitle(''); }} disabled={loading}>
                            {t('common.cancel')}
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Button fullWidth startIcon={<Add />} onClick={() => setIsAdding(true)} sx={{ justifyContent: 'flex-start' }}>
                    {t('board.addList')}
                </Button>
            )}
        </Paper>
    );
}
