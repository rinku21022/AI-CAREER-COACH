import { Brain, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatsCards({ assessments }) {
  // Ensure assessments is an array and provide safe fallbacks
  const safeAssessments = Array.isArray(assessments) ? assessments : [];

  const getTotalQuestions = () => {
    if (!safeAssessments.length) return 0;
    return safeAssessments.reduce(
      (sum, assessment) => sum + (assessment.totalQuestions || assessment.questions?.length || 0),
      0
    );
  };

  const getTotalCorrect = () => {
    if (!safeAssessments.length) return 0;
    return safeAssessments.reduce(
      (sum, assessment) => sum + (assessment.correctAnswers || assessment.score || 0),
      0
    );
  };

  const getAverageScore = () => {
    if (!safeAssessments.length) return 0;
    const totalScore = safeAssessments.reduce(
      (sum, assessment) => sum + (assessment.score || assessment.quizScore || 0),
      0
    );
    return totalScore / safeAssessments.length;
  };

  const getAccuracyRate = () => {
    const totalQuestions = getTotalQuestions();
    const totalCorrect = getTotalCorrect();
    if (totalQuestions === 0) return 0;
    return (totalCorrect / totalQuestions) * 100;
  };

  // Calculate safe values
  const totalQuestions = getTotalQuestions();
  const totalCorrect = getTotalCorrect();
  const averageScore = getAverageScore();
  const accuracyRate = getAccuracyRate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Assessments */}
      <div className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Total Assessments
        </h3>
        <div className="text-2xl font-bold">
          {safeAssessments.length}
        </div>
      </div>

      {/* Average Score */}
      <div className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Average Score
        </h3>
        <div className="text-2xl font-bold">
          {averageScore.toFixed(1)}%
        </div>
      </div>

      {/* Total Questions */}
      <div className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Questions Answered
        </h3>
        <div className="text-2xl font-bold">
          {totalQuestions}
        </div>
      </div>

      {/* Accuracy Rate */}
      <div className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Accuracy Rate
        </h3>
        <div className="text-2xl font-bold">
          {accuracyRate.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
