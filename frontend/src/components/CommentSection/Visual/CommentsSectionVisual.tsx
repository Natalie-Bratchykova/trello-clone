import {memo} from "react";
import {Avatar, Box, Button, CircularProgress, Divider, IconButton, Tooltip, Typography} from "@mui/material";
import ReactQuill from "react-quill-new";
import {Check, Checklist, Close, Delete, Edit, Send} from "@mui/icons-material";
import TextEditorUneditable from "../../Ticket/TextEditorUneditable.tsx";
import ChecklistRenderer from "../Logic/CheckListRenderer.tsx";
import i18n, {t} from "i18next";
import {
    descriptionToChecklist, formatRelativeTime, isChecklist,
    isQuillContentEmpty,
    QUILL_FORMATS,
    QUILL_MODULES
} from "../../../helpers/utils/textEditorHelper.ts";
import {getUserProfileUrl} from "../../../helpers/utils/userHelper.ts";

function CommentsSectionVisual(props){
    let {comments,
        newComment,
        setNewComment,
        creating,
        cardDescription,
        loading,
        handleSubmit,
        editingId,
        setEditingId,
        handleUpdate,
        handleChecklistToggle,
        editContent,
        setEditContent,
        startEdit,
        handleDelete,
        currentUser} = props;

    return (<Box>
        <Typography variant="h6" sx={{fontWeight: 600, mb: 2}}>
            {t('comments.title')} {comments.length > 0 && `(${comments.length})`}
        </Typography>

        {/* New comment input */}
        <Box sx={{display: 'flex', gap: 1.5, mb: 3, alignItems: 'flex-start'}}>
            <Avatar
                sx={{width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.main', mt: 0.5}}
                src={getUserProfileUrl(currentUser?.profileImage)}
            >
                {currentUser?.name?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{flex: 1}}>
                <Box
                    sx={{
                        '& .ql-container': {
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                            fontSize: '0.875rem',
                        },
                        '& .ql-toolbar': {
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4,
                        },
                        '& .ql-editor': {
                            minHeight: 80,
                            maxHeight: 200,
                            overflowY: 'auto',
                        },
                    }}
                >
                    <ReactQuill
                        theme="snow"
                        value={newComment}
                        onChange={setNewComment}
                        modules={QUILL_MODULES(true)}
                        formats={QUILL_FORMATS()}
                        placeholder={t('comments.placeholder')}
                        readOnly={creating}
                    />
                </Box>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Typography variant="caption" color="text.secondary">
                            {t('comments.ctrlEnter')}
                        </Typography>
                        {cardDescription && !isQuillContentEmpty(cardDescription) && (
                            <Tooltip title={t('comments.copyAsChecklist')} arrow>
                                <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<Checklist sx={{fontSize: 16}}/>}
                                    onClick={() => {
                                        const checklist = descriptionToChecklist(cardDescription);
                                        if (checklist) setNewComment(checklist);
                                    }}
                                    sx={{textTransform: 'none', fontSize: '0.75rem'}}
                                >
                                    {t('comments.copyAsChecklist')}
                                </Button>
                            </Tooltip>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        size="small"
                        endIcon={<Send sx={{fontSize: 16}}/>}
                        onClick={handleSubmit}
                        disabled={isQuillContentEmpty(newComment) || creating}
                    >
                        {t('comments.send')}
                    </Button>
                </Box>
            </Box>
        </Box>

        {loading && (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 3}}>
                <CircularProgress size={24}/>
            </Box>
        )}

        {/* Comments list */}
        {comments.length === 0 && !loading && (
            <Typography variant="body2" color="text.disabled" sx={{fontStyle: 'italic', textAlign: 'center', py: 2}}>
                {t('comments.noComments')}
            </Typography>
        )}

        {comments.map((comment, index) => (
            <Box key={comment.id}>
                {index > 0 && <Divider sx={{my: 2}}/>}
                <Box sx={{display: 'flex', gap: 1.5}}>
                    <Avatar
                        src={getUserProfileUrl(comment.user.profileImage)}
                        sx={{width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'secondary.main', mt: 0.5}}
                    >
                        {!comment.user.profileImage && comment.user.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{flex: 1, minWidth: 0}}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
                            <Typography variant="body2" sx={{fontWeight: 600}}>
                                {comment.user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatRelativeTime(comment.createdAt, t, i18n.language)}
                            </Typography>
                            {comment.createdAt !== comment.updatedAt && (
                                <Typography variant="caption" color="text.secondary" sx={{fontStyle: 'italic'}}>
                                    {t('comments.edited')}
                                </Typography>
                            )}
                        </Box>
                        {editingId === comment.id ? (
                            <Box>
                                <Box
                                    sx={{
                                        '& .ql-container': {
                                            borderBottomLeftRadius: 4,
                                            borderBottomRightRadius: 4,
                                            fontSize: '0.875rem',
                                        },
                                        '& .ql-toolbar': {
                                            borderTopLeftRadius: 4,
                                            borderTopRightRadius: 4,
                                        },
                                        '& .ql-editor': {
                                            minHeight: 60,
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                        },
                                    }}
                                >
                                    <ReactQuill
                                        theme="snow"
                                        value={editContent}
                                        onChange={setEditContent}
                                        modules={QUILL_MODULES(true)}
                                        formats={QUILL_FORMATS()}
                                    />
                                </Box>
                                <Box sx={{display: 'flex', gap: 0.5, mt: 0.5}}>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleUpdate(comment.id)}
                                        disabled={isQuillContentEmpty(editContent)}
                                    >
                                        <Check fontSize="small"/>
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => setEditingId(null)}
                                    >
                                        <Close fontSize="small"/>
                                    </IconButton>
                                </Box>
                            </Box>
                        ) : (
                            <Box>
                                {isChecklist(comment.content) ? (
                                    <ChecklistRenderer
                                        html={comment.content}
                                        onToggle={(_idx, updatedHtml) => {
                                            handleChecklistToggle(comment.id, updatedHtml);
                                        }}
                                    />
                                ) : (
                                    <TextEditorUneditable html={comment.content}/>
                                )}

                                {currentUser?.id === comment.userId && (
                                    <Box sx={{display: 'flex', gap: 0.5, mt: 0.5}}>
                                        <IconButton size="small" onClick={() => startEdit(comment)}
                                                    sx={{opacity: 0.6, '&:hover': {opacity: 1}}}>
                                            <Edit sx={{fontSize: 16}}/>
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(comment.id)}
                                            sx={{opacity: 0.6, '&:hover': {opacity: 1}}}
                                        >
                                            <Delete sx={{fontSize: 16}}/>
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        ))}
    </Box>);
}

export default memo(CommentsSectionVisual);