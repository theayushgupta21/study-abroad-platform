const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Student = require("../src/models/Student");
const Program = require("../src/models/Program");
const University = require("../src/models/University");
const Application = require("../src/models/Application");

describe("Application Workflow API", () => {
  let token;
  let testStudent;
  let testUniversity;
  let testProgram;

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
    await Application.deleteMany({});

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      role: "student",
    });

    token = res.body.data.accessToken;
    testStudent = res.body.data._id;

    testUniversity = await University.create({
      name: "Test University",
      country: "USA",
      city: "New York",
    });

    testProgram = await Program.create({
      university: testUniversity._id,
      universityName: testUniversity.name,
      country: "USA",
      city: "New York",
      title: "Computer Science",
      field: "Engineering",
      degreeLevel: "bachelor",
      tuitionFeeUsd: 15000,
      intakes: ["Fall 2026"],
    });
  });

  it("should create a new application successfully", async () => {
    const applicationData = {
      student: testStudent,
      program: testProgram._id.toString(),
      university: testUniversity._id.toString(),
      destinationCountry: "USA",
      intake: "Fall 2026",
    };

    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send(applicationData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("draft");
  });

  it("should prevent duplicate applications for the same program and intake", async () => {
    const applicationData = {
      student: testStudent,
      program: testProgram._id.toString(),
      university: testUniversity._id.toString(),
      destinationCountry: "USA",
      intake: "Fall 2026",
    };

    await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send(applicationData);

    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send(applicationData);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Application for this program and intake already exists.");
  });

  it("should successfully update application status according to transitions", async () => {
    const applicationData = {
      student: testStudent,
      program: testProgram._id.toString(),
      university: testUniversity._id.toString(),
      destinationCountry: "USA",
      intake: "Fall 2026",
    };

    const createRes = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send(applicationData);

    const appId = createRes.body.data._id;

    // "draft" -> "submitted"
    const res = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "submitted" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("submitted");
  });

  it("should fail to update application status for invalid transition", async () => {
    const applicationData = {
      student: testStudent,
      program: testProgram._id.toString(),
      university: testUniversity._id.toString(),
      destinationCountry: "USA",
      intake: "Fall 2026",
    };

    const createRes = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send(applicationData);

    const appId = createRes.body.data._id;

    // "draft" -> "enrolled" is invalid directly
    const res = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "enrolled" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Invalid status transition");
  });
});
