"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs */

class Job {
    /** Create a job (from data), update db, return new job data.
     * 
     *  data should be { title, salary, equity, company_handle }
     * 
     * Returns { id, title, salary, equity, company_handle }
     * 
     * Throws BadRequestError if job already in database.
   * */

    static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT 1
            FROM jobs
            WHERE title = $1
                AND company_handle = $2`,
            [title, companyHandle]);

        if (duplicateCheck.rows[0]) 
            throw new BadRequestError(`Bad Request; Duplicate job with title: ${title} at company: ${companyHandle}`);

        const result = await db.query(
            `INSERT INTO jobs (
                title,
                salary,
                equity,
                company_handle
            ) VALUES (
                $1, $2, $3, $4
            ) RETURNING
                id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );

        const job = result.rows[0];

        return job;
    }

    /** Find all jobs
     * 
     * The optional parameter filterCriteria is an object that may contain none, some or all of the following: 
     * { titleLike: string, minSalary: integer, hasEquity: boolean }
     * 
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     */

    static async findAll(filterCriteria) {
        debugger;
        // if filterCriteria was not passed in create it
        if (filterCriteria === undefined) {
            filterCriteria = {
                titleLike: undefined,
                minSalary: undefined,
                hasEquity: undefined
            };
        }
        const { titleLike, minSalary, hasEquity } = filterCriteria;

        // build where clause
        let whereClause = '';
        let index = 1;
        const values = [];
        if ( titleLike || minSalary || hasEquity ) whereClause = ' WHERE 1=1';
        // use ILIKE for case insensitive string comparison
        if (titleLike) {
            whereClause += ` AND title ILIKE $${index}`;
            index += 1;
            values.push(`%${titleLike}%`);
        }
        if (minSalary) {
            whereClause += ` AND salary >= ${index}`;
            index += 1;
            values.push(minSalary);
        }
        if (hasEquity) whereClause += ` AND equity > 0`;

        // build query
        const selectClause = `
            SELECT
                id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
            FROM jobs`;
        const orderByClause = ` ORDER BY company_handle, title`;
        const selectQuery = selectClause + whereClause + orderByClause;

        const result = await db.query(selectQuery, values);

        return result.rows;
    }

    /** Given an id, return data about the job.
     * 
     * Returns { id, title, salary, equity, companyHandle }
     */

    static async get(id) {
        const result = await db.query(
            `SELECT
                id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1
            ORDER BY company_handle, title`,
            [id]
        );

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`Not Found; No job: ${id}`);

        return job;
    }

    /** Update job data with 'data'
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     * 
     * Data can include: { title, salary, equity }
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const jobVarIdx = "$" + (values.length + 1);

        const querySQL = `
            UPDATE jobs
            SET ${setCols}
            WHERE id = ${jobVarIdx}
            RETURNING
                id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"`;
        
        const result = await db.query(querySQL, [...values, id]);

        const job = result.rows[0];

        if(!job) throw new NotFoundError(`Not Found: No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     * 
     * Throws NotFoundError if job not found
     */

    static async remove(id) {
        const result = await db.query(
            `DELETE FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]
        );

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;