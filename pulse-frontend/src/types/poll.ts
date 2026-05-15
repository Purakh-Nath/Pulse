export type PollStatus = 'draft' | 'published' | 'active' | 'expired' | 'closed';
export type ResponsesMode = 'anonymous' | 'authenticated';

export interface PollOption {
  id: string;
  text: string;
  displayOrder: number;
}

export interface PollQuestion {
  id: string;
  text: string;
  isRequired: boolean;
  displayOrder: number;
  options: PollOption[];
}

export interface Poll {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: PollStatus;
  ownerId?: string;
  responsesMode: ResponsesMode;
  publishResults: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  questions: PollQuestion[];
  _count?: {
    responses: number;
  };
}

export interface PollSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: PollStatus;
  responsesMode: ResponsesMode;
  publishResults: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    responses: number;
  };
}

// Form types
export interface CreatePollOptionInput {
  text: string;
  displayOrder?: number;
}

export interface CreatePollQuestionInput {
  text: string;
  isRequired?: boolean;
  displayOrder?: number;
  options: CreatePollOptionInput[];
}

export interface CreatePollInput {
  title: string;
  description?: string;
  responsesMode?: ResponsesMode;
  publishResults?: boolean;
  expiresAt?: string;
  status?: PollStatus;
  questions: CreatePollQuestionInput[];
}

export interface UpdatePollInput extends Partial<CreatePollInput> {}

// Response submission
export interface AnswerInput {
  questionId: string;
  optionId: string;
}

export interface SubmitResponseInput {
  answers: AnswerInput[];
}
