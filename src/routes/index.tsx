import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/env/client";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Minus,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { analyzePreferences } from "../server/analyzePreferences";
import { generateMedicalRecord } from "../server/generateMedicalRecord";
import { generateSummary } from "../server/generateSummary";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [state, setState] = useState<{
    rules: string[];
    observations: { observation: string; count: number }[];
    fakeRecord: string;
    initialSummary: string;
    editedSummary: string;
  }>({
    rules: ["Be concise.", "Focus on actionable items."],
    observations: [],
    fakeRecord: "",
    initialSummary: "",
    editedSummary: "",
  });

  const [newRule, setNewRule] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generate = async () => {
    if (isSummarizing || isAnalyzing) return;
    setError(null);
    setSuccess(null);
    try {
      const { record } = await generateMedicalRecord();
      setState((prev) => ({
        ...prev,
        fakeRecord: record,
        initialSummary: "",
        editedSummary: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate record",
      );
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenerate uses the same generate() function

  const handleSummarize = async () => {
    if (!state.fakeRecord) {
      setError("Please generate a record first.");
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSuccess(null);

    try {
      const { summary } = await generateSummary({
        data: {
          record: state.fakeRecord,
          rules: state.rules,
        },
      });

      setState((prev) => ({
        ...prev,
        initialSummary: summary,
        editedSummary: summary,
      }));
      setSuccess("Summary generated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate summary",
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!state.initialSummary) {
      setError("Please generate a summary before saving.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = (await analyzePreferences({
        data: {
          initialSummary: state.initialSummary,
          editedSummary: state.editedSummary,
          currentRules: state.rules,
          currentObservations: state.observations,
        },
      })) as {
        rules: string[];
        observations: { observation: string; count: number }[];
      };

      const promotedCount = (result.rules?.length ?? 0) - state.rules.length;
      const newState = { ...state, ...result };

      setState(newState);

      const message =
        promotedCount > 0
          ? `${promotedCount} observation(s) promoted to rules!`
          : `${result.observations.length} observation(s) updated.`;
      setSuccess(message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze preferences",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteRule = (index: number) => {
    if (isSummarizing || isAnalyzing) return;
    setState((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    if (state.rules.includes(newRule.trim())) {
      setError("Rule already exists");
      return;
    }
    setState((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule.trim()],
    }));
    setNewRule("");
    setSuccess("Rule added successfully");
  };

  const Spinner = () => (
    <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading" />
  );

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="pb-4">
          <p className="md:text-sm font-medium">
            Created bv{" "}
            <a
              href="https://tractorbeam.ai"
              className="text-primaryfont-semibold hover:text-primary/70 transition-colors"
              target="_blank"
            >
              Tractorbeam
            </a>{" "}
            for{" "}
            <a
              href="https://tempus.ai"
              className="text-primary font-semibold hover:text-primary/70 transition-colors"
              target="_blank"
            >
              Tempus AI
            </a>
          </p>
          <h1 className="text-2xl font-semibold">
            Preference Learning Prototype
          </h1>
          <p className="text-sm md:text-xs text-muted-foreground mt-2">
            Learning summarization preferences from text deltas and explicit
            rules
          </p>
        </div>

        <hr className="border-border -mt-3 -mx-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base md:text-sm font-medium uppercase tracking-wide">
                  Medical Record
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generate}
                  className="text-xs border shadow-none rounded cursor-pointer"
                  disabled={isSummarizing || isAnalyzing}
                >
                  <RefreshCcw className="size-3" />
                  Regenerate
                </Button>
              </div>
              <p className="text-sm md:text-xs text-muted-foreground">
                This is a demo medical record for our summarizer tool, which
                improves by observing user edits.
              </p>
              <Textarea
                value={state.fakeRecord}
                readOnly
                className="h-64 overflow-y-auto resize-none shadow-none rounded"
              />
              <Button
                className="w-full border shadow-none rounded cursor-pointer"
                variant="secondary"
                onClick={handleSummarize}
                disabled={isSummarizing || isAnalyzing}
              >
                {isSummarizing ? <Spinner /> : "Generate Summary"}
              </Button>
            </div>

            {/* Summary with Edit */}
            <div className="space-y-3">
              <h2 className="text-base md:text-sm font-medium uppercase tracking-wide">
                AI-Generated Summary{" "}
                <span className="text-muted-foreground">(Editable)</span>
              </h2>
              <p className="text-sm md:text-xs text-muted-foreground">
                This AI-generated summary is a demo output. Edit it, like
                removing the patient's age, to help the agent learn your
                preferences for future summaries.
              </p>
              <Textarea
                value={state.editedSummary}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setState((prev) => ({
                    ...prev,
                    editedSummary: e.target.value,
                  }))
                }
                placeholder="Generated summary will appear here..."
                className="h-40 resize-none shadow-none rounded border"
              />
            </div>

            {/* Submit Changes */}
            <Button
              className="w-full border shadow-none rounded cursor-pointer"
              variant="secondary"
              onClick={handleSavePreferences}
              disabled={isAnalyzing || isSummarizing || !state.initialSummary}
            >
              {isAnalyzing ? <Spinner /> : "Analyze Changes"}
            </Button>

            {error && (
              <Alert
                variant="destructive"
                className="border shadow-none rounded"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-muted text-muted-foreground border shadow-none rounded">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>

          <hr className="border-border -mx-6 lg:hidden" />

          <div className="space-y-6">
            {/* Rules */}
            <div className="space-y-3">
              <h2 className="text-base md:text-sm font-medium uppercase tracking-wide">
                Rules
              </h2>
              <p className="text-sm md:text-xs text-muted-foreground">
                Rules are generated from observations that have been seen{" "}
                {env.VITE_PROMOTION_THRESHOLD} times.
              </p>

              {state.rules.length === 0 ? (
                <p className="text-sm md:text-xs text-muted-foreground">
                  No rules learned yet
                </p>
              ) : (
                <div className="space-y-2">
                  {state.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm md:text-xs border border-border"
                    >
                      <span className="flex-1">{rule}</span>
                      <button
                        onClick={() => handleDeleteRule(index)}
                        className="ml-2 font-medium text-muted-foreground hover:text-destructive disabled:opacity-50 cursor-pointer"
                        disabled={isSummarizing || isAnalyzing}
                      >
                        <Minus className="size-3 mr-0.5" />
                      </button>
                    </div>
                  ))}
                  {/* Add Rule Input */}
                  <div className="relative flex space-x-2">
                    <Input
                      value={newRule}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewRule(e.target.value)
                      }
                      placeholder="Add a rule manually..."
                      className="text-sm! md:h-8 rounded px-2 placeholder:text-sm md:placeholder:text-xs md:text-xs! shadow-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddRule();
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      className="size-9 md:size-8 rounded border border-input hover:bg-accent text-xs shadow-none cursor-pointer disabled:cursor-not-allowed"
                      onClick={handleAddRule}
                      disabled={!newRule.trim() || isSummarizing || isAnalyzing}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Observations */}
            <div>
              <h2 className="text-base md:text-sm font-medium uppercase tracking-wide mb-2">
                Observations
              </h2>
              {Object.keys(state.observations).length === 0 ? (
                <p className="text-sm md:text-xs text-muted-foreground opacity-50">
                  No observations recorded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {state.observations
                    .sort((a, b) => b.count - a.count)
                    .map(({ observation, count }) => (
                      <div
                        key={observation}
                        className="p-2 bg-muted rounded border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm md:text-xs flex-1">
                            {observation}
                          </span>
                          <span className="flex items-center gap-1">
                            {Array.from({
                              length: env.VITE_PROMOTION_THRESHOLD,
                            }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-4 w-2 rounded-[2px] border inline-block transition-colors",
                                  i < count
                                    ? "bg-stone-200 border-stone-300"
                                    : "bg-transparent border-stone-200",
                                )}
                              ></div>
                            ))}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
