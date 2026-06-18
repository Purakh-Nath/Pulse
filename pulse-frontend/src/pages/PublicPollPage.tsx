import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { usePoll } from '@/hooks/usePoll';
import { useSubmitResponse } from '@/hooks/useSubmitResponse';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';

export default function PublicPollPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: poll, isLoading, isError } = usePoll(slug ?? '');
  if (poll) console.log("Current Poll UUID:", poll.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { mutate: submitResponse, isPending } = useSubmitResponse({
    pollId: poll?.id ?? '',
    onSuccess: () => {
      setHasSubmitted(true);
      // Wait a moment for celebration animation, then redirect if results are public
      setTimeout(() => {
        if (poll?.publishResults) {
          navigate(`/results/${poll.slug}`);
        }
      }, 2000);
    },
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const questions = useMemo(() => {
    if (!poll?.questions) return [];
    return [...poll.questions].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [poll?.questions]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-12" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !poll) {
    return (
      <div className="pt-20">
        <EmptyState
          title="Poll not found"
          description="This poll may have been deleted or the link is invalid."
          action={
            <Button onClick={() => navigate('/')}>Return Home</Button>
          }
        />
      </div>
    );
  }

  const isExpired =
    poll.status === 'expired' ||
    poll.status === 'closed' ||
    (poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false);

  if (isExpired) {
    return (
      <div className="max-w-2xl mx-auto w-full pt-12 pb-24 px-4">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger/10 rounded-full text-xs font-medium text-danger mb-6">
            <AlertCircle className="w-4 h-4" />
            {poll.status === 'closed' ? 'Closed' : 'Expired'}
          </div>
          <h1 className="font-heading text-4xl font-bold text-text-heading dark:text-text-dark-h mb-4 text-balance">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-lg text-text-muted dark:text-text-dark text-balance mx-auto max-w-2xl mb-8">
              {poll.description}
            </p>
          )}
        </div>

        <div className="card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <p className="text-text-heading dark:text-text-dark-h text-lg font-semibold mb-2">
              Voting is closed for this poll.
            </p>
            <p className="text-text-muted dark:text-text-dark">
              Final results are available below.
            </p>
          </div>

          {poll.responsesMode === 'authenticated' && !isAuthenticated ? (
            <div className="space-y-6">
              <p className="text-text-muted dark:text-text-dark">
                This poll requires sign in to view final results.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                  navigate('/login');
                }}
              >
                Sign In to View Results
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => navigate(`/results/${poll.slug}`)}
            >
              View Final Results
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (poll.responsesMode === 'authenticated' && !isAuthenticated) {
    return (
      <div className="pt-20 max-w-md mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-accent-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-text-heading dark:text-text-dark-h mb-2">
            Sign in required
          </h2>
          <p className="text-text-muted dark:text-text-dark mb-8">
            The creator of this poll requires participants to be signed in to vote.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              // Store current URL to redirect back after login
              sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
              navigate('/login');
            }}
          >
            Sign In to Vote
          </Button>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto pt-32 text-center px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-success" />
        </motion.div>
        <h2 className="font-heading text-3xl font-bold text-text-heading dark:text-text-dark-h mb-3">
          Response recorded!
        </h2>
        <p className="text-text-muted dark:text-text-dark mb-8">
          Thank you for participating.
        </p>
        {!poll.publishResults && (
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        )}
      </motion.div>
    );
  }

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const currentAnswer = answers[currentQuestion.id];
  const canProceed = currentAnswer || !currentQuestion.isRequired;

  const handleNext = () => {
    if (isLastQuestion) {
      const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
        questionId: qId,
        optionId: oId,
      }));
      submitResponse({ answers: formattedAnswers });
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
  if (currentStep > 0) {
    setCurrentStep((prev) => prev - 1);
  }
};

  const progress = ((currentStep) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto w-full pt-12 pb-24 px-4">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl font-bold text-text-heading dark:text-text-dark-h mb-4 text-balance">
          {poll.title}
        </h1>
        {poll.description && (
          <p className="text-lg text-text-muted dark:text-text-dark text-balance">
            {poll.description}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-text-muted dark:text-text-dark mb-2">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% completed</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-accent-hover"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="card p-6 sm:p-8"
        >
          <h2 className="font-heading text-2xl font-semibold text-text-heading dark:text-text-dark-h mb-6">
            {currentQuestion.text}
            {currentQuestion.isRequired && (
              <span className="text-danger ml-1">*</span>
            )}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: option.id,
                      }))
                    }
                    className={cn(
                      'w-full flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200',
                      isSelected
                        ? 'border-accent bg-accent-bg shadow-md'
                        : 'border-border dark:border-border-dark hover:border-accent/50 bg-bg-2 dark:bg-bg-dark-2'
                    )}
                  >
                    <div className="flex-1 text-text-heading dark:text-text-dark-h font-medium">
                      {option.text}
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 ml-4 flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'border-accent bg-accent'
                          : 'border-border dark:border-border-dark'
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
          </div>

<div className="mt-8 flex justify-between">
  <Button
    variant="secondary"
    size="lg"
    onClick={handlePrevious}
    disabled={currentStep === 0}
    iconLeft={<ChevronLeft className="w-5 h-5" />}
  >
    Back
  </Button>

  <Button
    size="lg"
    disabled={!canProceed || isPending}
    loading={isPending}
    onClick={handleNext}
    iconRight={!isLastQuestion && <ChevronRight className="w-5 h-5" />}
  >
    {isLastQuestion ? 'Submit Response' : 'Continue'}
  </Button>
</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
