import "server-only";

import { z } from "zod";

type QuestCategory = "fitness" | "mind" | "study" | "work" | "social" | "creative";
type QuestDifficulty = "easy" | "medium" | "hard" | "epic";
type QuestStatus = "active" | "completed" | "failed";
type WeeklyPlanDifficulty = "rest" | "easy" | "moderate" | "hard";

export interface AICoachConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICoachQuestCatalogEntry {
  id: string;
  title: string;
  description: string | null;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xpReward: number;
  targetValue: number;
  unit: string | null;
  isDaily: boolean;
}

export interface AICoachRecentQuestEntry {
  questId: string;
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  progress: number;
  xpReward: number;
  updatedAt: string;
  completedAt: string | null;
}

export interface AICoachXPEvent {
  amount: number;
  reason: string;
  createdAt: string;
  questId: string | null;
}

export interface AICoachUserContext {
  userId: string;
  displayName: string;
  level: number;
  xp: number;
  xpToNext: number;
  streakDays: number;
  language: "en" | "mn";
  latestRequest: string;
  conversation: AICoachConversationMessage[];
  questCatalog: AICoachQuestCatalogEntry[];
  recentQuestHistory: AICoachRecentQuestEntry[];
  activeQuests: AICoachRecentQuestEntry[];
  recentXpEvents: AICoachXPEvent[];
}

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

export class AIProviderError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "AIProviderError";
    this.status = status;
  }
}

const weeklyTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().min(5).max(240),
  successMetric: z.string().min(1),
  categoryHint: z.enum(["fitness", "mind", "study", "work", "social", "creative", "general"]),
});

const weeklyDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  label: z.string().min(1),
  focus: z.string().min(1),
  difficulty: z.enum(["rest", "easy", "moderate", "hard"]),
  isRecoveryDay: z.boolean(),
  estimatedTotalMinutes: z.number().int().min(0).max(360),
  tasks: z.array(weeklyTaskSchema).max(4),
  supportActions: z.array(z.string()).max(4),
  coachingNote: z.string().min(1),
});

export const workoutPlanSchema = z
  .object({
    coachSummary: z.string().min(1),
    personalizationSummary: z.string().min(1),
    weekFocus: z.string().min(1),
    difficultyAdjustment: z.string().min(1),
    recoveryStrategy: z.string().min(1),
    progressionRule: z.string().min(1),
    warningNotes: z.array(z.string()).max(6),
    schedule: z.array(weeklyDaySchema).length(7),
    suggestedQuestIds: z.array(z.string()).max(4),
  })
  .superRefine((plan, ctx) => {
    const recoveryDays = plan.schedule.filter((day) => day.isRecoveryDay);
    if (recoveryDays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The weekly plan must include at least one lighter recovery day.",
      });
    }

    const uniqueDayNumbers = new Set(plan.schedule.map((day) => day.dayNumber));
    if (uniqueDayNumbers.size !== 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each weekly plan day must use a unique dayNumber from 1 to 7.",
      });
    }
  });

export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

export interface GeneratedWorkoutPlanResult {
  plan: WorkoutPlan;
  source: "openai" | "fallback";
  providerError?: string;
}

const workoutPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "coachSummary",
    "personalizationSummary",
    "weekFocus",
    "difficultyAdjustment",
    "recoveryStrategy",
    "progressionRule",
    "warningNotes",
    "schedule",
    "suggestedQuestIds",
  ],
  properties: {
    coachSummary: { type: "string" },
    personalizationSummary: { type: "string" },
    weekFocus: { type: "string" },
    difficultyAdjustment: { type: "string" },
    recoveryStrategy: { type: "string" },
    progressionRule: { type: "string" },
    warningNotes: {
      type: "array",
      items: { type: "string" },
    },
    suggestedQuestIds: {
      type: "array",
      items: { type: "string" },
    },
    schedule: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "dayNumber",
          "label",
          "focus",
          "difficulty",
          "isRecoveryDay",
          "estimatedTotalMinutes",
          "tasks",
          "supportActions",
          "coachingNote",
        ],
        properties: {
          dayNumber: { type: "integer" },
          label: { type: "string" },
          focus: { type: "string" },
          difficulty: {
            type: "string",
            enum: ["rest", "easy", "moderate", "hard"],
          },
          isRecoveryDay: { type: "boolean" },
          estimatedTotalMinutes: { type: "integer" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "title",
                "description",
                "estimatedMinutes",
                "successMetric",
                "categoryHint",
              ],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                estimatedMinutes: { type: "integer" },
                successMetric: { type: "string" },
                categoryHint: {
                  type: "string",
                  enum: ["fitness", "mind", "study", "work", "social", "creative", "general"],
                },
              },
            },
          },
          supportActions: {
            type: "array",
            items: { type: "string" },
          },
          coachingNote: { type: "string" },
        },
      },
    },
  },
} as const;

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  if (!apiKey) {
    throw new AIConfigurationError("OPENAI_API_KEY is not configured.");
  }

  return { apiKey, model };
}

function buildConversationTranscript(messages: AICoachConversationMessage[]) {
  return messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

function inferRequestedCategory(user: AICoachUserContext): QuestCategory | null {
  const text =
    `${user.latestRequest}\n${buildConversationTranscript(user.conversation)}`.toLowerCase();
  if (/(workout|gym|exercise|cardio|fitness|bulchin|fitn|дасгал|бэлтгэл)/i.test(text))
    return "fitness";
  if (/(study|learn|exam|reading|course|leetcode|сурах|шалгалт|хичээл)/i.test(text)) return "study";
  if (/(work|career|project|deep work|focus|ажил|төсөл)/i.test(text)) return "work";
  if (/(meditate|journal|mental|sleep|mind|амралт|бясалгал|сэтгэл)/i.test(text)) return "mind";
  if (/(friend|family|network|social|харилцаа|найз)/i.test(text)) return "social";
  if (/(draw|design|music|write|creative|бүтээлч|зурах|бичих)/i.test(text)) return "creative";
  return null;
}

function shouldCoachAsFitnessFirst(user: AICoachUserContext) {
  const text =
    `${user.latestRequest}\n${buildConversationTranscript(user.conversation)}`.toLowerCase();
  if (
    /(study|learn|exam|reading|course|leetcode|сурах|шалгалт|хичээл|career|project|ажил|төсөл)/i.test(
      text,
    )
  ) {
    return false;
  }

  return true;
}

function buildUserContextSnapshot(user: AICoachUserContext) {
  const completedQuests = user.recentQuestHistory.filter((quest) => quest.status === "completed");
  const completionRate =
    user.recentQuestHistory.length > 0
      ? Math.round((completedQuests.length / user.recentQuestHistory.length) * 100)
      : 0;

  return {
    hunter: {
      userId: user.userId,
      displayName: user.displayName,
      level: user.level,
      xp: user.xp,
      xpToNext: user.xpToNext,
      streakDays: user.streakDays,
      language: user.language,
    },
    progressSignals: {
      completionRate,
      activeQuestCount: user.activeQuests.length,
      completedQuestCount: completedQuests.length,
    },
    latestRequest: user.latestRequest,
    inferredCategory: inferRequestedCategory(user),
    recentQuestHistory: user.recentQuestHistory.slice(0, 12),
    recentXpEvents: user.recentXpEvents.slice(0, 12),
    activeQuests: user.activeQuests.slice(0, 8),
    availableQuestCatalog: user.questCatalog.slice(0, 20),
    conversationTranscript: buildConversationTranscript(user.conversation),
  };
}

function buildDeveloperPrompt(user: AICoachUserContext, retryInstruction?: string) {
  const contextSnapshot = buildUserContextSnapshot(user);
  const fitnessFirst = shouldCoachAsFitnessFirst(user);

  return [
    "Generate a personalized 7-day coaching plan in JSON for Sentinel Nexus.",
    "You are an elite fitness coach with many years of experience in strength training, hypertrophy, conditioning, recovery, exercise selection, load management, and behavior change.",
    "Coach with the judgment of a high-level in-person trainer: practical, direct, technically sound, and focused on sustainable progress.",
    "The user's latest request contains the desired requirements. Treat those requirements as the main constraint.",
    "Rules:",
    "- The schedule must cover exactly 7 days.",
    "- Include at least 1 lighter recovery or catch-up day.",
    "- The plan must reflect the user's custom goals, constraints, and preferred theme from the latest request.",
    "- Each day should have 0-4 concrete tasks, each with a clear success metric.",
    "- Keep text concise, practical, and coach-like rather than generic.",
    "- Prioritize progressive overload, good exercise selection, recovery, technique quality, realistic volume, and adherence.",
    "- Avoid unsafe advice, fake certainty, or unrealistic intensity spikes.",
    "- If the request is ambiguous, make sensible coaching assumptions and still return a useful plan.",
    "- Suggested quest IDs must come only from the provided quest catalog.",
    "- Prefer quest categories that match the user's request when possible.",
    "- Use the requested language for all natural-language fields.",
    fitnessFirst
      ? "- Unless the user clearly asks for a non-fitness domain, default to a fitness-first coaching plan."
      : "- The user asked for a non-fitness domain, but still keep the tone disciplined, performance-oriented, and coach-like.",
    retryInstruction ?? "",
    `Context:\n${JSON.stringify(contextSnapshot, null, 2)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new AIProviderError("OpenAI returned an invalid response payload.");
  }

  const maybePayload = payload as {
    status?: string;
    incomplete_details?: { reason?: string } | null;
    output_text?: unknown;
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
        refusal?: string;
      }>;
    }>;
  };

  if (maybePayload.status && maybePayload.status !== "completed") {
    const incompleteReason = maybePayload.incomplete_details?.reason;
    if (incompleteReason === "max_output_tokens") {
      throw new AIProviderError(
        "OpenAI stopped early because the weekly task plan hit the output token limit.",
      );
    }

    throw new AIProviderError(
      `OpenAI did not finish generating the weekly task plan (status: ${maybePayload.status}).`,
    );
  }

  if (typeof maybePayload.output_text === "string" && maybePayload.output_text.trim()) {
    return maybePayload.output_text;
  }

  const chunks: string[] = [];
  for (const item of maybePayload.output ?? []) {
    if (!item || item.type !== "message") continue;

    for (const content of item.content ?? []) {
      if (content?.type === "refusal" && typeof content.refusal === "string") {
        throw new AIProviderError(content.refusal, 422);
      }

      if (content?.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  const aggregatedText = chunks.join("\n").trim();
  if (!aggregatedText) {
    throw new AIProviderError("OpenAI returned no structured weekly task plan.");
  }

  return aggregatedText;
}

async function requestStructuredWorkoutPlan(user: AICoachUserContext, retryInstruction?: string) {
  const { apiKey, model } = getOpenAIConfig();
  const latestRequest =
    user.latestRequest || "Build me a 7-day fitness plan like an elite coach would.";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: {
        effort: "low",
      },
      max_output_tokens: 7000,
      instructions:
        "You are Sentinel Nexus' production AI fitness coach. Think like a top-tier coach who balances performance, hypertrophy, recovery, mobility, consistency, and injury risk. Always respond with compact JSON that matches the schema.",
      input: [
        {
          role: "developer",
          content: buildDeveloperPrompt(user, retryInstruction),
        },
        {
          role: "user",
          content: latestRequest,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "sentinel_nexus_weekly_task_plan",
          strict: true,
          schema: workoutPlanJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AIProviderError(
      errorText || `OpenAI request failed with status ${response.status}.`,
      response.status,
    );
  }

  const payload = (await response.json()) as unknown;
  const rawText = extractOutputText(payload);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new AIProviderError("OpenAI returned invalid JSON for the weekly task plan.");
  }

  try {
    return workoutPlanSchema.parse(parsedJson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIProviderError(
        `OpenAI returned a weekly task plan that failed validation: ${error.issues[0]?.message ?? "schema mismatch"}.`,
      );
    }

    throw error;
  }
}

function buildSuggestedQuestIds(user: AICoachUserContext) {
  const activeQuestIds = new Set(user.activeQuests.map((quest) => quest.questId));
  const preferredCategory = inferRequestedCategory(user);
  const filtered = user.questCatalog.filter((quest) => !activeQuestIds.has(quest.id));
  const preferred = preferredCategory
    ? filtered.filter((quest) => quest.category === preferredCategory)
    : filtered;

  return (preferred.length > 0 ? preferred : filtered).slice(0, 4).map((quest) => quest.id);
}

function fallbackTask(
  title: string,
  description: string,
  estimatedMinutes: number,
  successMetric: string,
  categoryHint: WorkoutPlan["schedule"][number]["tasks"][number]["categoryHint"],
) {
  return {
    title,
    description,
    estimatedMinutes,
    successMetric,
    categoryHint,
  };
}

function buildFallbackWorkoutPlan(user: AICoachUserContext): WorkoutPlan {
  const isMn = user.language === "mn";
  const suggestedQuestIds = buildSuggestedQuestIds(user);
  const preferredCategory = inferRequestedCategory(user) ?? "fitness";
  const lighterWeek = user.streakDays === 0 || user.level <= 2;

  const requirementSummary = user.latestRequest.trim()
    ? user.latestRequest.trim()
    : isMn
      ? "Чиний зорилгод тааруулсан 7 хоногийн fitness төлөвлөгөө"
      : "A 7-day fitness plan built around your goal";

  const categoryTaskSets: Record<
    QuestCategory | "general",
    Array<{ focusEn: string; focusMn: string; tasks: ReturnType<typeof fallbackTask>[] }>
  > = {
    fitness: [
      {
        focusEn: "Strength and movement",
        focusMn: "Хүч ба хөдөлгөөн",
        tasks: [
          fallbackTask(
            "Main session",
            "Complete a focused strength or bodyweight session.",
            45,
            "Finish the full session.",
            "fitness",
          ),
          fallbackTask(
            "Mobility reset",
            "Do a short mobility block after training.",
            12,
            "Complete 3-5 mobility drills.",
            "fitness",
          ),
        ],
      },
      {
        focusEn: "Cardio and recovery",
        focusMn: "Кардио ба сэргэлт",
        tasks: [
          fallbackTask(
            "Zone 2 cardio",
            "Do easy cardio at a sustainable pace.",
            30,
            "Maintain steady effort for the full duration.",
            "fitness",
          ),
        ],
      },
    ],
    study: [
      {
        focusEn: "Deep study block",
        focusMn: "Гүн суралцах блок",
        tasks: [
          fallbackTask(
            "Core study sprint",
            "Study the highest-priority topic without distractions.",
            60,
            "Finish one focused block.",
            "study",
          ),
          fallbackTask(
            "Recall review",
            "Summarize what you learned from memory.",
            20,
            "Write a short recall sheet.",
            "study",
          ),
        ],
      },
      {
        focusEn: "Practice and revision",
        focusMn: "Дадлага ба давтлага",
        tasks: [
          fallbackTask(
            "Problem set",
            "Work through practical questions or exercises.",
            45,
            "Complete at least 5-10 problems.",
            "study",
          ),
        ],
      },
    ],
    work: [
      {
        focusEn: "Deep work",
        focusMn: "Гүн ажил",
        tasks: [
          fallbackTask(
            "Priority deliverable",
            "Advance the most important project task.",
            90,
            "Ship one meaningful chunk.",
            "work",
          ),
          fallbackTask(
            "Admin cleanup",
            "Clear blockers, messages, or follow-ups.",
            25,
            "Empty the highest-priority admin list.",
            "work",
          ),
        ],
      },
      {
        focusEn: "Execution and review",
        focusMn: "Гүйцэтгэл ба дүгнэлт",
        tasks: [
          fallbackTask(
            "Progress checkpoint",
            "Review output quality and next blockers.",
            20,
            "Document the next 3 actions.",
            "work",
          ),
        ],
      },
    ],
    mind: [
      {
        focusEn: "Mental reset",
        focusMn: "Сэтгэлийн reset",
        tasks: [
          fallbackTask(
            "Journaling",
            "Write a short reflection about energy and priorities.",
            15,
            "Complete one honest journal entry.",
            "mind",
          ),
          fallbackTask(
            "Meditation",
            "Sit quietly and regulate breathing.",
            12,
            "Finish the full timer.",
            "mind",
          ),
        ],
      },
      {
        focusEn: "Sleep and calm",
        focusMn: "Нойр ба тайван байдал",
        tasks: [
          fallbackTask(
            "Evening wind-down",
            "Reduce stimulation before sleep.",
            20,
            "Stay off high-stimulation apps before bed.",
            "mind",
          ),
        ],
      },
    ],
    social: [
      {
        focusEn: "Connection",
        focusMn: "Харилцаа",
        tasks: [
          fallbackTask(
            "Meaningful outreach",
            "Message or call someone you want to stay connected with.",
            20,
            "Complete one real conversation.",
            "social",
          ),
          fallbackTask(
            "Shared activity",
            "Plan or join a simple social interaction.",
            45,
            "Schedule or attend one activity.",
            "social",
          ),
        ],
      },
      {
        focusEn: "Follow-through",
        focusMn: "Дуусгалт",
        tasks: [
          fallbackTask(
            "Follow-up",
            "Reply to pending messages or commitments.",
            20,
            "Clear your top social loose ends.",
            "social",
          ),
        ],
      },
    ],
    creative: [
      {
        focusEn: "Creative output",
        focusMn: "Бүтээлч гаргалгаа",
        tasks: [
          fallbackTask(
            "Create something small",
            "Make progress on a creative piece.",
            60,
            "Produce one draft, sketch, or iteration.",
            "creative",
          ),
          fallbackTask(
            "Reference study",
            "Study inspiration without over-consuming.",
            20,
            "Save 3 useful references.",
            "creative",
          ),
        ],
      },
      {
        focusEn: "Refinement",
        focusMn: "Сайжруулалт",
        tasks: [
          fallbackTask(
            "Polish one piece",
            "Improve something you already started.",
            40,
            "Finish one revision pass.",
            "creative",
          ),
        ],
      },
    ],
    general: [
      {
        focusEn: "Priority execution",
        focusMn: "Гол зорилтын гүйцэтгэл",
        tasks: [
          fallbackTask(
            "Main task block",
            "Work on the most important task you described.",
            60,
            "Finish one focused block.",
            "general",
          ),
          fallbackTask(
            "Short review",
            "Review progress and adjust tomorrow's target.",
            15,
            "Write tomorrow's next step.",
            "general",
          ),
        ],
      },
      {
        focusEn: "Catch-up and consistency",
        focusMn: "Нөхөлт ба тогтвортой байдал",
        tasks: [
          fallbackTask(
            "Small consistency win",
            "Do one smaller task that keeps momentum alive.",
            25,
            "Complete one easy win.",
            "general",
          ),
        ],
      },
    ],
  };

  const templates = categoryTaskSets[preferredCategory];

  const schedule = Array.from({ length: 7 }, (_, index) => {
    const dayNumber = index + 1;
    const template = templates[index % templates.length];
    const isRecoveryDay = dayNumber === 4;
    const difficulty: WeeklyPlanDifficulty = isRecoveryDay
      ? "rest"
      : lighterWeek
        ? "easy"
        : dayNumber === 2 || dayNumber === 6
          ? "hard"
          : "moderate";

    const tasks = isRecoveryDay ? [] : template.tasks.slice(0, lighterWeek ? 1 : 2);
    const supportActions = isRecoveryDay
      ? isMn
        ? ["Хөнгөн review хий", "Дараагийн өдрийнхөө зорилгыг шинэчил"]
        : ["Do a light review", "Reset tomorrow's priority"]
      : isMn
        ? ["Тасралтгүй 1 төвлөрсөн block хий", "Дууссаны дараа богино тэмдэглэл үлдээ"]
        : ["Protect one distraction-free block", "Leave a short end-of-day note"];

    return {
      dayNumber,
      label: isMn ? `${dayNumber}-р өдөр` : `Day ${dayNumber}`,
      focus: isMn ? template.focusMn : template.focusEn,
      difficulty,
      isRecoveryDay,
      estimatedTotalMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
      tasks,
      supportActions,
      coachingNote: isRecoveryDay
        ? isMn
          ? "Энэ өдөр ачааллаа бууруулж, хэмнэлээ алдахгүй байх нь гол зорилго."
          : "Use this day to stay consistent without forcing intensity."
        : isMn
          ? "Өнөөдрийн task-уудыг эхлээд хамгийн чухлаар нь эрэмбэлээд тасралтгүй хий."
          : "Start with the highest-impact task and finish it before context switching.",
    };
  });

  return {
    coachSummary: isMn
      ? "Чиний зорилго, recovery, ачааллын түвшинд тулгуурлаад 7 хоногийн coach-style fitness төлөвлөгөө гаргалаа."
      : "I built a 7-day coach-style fitness plan around your goal, recovery needs, and current workload.",
    personalizationSummary: isMn
      ? `Чиний одоогийн level ${user.level}, streak ${user.streakDays}, сүүлийн хүсэлт: "${requirementSummary}" гэдгийг ашигласан.`
      : `This plan uses your current level ${user.level}, streak ${user.streakDays}, and latest request: "${requirementSummary}".`,
    weekFocus: isMn
      ? "Тогтвортой ахиц, recovery, зөв ачааллын тэнцвэртэй 7 хоногийн бүтэц"
      : "A 7-day structure balancing progress, recovery, and smart training stress",
    difficultyAdjustment: isMn
      ? lighterWeek
        ? "Тогтвортой байдлыг сэргээж техник, recovery-гээ хамгаалахын тулд ачааллыг хөнгөрүүлсэн."
        : "Сүүлийн хэмнэл боломжийн тул ачааллыг хэтрүүлэхгүйгээр дундаас ахисан түвшинд барьсан."
      : lighterWeek
        ? "The workload is intentionally lighter to rebuild consistency and protect recovery."
        : "The week keeps a moderate-to-strong pace without exceeding what your recent momentum can realistically support.",
    recoveryStrategy: isMn
      ? "Дунд үед recovery өдөр оруулж, ядралт хуримтлагдахаас сэргийлээд дараагийн өдрүүдийн чанарыг хамгаалсан."
      : "A lighter day in the middle of the week prevents fatigue from snowballing and keeps later sessions high-quality.",
    progressionRule: isMn
      ? "Хэрэв 2 session дараалан чанартай гүйцэтгэл гаргавал дараагийн ачаалал дээр хугацаа, сет эсвэл хүндрэлийг бага зэрэг нэм."
      : "If you complete two quality sessions in a row, increase either time, sets, or difficulty slightly on the next loading day.",
    warningNotes: isMn
      ? [
          "Хэт их ачаалал нэмэхээс илүү хөдөлгөөний чанар, recovery, тогтвортой байдал чухал.",
          "Хэрэв хүч, нойр, үе мөчний мэдрэмж муудвал ачааллаа шууд нэг түвшин бууруул.",
        ]
      : [
          "Prioritize movement quality, recovery, and consistency over ego-driven volume.",
          "If sleep, joints, or performance dip sharply, reduce load immediately for a day.",
        ],
    schedule,
    suggestedQuestIds,
  };
}

export async function generateWorkoutPlan(
  user: AICoachUserContext,
): Promise<GeneratedWorkoutPlanResult> {
  const attempts = [
    undefined,
    "Regenerate the plan. Keep the 7-day structure valid, concise, coach-like, and tightly aligned to the user's training goal and recovery capacity.",
  ];

  let lastError: unknown;

  for (const retryInstruction of attempts) {
    try {
      const plan = await requestStructuredWorkoutPlan(user, retryInstruction);
      return {
        plan,
        source: "openai",
      };
    } catch (error) {
      console.error("[AI_COACH_PROVIDER_ATTEMPT_FAILED]", {
        retryInstruction,
        error,
      });
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    if (lastError instanceof AIProviderError) {
      console.warn("[AI_COACH_FALLBACK_PLAN]", lastError.message);
      return {
        plan: buildFallbackWorkoutPlan(user),
        source: "fallback",
        providerError: lastError.message,
      };
    }

    throw lastError;
  }

  return {
    plan: buildFallbackWorkoutPlan(user),
    source: "fallback",
  };
}
