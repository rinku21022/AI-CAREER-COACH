"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function PerformanceChart({ assessments }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (assessments) {
      const formattedData = assessments.map((assessment) => ({
        date: format(new Date(assessment.createdAt), "MMM dd"),
        score: assessment.quizScore,
      }));
      setChartData(formattedData);
    }
  }, [assessments]);

  // Ensure assessments is an array
  const safeAssessments = Array.isArray(assessments) ? assessments : [];

  if (!safeAssessments.length) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Performance Over Time</h3>
        <div className="text-center text-muted-foreground py-8">
          No assessment data available
        </div>
      </div>
    );
  }

  // Prepare chart data with safe field access
  const preparedChartData = safeAssessments.map((assessment, index) => ({
    assessment: `Quiz ${index + 1}`,
    score: assessment.score || assessment.quizScore || 0,
    date: new Date(assessment.createdAt).toLocaleDateString(),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="gradient-title text-3xl md:text-4xl">
          Performance Trend
        </CardTitle>
        <CardDescription>Your quiz scores over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={preparedChartData}>
              <XAxis dataKey="assessment" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return `${label} - ${payload[0].payload.date}`;
                  }
                  return label;
                }}
                formatter={(value) => [`${value}%`, "Score"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
