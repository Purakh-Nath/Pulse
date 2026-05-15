export interface OptionAnalytics {
  optionId: string;
  optionText: string;
  count: number;
  percentage: number;
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  totalAnswers: number;
  options: OptionAnalytics[];
}

export interface PollAnalytics {
  totalResponses: number;
  completionRate: number;
  activeUsers: number;
  questions: QuestionAnalytics[];
}

export interface PollResults {
  poll: {
    id: string;
    title: string;
    description?: string;
    status: string;
    publishResults: boolean;
  };
  analytics: PollAnalytics;
  publishedAt?: string;
}

export interface AnalyticsCountResponse {
  pollId: string;
  count: number;
}
