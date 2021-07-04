"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', () => {
    const newJob = {
        title: 'new',
        salary: 1,
        equity: 0.1,
        companyHandle: 'c1'
    };

    test('works', async () => {
        const expectedResult = {
            id: expect.any(Number),
            title: "new",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1"
        };

        let job = await Job.create(newJob);
        expect(job).toEqual(expectedResult);
    });

    test('bad request with dupe', async () => {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe('findAll', () => {
    debugger;
    test('works: no filter', async () => {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: 'job1',
                salary: 1,
                equity: "0.1",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: 'job2',
                salary: 2,
                equity: "0.2",
                companyHandle: "c2"
            }
        ]);
    });
    test("works: filter on title", async () => {
        const filterCriteria = {titleLike: "2"};
        let jobs = await Job.findAll(filterCriteria);
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: 'job2',
                salary: 2,
                equity: "0.2",
                companyHandle: "c2"
            }
        ]);
    });
    //   test("works: filter on name case insensitive", async () => {
    //     const filterCriteria = {nameLike: "c2"};
    //     let companies = await Company.findAll(filterCriteria);
    //     expect(companies).toEqual([
    //       {
    //         handle: "c2",
    //         name: "C2",
    //         description: "Desc2",
    //         numEmployees: 2,
    //         logoUrl: "http://c2.img",
    //       }
    //     ]);
    //   });
    //   test("works: filter on minEmployees", async () => {
    //     const filterCriteria = {minEmployees: 2};
    //     let companies = await Company.findAll(filterCriteria);
    //     expect(companies).toEqual([
    //       {
    //         handle: "c2",
    //         name: "C2",
    //         description: "Desc2",
    //         numEmployees: 2,
    //         logoUrl: "http://c2.img",
    //       },
    //       {
    //         handle: "c3",
    //         name: "C3",
    //         description: "Desc3",
    //         numEmployees: 3,
    //         logoUrl: "http://c3.img",
    //       }
    //     ]);
    //   });
    //   test("works: filter on maxEmployees", async () => {
    //     const filterCriteria = {maxEmployees: 2};
    //     let companies = await Company.findAll(filterCriteria);
    //     expect(companies).toEqual([
    //       {
    //         handle: "c1",
    //         name: "C1",
    //         description: "Desc1",
    //         numEmployees: 1,
    //         logoUrl: "http://c1.img",
    //       },
    //       {
    //         handle: "c2",
    //         name: "C2",
    //         description: "Desc2",
    //         numEmployees: 2,
    //         logoUrl: "http://c2.img",
    //       }
    //     ]);
    //   });
    //   test("works: filter on all", async () => {
    //     const filterCriteria = {
    //       nameLike: "c",
    //       minEmployees: 1,
    //       maxEmployees: 2};
    //     let companies = await Company.findAll(filterCriteria);
    //     expect(companies).toEqual([
    //       {
    //         handle: "c1",
    //         name: "C1",
    //         description: "Desc1",
    //         numEmployees: 1,
    //         logoUrl: "http://c1.img",
    //       },
    //       {
    //         handle: "c2",
    //         name: "C2",
    //         description: "Desc2",
    //         numEmployees: 2,
    //         logoUrl: "http://c2.img",
    //       }
    //     ]);
    //   });
});

/************************************** get */

describe('get', () => {
    test('works', async () => {
        let job1 = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = 'job1'`);
        
        let job = await Job.get(job1.rows[0].id);
        expect(job).toEqual({
            id: expect.any(Number),
            title: 'job1',
            salary: 1,
            equity: "0.1",
            companyHandle: "c1"
        });
    });

    test('not found if no such company', async () => {
        try {
            let maxId = await db.query(`
                SELECT MAX(id) AS "maxId"
                FROM jobs`);
            
            let result = await Job.get(maxId.rows[0].maxId + 1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe('update', () => {
    test('works', async () => {
        let job1 = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = 'job1'`);
        const job1Id = job1.rows[0].id
        const updateData = {
            title: 'New',
            salary: 100,
            equity: 0.9
        };

        let job = await Job.update(job1Id, updateData);
        expect(job).toEqual({
            id: job1Id,
            title: 'New',
            salary: 100,
            equity: '0.9',
            companyHandle: 'c1'
        });
    });

    test('works null fields', async () => {
        let job1 = await db.query(`
            SELECT id
            FROM jobs
            WHERE title = 'job1'`);
        const job1Id = job1.rows[0].id
        const updateData = {
            title: 'New',
            salary: null,
            equity: null
        };

        let job = await Job.update(job1Id, updateData);
        expect(job).toEqual({
            id: job1Id,
            companyHandle: 'c1',
            ...updateData
        });
    });

    test('not found if no such job', async () => {
        try {
            let maxJob = await db.query(`
                SELECT MAX(id) AS "maxId"
                FROM jobs`);
            let maxId = maxJob.rows[0].maxId;
            const updateData = {
                title: 'New',
                salary: 100,
                equity: 0.9
            };
            await Job.update(maxId + 1, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test('bad request with no data', async () => {
        try {
            let job1 = await db.query(`
                SELECT id
                FROM jobs
                WHERE title = 'job1'`);
            const job1Id = job1.rows[0].id

            await Job.update(job1Id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe('remove', () => {
    test('works', async () => {
        let job1 = await db.query(`
                SELECT id
                FROM jobs
                WHERE title = 'job1'`);
        const job1Id = job1.rows[0].id

        await Job.remove(job1Id);
        const result = await db.query(`
            SELECT id
            FROM jobs
            WHERE id = $1`,
            [job1Id]);
        expect(result.rows.length).toEqual(0);
    });

    test('not found if no such job', async () => {
        try {
            let maxJob = await db.query(`
                SELECT MAX(id) AS "maxId"
                FROM jobs`);
            let maxId = maxJob.rows[0].maxId;
            await Job.remove(maxId + 1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy(); 
        }
    })
});