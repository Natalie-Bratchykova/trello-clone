import { useState, useMemo, FormEvent } from 'react';

import 'react-quill-new/dist/quill.snow.css';
import {
  useCreateCardMutation,
  useGetBoardCardsForCreateLazyQuery, useGetBoardCardsForCreateQuery,
  useGetUsersLazyQuery,
  useGetUsersQuery
} from "../../../generated/graphql.ts";
import CreateCartVisual from "../Visual/CreateCartVisual.tsx";
import {t} from 'i18next';


// TODO start: repeats in visual component
interface User {
  id: string;
  name: string;
  email: string;
}
interface ParentCardOption {
  id: string;
  title: string;
  suffix?: string;
  listTitle?: string;
}
// TODO end: repeats in visual component


interface CreateCardDialogProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
  boardId?: string;
  onCardCreated: () => void;
}

export default function CreateCardDialog({
  open,
  onClose,
  listId,
  listTitle,
  boardId,
  onCardCreated,
}: CreateCardDialogProps) {
  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [assignee, setAssignee] = useState<User | null>(null);
  const [parentTask, setParentTask] = useState<ParentCardOption | null>(null);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [cardType, setCardType] = useState<'TASK' | 'RELEASE'>('TASK');
  const [selectedReleaseTaskIds, setSelectedReleaseTaskIds] = useState<string[]>([]);

  const { data: usersData, loading: usersLoading } = useGetUsersQuery({
    skip: !open,
  });


  const { data: boardData } = useGetBoardCardsForCreateQuery({
    variables: { boardId },
    skip: !open || !boardId,
  });

  const [createCard, { loading }] =useCreateCardMutation();

  const users: User[] = usersData?.users ?? [];

  const parentCardOptions: ParentCardOption[] = useMemo(() => {
    if (!boardData?.board?.lists) return [];
    const options: ParentCardOption[] = [];
    for (const list of boardData.board.lists) {
      for (const c of list.cards) {
        options.push({
          id: c.id,
          title: c.title,
          suffix: c.suffix,
          listTitle: list.title,
        });
      }
    }
    return options;
  }, [boardData]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('LOW');
    setAssignee(null);
    setParentTask(null);
    setErrors({});
    setCardType('TASK');
    setSelectedReleaseTaskIds([]);
    onClose();
  };

  const validateForm = () => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      // @ts-ignore
      newErrors.title = t('validation.cardTitleRequired');
    } else if (title.trim().length < 2) {
      // @ts-ignore
      newErrors.title = t('validation.cardTitleMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const cleanDescription = description.replace(/<(.|\n)*?>/g, '').trim()
        ? description.trim()
        : undefined;

      // @ts-ignore
      const result = await createCard({
        variables: {
          title: title.trim(),
          description: cleanDescription,
          listId,
          dueDate: dueDate || undefined,
          priority,
          userId: assignee?.id || undefined,
          parentId: parentTask?.id || undefined,
          type: cardType,
          releaseTaskIds: cardType === 'RELEASE' && selectedReleaseTaskIds.length > 0
            ? selectedReleaseTaskIds
            : undefined,
        },
      });

      if (result.data) {
        onCardCreated();
        handleClose();
      }
    } catch (err) {
      console.error('Error creating card:', err);
    }
  };

  const props = {
    handleClose,
    // todo - list title here should be separated on Provider
    listTitle,
    open,
    // todo end
    loading,
    handleSubmit,
    cardType,
    setCardType,
    title,
    setTitle,
    errors,
    description,
    setDescription,
    priority,
    setPriority,
    users,
    assignee,
    setAssignee,
    usersLoading,
    boardId,
    parentTask,
    setParentTask,
    parentCardOptions,
    selectedReleaseTaskIds,
    setSelectedReleaseTaskIds,
    dueDate,
    setDueDate
  }

  return <CreateCartVisual {...props}/>;
}

