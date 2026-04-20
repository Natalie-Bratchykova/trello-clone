import { useState } from 'react';


import 'react-quill-new/dist/quill.snow.css';

import {isQuillContentEmpty,} from "../helpers/utils/textEditorHelper.ts";
import type {Comment, CommentsSectionProps} from '../helpers/types/commentTypes.ts';
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetCardCommentsLazyQuery,
  useUpdateCommentMutation
} from "../generated/graphql.ts";
import CommentsSectionVisual from "./CommentSection/Visual/CommentsSectionVisual.tsx";
import { useUserContext } from '../context/UserContext';


export default function CommentsSection({ cardId, cardDescription }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { user: currentUser } = useUserContext();

  const { data, loading, refetch } = useGetCardCommentsLazyQuery({ variables: { cardId }, skip: !cardId,});

  const [createComment, { loading: creating }] = useCreateCommentMutation({
        onCompleted: () => {
          setNewComment('');
          refetch();
        }
      }
  )

  const [updateComment] = useUpdateCommentMutation({
    onCompleted: () => {
      setEditingId(null);
      setEditContent('');
      refetch();
    },
  })

  const [deleteComment] = useDeleteCommentMutation({ onCompleted: () => refetch()});

  const handleSubmit = () => {
    if (isQuillContentEmpty(newComment) || !currentUser?.id) return;
    createComment({
      variables: {
        data: {
          content: newComment,
          cardId,
          userId: currentUser.id,
        },
      },
    });
  };

  const handleUpdate = (id: string) => {
    if (isQuillContentEmpty(editContent)) return;
    updateComment({
      variables: {
        id,
        data: { content: editContent },
        userId: currentUser.id,
      },
    });
  };

  const handleChecklistToggle = (id: string, updatedHtml: string) => {
    if (isQuillContentEmpty(updatedHtml)) return;
    updateComment({
      variables: {
        id,
        data: { content: updatedHtml },
        userId: currentUser.id,
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteComment({
      variables: { id, userId: currentUser.id },
    });
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const comments = data?.cardComments || [];

  const props = {comments,
    currentUser,
    newComment,
    setNewComment,
    creating,
    cardDescription,
    loading,
    handleSubmit,
    editingId,
    setEditingId,
    editContent,
    setEditContent,
    handleUpdate,
    handleChecklistToggle,
    startEdit,
    handleDelete};

  return <CommentsSectionVisual {...props}/>;

}