const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

function calculateScore(student, program) {
  let score = 0;
  const reasons = [];

  if (student.targetCountries.includes(program.country)) {
    score += 35;
    reasons.push(`Preferred country match: ${program.country}`);
  }

  if (
    student.interestedFields.some((field) =>
      program.field.toLowerCase().includes(field.toLowerCase())
    )
  ) {
    score += 30;
    reasons.push(`Field alignment: ${program.field}`);
  }

  if (student.maxBudgetUsd >= program.tuitionFeeUsd) {
    score += 20;
    reasons.push("Within budget range");
  }

  if (student.preferredIntake && program.intakes.includes(student.preferredIntake)) {
    score += 10;
    reasons.push(`Preferred intake available: ${student.preferredIntake}`);
  }

  if ((student.englishTest?.score || 0) >= program.minimumIelts) {
    score += 5;
    reasons.push("English test score meets requirement");
  }

  return {
    score,
    reasons,
  };
}

const mongoose = require("mongoose");

function generateStudyPlan(student, topMatch) {
  const intakeMonth = topMatch.intakes[0] || "September";
  const currentYear = new Date().getFullYear();
  
  return {
    timeline: [
      { phase: "IELTS Preparation", duraton: "2-3 Months", goal: "Achieve minimum 7.0 band score" },
      { phase: "Document Collection", duration: "1 Month", goal: "Transcript, SOP, and LORs" },
      { phase: "Application Submission", duration: "1 Month", goal: `Submit by ${intakeMonth === "September" ? "January" : "August"} for early consideration` },
      { phase: "Visa & Enrollment", duration: "3-4 Months", goal: "Complete GTE and financial evidence" }
    ],
    suggestions: [
      student.englishTest?.score < topMatch.minimumIelts 
        ? "Focus intensively on English prep to meet the university's cutoff."
        : "Your IELTS score already meets the requirement. Use this time for SOP refinement.",
      student.academicBackground?.gpa < 3.2 
        ? "Consider adding a GRE/GMAT score or professional certifications to bolster a lower GPA."
        : "Your academic standing is strong for this program.",
      `Apply for the ${intakeMonth} intake as it has higher scholarship allocation.`
    ],
    budgetBreakdown: {
      tuition: topMatch.tuitionFeeUsd,
      estimatedLiving: 15000,
      totalEstimate: topMatch.tuitionFeeUsd + 15000,
      savingsNeeded: Math.max(0, (topMatch.tuitionFeeUsd + 15000) - (student.maxBudgetUsd || 0))
    }
  };
}

async function buildProgramRecommendations(studentId) {
  const student = await Student.findById(studentId).lean();

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  const pipeline = [
    {
      $match: {
        $expr: {
          $or: [
            { $in: ["$country", student.targetCountries || []] },
            { $lte: ["$tuitionFeeUsd", (student.maxBudgetUsd || Infinity) * 1.2] }, // Flexible budget
          ],
        },
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            { $cond: [{ $in: ["$country", student.targetCountries || []] }, 35, 0] },
            {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: student.interestedFields || [],
                          as: "field",
                          cond: { $regexMatch: { input: "$field", regex: "$$field", options: "i" } },
                        },
                      },
                    },
                    0,
                  ],
                },
                30,
                0,
              ],
            },
            { $cond: [{ $lte: ["$tuitionFeeUsd", student.maxBudgetUsd || Infinity] }, 20, 0] },
            { $cond: [{ $in: [student.preferredIntake || "", "$intakes"] }, 10, 0] },
            { $cond: [{ $lte: ["$minimumIelts", student.englishTest?.score || 0] }, 5, 0] },
          ],
        },
        reasons: {
          $concatArrays: [
            { $cond: [{ $in: ["$country", student.targetCountries || []] }, [{ $concat: ["Preferred country match: ", "$country"] }], []] },
            {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: student.interestedFields || [],
                          as: "field",
                          cond: { $regexMatch: { input: "$field", regex: "$$field", options: "i" } },
                        },
                      },
                    },
                    0,
                  ],
                },
                [{ $concat: ["Field alignment: ", "$field"] }],
                [],
              ],
            },
            { $cond: [{ $lte: ["$tuitionFeeUsd", student.maxBudgetUsd || Infinity] }, ["Within budget range"], []] },
            { $cond: [{ $in: [student.preferredIntake || "", "$intakes"] }, [{ $concat: ["Preferred intake available: ", student.preferredIntake || ""] }], []] },
            { $cond: [{ $lte: ["$minimumIelts", student.englishTest?.score || 0] }, ["English test score meets requirement"], []] },
          ],
        },
      },
    },
    { $match: { score: { $gt: 0 } } },
    { $sort: { score: -1 } },
    { $limit: 10 },
  ];

  const recommendations = await Program.aggregate(pipeline);

  const topMatch = recommendations[0];
  const aiStudyPlan = topMatch ? generateStudyPlan(student, topMatch) : null;

  return {
    data: {
      student: {
        id: student._id,
        fullName: student.fullName,
        preferences: {
          countries: student.targetCountries,
          fields: student.interestedFields,
          budget: student.maxBudgetUsd
        },
        academicInfo: student.academicBackground
      },
      recommendations: recommendations.map(r => ({ ...r, matchScore: r.score })),
      aiStudyPlan
    },
    meta: {
      implementationStatus: "mongodb-aggregation-pipeline-with-ai-planning",
    },
  };
}


module.exports = {
  buildProgramRecommendations,
};
