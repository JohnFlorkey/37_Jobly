const { BadRequestError } = require("../expressError");

/**  Assists in the preparation of UPDATE SQL statements.
 * 
 * Accepts key, value pairs {proprty to update: value to update to}.
 * 
 * Returns js object with two key, value pairs {setCols: value, values: value}.
 * 
 * setCols is a string of comma separated columns to update that are consumable
 * by an UPDATE statement. "column1=$1,column2=$2".
 * 
 * values is an array of the actual values to be used in the update 
 * corresponding to the columns in the setCols string.
 * 
 * The jsToSql parameter is a set of key, value pairs that map model 
 * properties to database columns.
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
