const { sqlForPartialUpdate } = require('./sql');

const dataToUpdate = {
    column1: 'column1Value',
    column2: 'column2Value'
};

describe('Test sql update helper function', () => {
    test('Test when model property is same as database column', () => {
        const jsToSql = {};
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result.setCols).toEqual('"column1"=$1, "column2"=$2');
        expect(result.values).toEqual(["column1Value","column2Value"]);
    });

    test('Test when model property needs translated to database column', () => {
        const jsToSql = {
            column1: "database_column"
        };
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result.setCols).toEqual('"database_column"=$1, "column2"=$2');
        expect(result.values).toEqual(["column1Value","column2Value"]);
    });
})