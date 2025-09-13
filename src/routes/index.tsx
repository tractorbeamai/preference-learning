import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { generateFakeMedicalRecord } from "../utils/medicalRecordGenerator";
import { generateSummary, analyzePreferences } from "../server/openai";
import { PreferenceLearningState, LEARNING_RATE_THRESHOLDS } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

export const Route = createFileRoute("/")({
  component: PreferenceLearningApp,
});

function PreferenceLearningApp() {
  const [state, setState] = useState<PreferenceLearningState>({
    rules: ["Rule: Be concise.", "Rule: Focus on actionable items."],
    observations: [],
    fakeRecord: "",
    initialSummary: "",
    editedSummary: "",
    learningRate: "Normal",
  });

  const [directPreference, setDirectPreference] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      fakeRecord: generateFakeMedicalRecord(),
    }));
  }, []);

  const handleRegenerateRecord = () => {
    if (isSummarizing || isAnalyzing) return;
    setState((prev) => ({
      ...prev,
      fakeRecord: generateFakeMedicalRecord(),
      initialSummary: "",
      editedSummary: "",
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSummarize = async () => {
    if (!state.fakeRecord) {
      setError("Please generate a record first.");
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSuccess(null);

    try {
      const summary = await generateSummary({
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
        err instanceof Error ? err.message : "Failed to generate summary"
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
      const result = await analyzePreferences({
        data: {
          initialSummary: state.initialSummary,
          editedSummary: state.editedSummary,
          directPreference,
          currentRules: state.rules,
          currentObservations: state.observations,
          learningRate: state.learningRate,
        },
      });

      const promotedCount = result.rules.length - state.rules.length;
      const newState = { ...state, ...result };

      setState(newState);
      setDirectPreference("");

      const message =
        promotedCount > 0
          ? `${promotedCount} observation(s) promoted to rules!`
          : `${result.observations.length} observation(s) updated.`;
      setSuccess(message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze preferences"
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

  const Spinner = () => (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle"
      aria-label="Loading"
    />
  );

  const threshold = LEARNING_RATE_THRESHOLDS[state.learningRate];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Tractorbeam: Preference Learning Prototype
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Learning summarization preferences from text deltas and explicit
            rules
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Input: Medical Record
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateRecord}
                  className="text-xs"
                  disabled={isSummarizing || isAnalyzing}
                >
                  Regenerate
                </Button>
              </div>
              <Textarea
                value={state.fakeRecord}
                readOnly
                className="max-h-[350px] min-h-[250px] overflow-y-auto font-mono text-xs border-gray-300 bg-gray-50"
              />
              <Button
                className="mt-3 w-full"
                onClick={handleSummarize}
                disabled={isSummarizing || isAnalyzing}
              >
                {isSummarizing ? <Spinner /> : "Generate Summary"}
              </Button>
            </div>

            {/* Summary with Edit */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                Output: Summary (Editable)
              </h2>
              {state.initialSummary && (
                <p className="text-xs text-gray-500 mb-2">
                  Edit the summary below. Text deltas will be analyzed for
                  patterns.
                </p>
              )}
              <Textarea
                value={state.editedSummary}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setState((prev) => ({
                    ...prev,
                    editedSummary: e.target.value,
                  }))
                }
                placeholder="Generated summary will appear here..."
                className="min-h-[100px] font-sans text-sm border-gray-300"
              />
            </div>

            {/* Direct Preference */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                Direct Preference (Optional)
              </h2>
              <p className="text-xs text-gray-500 mb-2">
                Explicit rules e.g., "Always include patient demographics" or
                "Use bullet points"
              </p>
              <Input
                value={directPreference}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDirectPreference(e.target.value)
                }
                placeholder="Enter preference..."
                className="border-gray-300"
              />
              <Button
                className="mt-3 w-full"
                onClick={handleSavePreferences}
                disabled={isAnalyzing || isSummarizing || !state.initialSummary}
              >
                {isAnalyzing ? <Spinner /> : "Submit Changes"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-gray-300 bg-gray-50">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-6">
            {/* Configuration */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3">
                Configuration
              </h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="learning-rate" className="text-xs">
                    Learning Rate
                  </Label>
                  <Select
                    value={state.learningRate}
                    onValueChange={(value: "Slow" | "Normal" | "Fast") =>
                      setState((prev) => ({ ...prev, learningRate: value }))
                    }
                  >
                    <SelectTrigger
                      id="learning-rate"
                      className="border-gray-300 text-sm mt-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Slow">Slow (5)</SelectItem>
                      <SelectItem value="Normal">Normal (3)</SelectItem>
                      <SelectItem value="Fast">Fast (2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                Rules (n ≥ {threshold})
              </h2>
              {state.rules.length === 0 ? (
                <p className="text-xs text-gray-500">No rules learned yet</p>
              ) : (
                <div className="space-y-1">
                  {state.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                    >
                      <span className="flex-1 text-gray-700">{rule}</span>
                      <button
                        onClick={() => handleDeleteRule(index)}
                        className="ml-2 text-gray-600 hover:text-red-600 disabled:opacity-50"
                        disabled={isSummarizing || isAnalyzing}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observations */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                Observations (n &lt; {threshold})
              </h2>
              {Object.keys(state.observations).length === 0 ? (
                <p className="text-xs text-gray-500">
                  No observations recorded
                </p>
              ) : (
                <div className="space-y-1">
                  {state.observations
                    .sort((a, b) => b.count - a.count)
                    .map(({ observation, count }) => (
                      <div key={observation} className="p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">
                            [{count}/{threshold}]
                          </span>
                          <span className="text-xs text-gray-700 flex-1">
                            {observation}
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
