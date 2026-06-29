import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {DndContext,closestCenter,KeyboardSensor,PointerSensor,useSensor,useSensors,type DragEndEvent,} from '@dnd-kit/core';
import {SortableContext,sortableKeyboardCoordinates,verticalListSortingStrategy,useSortable,} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical, Settings, ArrowLeft, Save, Send, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Drawer } from '@/components/ui/Drawer';
import { PollSettings } from '@/components/shared/PollSettings';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-fill expiry to 12 hours from now in local time
  const getDefaultExpiry = () => {
    const defaultExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const tzOffset = defaultExpiry.getTimezoneOffset() * 60000;
    return new Date(defaultExpiry.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  const initialExpiry = getDefaultExpiry();

  const { data: existingPoll } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: () => pollsService.getPollById(pollId!),
    enabled: !!pollId,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: '',
      description: '',
      responsesMode: 'anonymous',
      publishResults: false,
      expiresAt: initialExpiry,
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

  useEffect(() => {
    if (existingPoll) {
      reset({
        title: existingPoll.title,
        description: existingPoll.description || '',
        responsesMode: existingPoll.responsesMode,
        publishResults: existingPoll.publishResults,
        expiresAt: existingPoll.expiresAt
          ? new Date(existingPoll.expiresAt).toISOString().slice(0, 16)
          : initialExpiry,
        questions: existingPoll.questions.map((q) => ({
          ...q,
          options: q.options.map((o) => ({ ...o })),
        })),
      });
    }
  }, [existingPoll, reset, initialExpiry]);

  // Calculate active settings indicator
  const responsesMode = watch('responsesMode');
  const publishResults = watch('publishResults');
  const expiresAt = watch('expiresAt');

  let activeSettingsCount = 0;
  if (responsesMode !== 'anonymous') activeSettingsCount++;
  if (publishResults !== false) activeSettingsCount++;
  if (expiresAt !== initialExpiry) activeSettingsCount++;

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
        status: (publish ? 'active' : 'draft') as any,
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

      let poll;
      if (pollId) {
        poll = await pollsService.updatePoll(pollId, {
          title: payload.title,
          description: payload.description,
          responsesMode: payload.responsesMode,
          publishResults: payload.publishResults,
          expiresAt: payload.expiresAt,
          status: publish ? 'active' : undefined,
        });
      } else {
        poll = await pollsService.createPoll(payload);
      }

      if (publish) {
        toast.success('Poll published successfully! Redirecting to live analytics...');
        navigate(`/dashboard/polls/${poll.slug}/analytics`);
      } else {
        toast.success(pollId ? 'Changes saved successfully!' : 'Draft saved successfully!');
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
      <div className="flex items-center justify-between mb-8 sticky top-14 lg:top-0 bg-bg/80 dark:bg-bg-dark/80 backdrop-blur-md py-4 z-20 -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-2xl font-bold text-text-heading dark:text-text-dark-h">
            {pollId ? 'Edit Poll' : 'Create Poll'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setIsSettingsOpen(true)}
            className="lg:hidden relative mr-2"
            icon={<Settings className="w-5 h-5" />}
          >
            Settings
            {activeSettingsCount > 0 && (
              <span className="ml-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold bg-accent text-white rounded-full">
                {activeSettingsCount}
              </span>
            )}
          </Button>

          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              {pollId ? 'Save Changes' : 'Save Draft'}
            </Button>
            {(!pollId || existingPoll?.status === 'draft') && (
              <Button
                onClick={handleSubmit((data) => onSubmit(data, true))}
                loading={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Form */}
        <div className="flex-1 space-y-6">
          {pollId && (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                <strong>Edit Mode:</strong> You are editing an existing poll's settings. 
                Questions and options cannot be modified to maintain data integrity.
              </p>
            </div>
          )}
          <div className="card p-6">
            <input
              {...register('title')}
              placeholder="Poll Title"
              className="w-full text-3xl font-heading font-bold bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-text-heading dark:text-text-dark-h mb-2"
            />
            {errors.title && (
              <p className="text-danger text-sm mt-1">{errors.title.message}</p>
            )}
            
            <textarea
              {...register('description')}
              placeholder="Add a description (optional)"
              className="w-full text-sm bg-transparent border-none outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-text-muted dark:text-text-dark h-20"
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
                    isReadOnly={!!pollId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {!pollId && (
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
          )}
        </div>

        {/* Settings Sidebar - Desktop Only */}
        <div className="w-80 shrink-0 hidden lg:block">
          <div className="card p-6 sticky top-32 space-y-6">
            <div className="flex items-center gap-2 mb-4 text-text-heading dark:text-text-dark-h font-heading font-semibold">
              <Settings className="w-5 h-5" />
              Settings
              {activeSettingsCount > 0 && (
                <span className="ml-auto text-xs font-medium text-text-muted dark:text-text-dark bg-bg-2 dark:bg-bg-dark-2 px-2 py-0.5 rounded-full">
                  {activeSettingsCount} active
                </span>
              )}
            </div>

            <PollSettings control={control} register={register} />
          </div>
        </div>
      </div>

      {/* Drawer for Mobile/Tablet Settings */}
      <Drawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        placement={isMobile ? 'bottom' : 'right'}
        title="Settings"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSettingsOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <PollSettings control={control} register={register} />
      </Drawer>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-bg/90 dark:bg-bg-dark/90 backdrop-blur-md border-t border-border dark:border-border-dark p-4 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Button
          variant="secondary"
          onClick={handleSubmit((data) => onSubmit(data, false))}
          disabled={isSubmitting}
          className="flex-1"
        >
          {pollId ? 'Save Changes' : 'Save Draft'}
        </Button>
        {(!pollId || existingPoll?.status === 'draft') && (
          <Button
            onClick={handleSubmit((data) => onSubmit(data, true))}
            loading={isSubmitting}
            className="flex-1"
          >
            Publish
          </Button>
        )}
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
  isReadOnly,
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
        isDragging ? 'shadow-float ring-2 ring-accent' : ''
      }`}
    >
      {!isReadOnly && (
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}

      <div className="pl-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              {...register(`questions.${index}.text`)}
              disabled={isReadOnly}
              placeholder="Question text"
              className="w-full text-lg font-medium bg-transparent border-b border-transparent hover:border-border dark:hover:border-border-dark focus:border-accent outline-none transition-colors pb-1 text-text-heading dark:text-text-dark-h disabled:opacity-70 disabled:hover:border-transparent"
            />
            {errors?.questions?.[index]?.text && (
              <p className="text-danger text-xs mt-1">
                {errors.questions[index].text.message}
              </p>
            )}
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
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
                <div className="w-5 h-5 rounded-full border-2 border-border dark:border-border-dark shrink-0" />
                <input
                  {...register(`questions.${index}.options.${oIndex}.text`)}
                  disabled={isReadOnly}
                  placeholder={`Option ${oIndex + 1}`}
                  className="flex-1 bg-bg-2 dark:bg-bg-dark-2 border border-border dark:border-border-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent text-text-heading dark:text-text-dark-h disabled:opacity-70"
                />
                {!isReadOnly && fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(oIndex)}
                    className="p-1.5 text-gray-400 hover:text-danger transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {errors?.questions?.[index]?.options && (
              <p className="text-danger text-xs mt-1">
                {errors.questions[index].options.message}
              </p>
          )}

          {!isReadOnly && fields.length < POLL_LIMITS.MAX_OPTIONS && (
            <div className="flex items-center gap-3 pt-2">
              <div className="w-5 h-5 shrink-0" />
              <button
                type="button"
                onClick={() => append({ text: '' })}
                className="text-sm font-medium text-accent hover:underline"
              >
                Add Option
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border dark:border-border-dark flex justify-end">
          <Controller
            name={`questions.${index}.isRequired`}
            control={control}
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value}
                onChange={isReadOnly ? () => {} : field.onChange}
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
