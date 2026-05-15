import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {DndContext,closestCenter,KeyboardSensor,PointerSensor,useSensor,useSensors,type DragEndEvent,} from '@dnd-kit/core';
import {SortableContext,sortableKeyboardCoordinates,verticalListSortingStrategy,useSortable,} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {Plus,Trash2,GripVertical,Settings,ArrowLeft,Save,Send,} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { pollsService } from '@/api/polls';
import toast from 'react-hot-toast';
import { POLL_LIMITS } from '@/config/constants';

// Zod Schema
const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text is required').max(100, 'Too long'),
  displayOrder: z.number().optional(),
});

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question text is required').max(300, 'Too long'),
  isRequired: z.boolean(),
  displayOrder: z.number().optional(),
  options: z
    .array(optionSchema)
    .min(POLL_LIMITS.MIN_OPTIONS, `At least ${POLL_LIMITS.MIN_OPTIONS} options required`)
    .max(POLL_LIMITS.MAX_OPTIONS, `Max ${POLL_LIMITS.MAX_OPTIONS} options`),
});

const pollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(POLL_LIMITS.TITLE_MAX, 'Title too long'),
  description: z.string().max(POLL_LIMITS.DESCRIPTION_MAX, 'Description too long').optional(),
  responsesMode: z.enum(['anonymous', 'authenticated']),
  publishResults: z.boolean(),
  expiresAt: z.string().optional(),
  questions: z
    .array(questionSchema)
    .min(POLL_LIMITS.MIN_QUESTIONS, `At least ${POLL_LIMITS.MIN_QUESTIONS} question required`)
    .max(POLL_LIMITS.MAX_QUESTIONS, `Max ${POLL_LIMITS.MAX_QUESTIONS} questions`),
});

type PollFormValues = z.infer<typeof pollSchema>;

export default function PollBuilderPage() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If pollId exists, we'd normally fetch it. For now, creating new.
  // const { data: existingPoll, isLoading } = usePoll(pollId ?? '');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: '',
      description: '',
      responsesMode: 'anonymous',
      publishResults: false,
      questions: [
        {
          text: '',
          isRequired: true,
          options: [{ text: '' }, { text: '' }],
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f: any) => f.id === active.id);
      const newIndex = fields.findIndex((f: any) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  const onSubmit = async (data: PollFormValues, publish = false) => {
    try {
      setIsSubmitting(true);
      // Map displayOrder
      const payload = {
        ...data,
        status: (publish ? 'published' : 'draft') as any,
        expiresAt: data.expiresAt 
    ? new Date(data.expiresAt).toISOString()  // utc
    : undefined,
        questions: data.questions.map((q, qIndex) => ({
          ...q,
          displayOrder: qIndex,
          options: q.options.map((o, oIndex) => ({
            ...o,
            displayOrder: oIndex,
          })),
        })),
      };

      const poll = await pollsService.createPoll(payload);

      if (publish) {
        toast.success('Poll published successfully! Redirecting to live analytics...');
        navigate(`/dashboard/polls/${poll.slug}/analytics`);
      } else {
        toast.success('Draft saved successfully!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-14 lg:top-0 bg-[#F7F7F4]/80 dark:bg-[#0F1115]/80 backdrop-blur-md py-4 z-20 -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-2xl font-bold text-[#111] dark:text-white">
            {pollId ? 'Edit Poll' : 'Create Poll'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleSubmit((data) => onSubmit(data, false))}
            disabled={isSubmitting}
            icon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit((data) => onSubmit(data, true))}
            loading={isSubmitting}
            icon={<Send className="w-4 h-4" />}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Form */}
        <div className="flex-1 space-y-6">
          <div className="card p-6">
            <input
              {...register('title')}
              placeholder="Poll Title"
              className="w-full text-3xl font-heading font-bold bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-[#111] dark:text-white mb-2"
            />
            {errors.title && (
              <p className="text-[#FF5A5F] text-sm mt-1">{errors.title.message}</p>
            )}
            
            <textarea
              {...register('description')}
              placeholder="Add a description (optional)"
              className="w-full text-sm bg-transparent border-none outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-[#5E5E5E] dark:text-gray-300 h-20"
            />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f: any) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {fields.map((field: any, index: number) => (
                  <SortableQuestion
                    key={field.id}
                    id={field.id}
                    index={index}
                    register={register}
                    control={control}
                    remove={remove}
                    errors={errors}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="secondary"
            className="w-full py-6 border-dashed border-2"
            onClick={() =>
              append({
                text: '',
                isRequired: true,
                options: [{ text: '' }, { text: '' }],
              })
            }
            icon={<Plus className="w-5 h-5" />}
          >
            Add Question
          </Button>
        </div>

        {/* Settings Sidebar */}
        <div className="w-80 shrink-0 hidden md:block">
          <div className="card p-6 sticky top-32 space-y-6">
            <div className="flex items-center gap-2 mb-4 text-[#111] dark:text-white font-heading font-semibold">
              <Settings className="w-5 h-5" />
              Settings
            </div>

            <Controller
              name="responsesMode"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  checked={field.value === 'authenticated'}
                  onChange={(val) =>
                    field.onChange(val ? 'authenticated' : 'anonymous')
                  }
                  label="Require Sign In"
                  description="Users must be logged in to vote"
                />
              )}
            />

            <Controller
              name="publishResults"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  checked={field.value}
                  onChange={field.onChange}
                  label="Public Results"
                  description="Allow anyone to view analytics"
                />
              )}
            />

            <div>
              <label className="block text-sm font-medium text-[#111] dark:text-white mb-2">
                Expiry Date (Required)
              </label>
              <input
                type="datetime-local"
                {...register('expiresAt')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for sortable question
function SortableQuestion({
  id,
  index,
  register,
  control,
  remove,
  errors,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const { fields, append, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-6 relative group ${
        isDragging ? 'shadow-float ring-2 ring-[#6C63FF]' : ''
      }`}
    >
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="pl-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              {...register(`questions.${index}.text`)}
              placeholder="Question text"
              className="w-full text-lg font-medium bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-[#6C63FF] outline-none transition-colors pb-1 text-[#111] dark:text-white"
            />
            {errors?.questions?.[index]?.text && (
              <p className="text-[#FF5A5F] text-xs mt-1">
                {errors.questions[index].text.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="p-2 text-gray-400 hover:text-[#FF5A5F] hover:bg-[#FF5A5F]/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {fields.map((option: any, oIndex: number) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                <input
                  {...register(`questions.${index}.options.${oIndex}.text`)}
                  placeholder={`Option ${oIndex + 1}`}
                  className="flex-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF] text-[#111] dark:text-white"
                />
                {fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(oIndex)}
                    className="p-1.5 text-gray-400 hover:text-[#FF5A5F] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {errors?.questions?.[index]?.options && (
              <p className="text-[#FF5A5F] text-xs mt-1">
                {errors.questions[index].options.message}
              </p>
          )}

          {fields.length < POLL_LIMITS.MAX_OPTIONS && (
            <div className="flex items-center gap-3 pt-2">
              <div className="w-5 h-5 shrink-0" />
              <button
                type="button"
                onClick={() => append({ text: '' })}
                className="text-sm font-medium text-[#6C63FF] hover:underline"
              >
                Add Option
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <Controller
            name={`questions.${index}.isRequired`}
            control={control}
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value}
                onChange={field.onChange}
                label="Response required ?"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}

// X icon
function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
