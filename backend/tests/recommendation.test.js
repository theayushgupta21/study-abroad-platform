const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Student = require("../src/models/Student");
const Program = require("../src/models/Program");
const University = require("../src/models/University");

describe("Recommendation Engine API", () => {
  let token;
  let testStudent;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/waygood-test-db", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Student.deleteMany({});
    await Program.deleteMany({});
    await University.deleteMany({});

    const studentUser = await Student.create({
      fullName: "Alice Math",
      email: "alice@example.com",
      password: "password123",
      role: "student",
      targetCountries: ["USA", "UK"],
      interestedFields: ["Computer Science"],
      maxBudgetUsd: 50000,
      preferredIntake: "Fall 2026",
      englishTest: {
        exam: "IELTS",
        score: 7.5,
      },
      profileComplete: true,
    });

    testStudent = studentUser._id;

    // Login to get token
    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "password123",
    });
    token = res.body.data.accessToken;

    const testUniversity = await University.create({
      name: "Global Tech University",
      country: "USA",
      city: "San Francisco",
    });

    // Perfect match
    await Program.create({
      university: testUniversity._id,
      universityName: testUniversity.name,
      country: "USA", // 35
      city: "San Francisco",
      title: "BSc Computer Science",
      field: "Computer Science", // 30
      degreeLevel: "bachelor",
      tuitionFeeUsd: 40000, // 20
      intakes: ["Fall 2026"], // 10
      minimumIelts: 6.5, // 5
    });

    // Partial match
    await Program.create({
      university: testUniversity._id,
      universityName: testUniversity.name,
      country: "Canada", // 0
      city: "Toronto",
      title: "BSc Biology",
      field: "Biology", // 0
      degreeLevel: "bachelor",
      tuitionFeeUsd: 20000, // 20
      intakes: ["Spring 2026"], // 0
      minimumIelts: 6.0, // 5
    });
  });

  it("should return recommended programs and AI study plan using aggregation", async () => {
    const res = await request(app)
      .get(`/api/recommendations/${testStudent}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty("aiStudyPlan");
    
    // The perfect match should have highest score (100)
    expect(res.body.data.recommendations[0].matchScore).toBe(100);
    
    // Check if the reasons array includes right elements
    expect(res.body.data.recommendations[0].reasons).toContain("Preferred country match: USA");
    
    expect(res.body.meta.implementationStatus).toBe("mongodb-aggregation-pipeline-with-ai-planning");
  });
});
