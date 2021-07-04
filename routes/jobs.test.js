"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u3AdminToken,
  getJobIdByTitle
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", () => {
  const newJob = {
    title: "new job",
    salary: 1,
    equity: 0.1,
    companyHandle: "c1",
  };

  test("works for admins", async () => {
    const expectedResult = {
      id: expect.any(Number),
      title: "new job",
      salary: 1,
      equity: "0.1",
      companyHandle: "c1",
    };

    const resp = await request(app)
      .post(`/jobs`)
      .send(newJob)
      .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ job: expectedResult });
  });

  test("bad request with missing data", async () => {
    const resp = await request(app)
      .post("/companies")
      .send({ title: "new" })
      .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("basd request with invalid data", async () => {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newJob,
        equity: 2,
      })
      .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauthorized for non-admin", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /companies */

describe("GET /jobs", () => {
  test("works for anon", async () => {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job1",
          salary: 1,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "job2",
          salary: 2,
          equity: "0.2",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("works with filters", async function () {
    const params = {
        titleLike: "2"
    };
    const resp = await request(app)
      .get("/jobs")
      .query(params);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job2",
          salary: 2,
          equity: "0.2",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app).get("/jobs");
    // .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app).get(`/jobs/${job1Id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "job1",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          title: "job1-new",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: job1Id,
        title: "job1-new",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauthorized for non-admins", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          title: "job1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          title: "job1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          id: `${job1Id - 1}`,
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          equity: 4.5,
        })
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .delete(`/jobs/${job1Id}`)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.body).toEqual({ deleted: job1Id.toString() });
  });

  test("unauthorized for non-admins", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .delete(`/jobs/${job1Id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .delete(`/jobs/${job1Id}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const job1Id = await getJobIdByTitle('job1');
    const resp = await request(app)
        .delete(`/jobs/${job1Id -1 }`)
        .set("authorization", `Bearer ${u3AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});