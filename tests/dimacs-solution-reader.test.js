import {parseFilename, parseSolution} from "../public/javascripts/dimacs-solution-reader.js";

test('empty filename should raise an error', () => {
    // from Jest documentation: https://jestjs.io/docs/expect#tothrowerror
    // we must wrap the code in a function, otherwise the error will not be caught and the assertion will fail.
    expect(() => {
        parseSolution("", "");
    }).toThrow(Error);
});

test('empty content should raise an error', () => {
    expect(() => {
        parseSolution("some-filename", "");
    }).toThrow(Error);
});


test('filename should follow the pattern out_INSTANCE.txt (case sensitive)', () => {
    expect(() => {
        parseFilename("S_abs5n50_3_L6");
    }).toThrow(/could not parse filename/);

    expect(() => {
        parseFilename("out_S_abs5n50_3_L6");
    }).toThrow(/could not parse filename/);

    expect(() => {
        parseFilename("OUT_S_abs5n50_3_L6");
    }).toThrow(/could not parse filename/);

    expect(() => {
        parseFilename("S_abs5n50_3_L6.txt");
    }).toThrow(/could not parse filename/);

});

test('instance id should follow the pattern defined by DIMACS (case sensitive)', () => {
    expect(() => {
        // missing the initial S or L
        parseFilename("out_abs5n50_3_L6.txt");
    }).toThrow(/could not parse instance id/);

    expect(() => {
        // wrong case for the initial S or L
        parseFilename("out_s_abs5n50_3_L6.txt");
    }).toThrow(/could not parse instance id/);

    expect(() => {
        // missing period for small instances
        parseFilename("out_S_abs5n50_3_L.txt");
    }).toThrow(/could not parse small instance/);

    expect(() => {
        // additional period for large instances
        parseFilename("out_L_abs5n50_3_L8.txt");
    }).toThrow(/could not parse large instance/);

    const parsed = parseFilename("out_S_abs1n5_2_L3.txt");
    expect(parsed.n).toEqual(5);
    expect(parsed.K).toEqual(2);
    expect(parsed.T).toEqual(3);
});

test('solution file must contains Days starting from 1', () => {
    expect(() => {
        parseSolution("out_S_abs1n5_1_L3.txt", "Day 0");
    }).toThrow(/could not parse line 1: 'Day 0'. Expected 'Day 1'/);
});

test('solution file must contains Routes starting from 1', () => {
    expect(() => {
        parseSolution("out_S_abs1n5_1_L3.txt", "Day 1\nRoute 0: 0 - 0");
    }).toThrow(/could not parse line 2: 'Route 0: 0 - 0'. Expected 'Route 1:/);
});

test('solution file must contains all routes', () => {
    expect(() => {
        parseSolution("out_S_abs1n5_2_L3.txt", "Day 1\nRoute 1: 0 - 0\nDay 2");
    }).toThrow(/could not parse line 3: 'Day 2'. Expected 'Route 2:/);
});

test('route lines must follow pattern defined by DIMACS (with spaces)', () => {
    expect(() => {
        parseSolution("out_S_abs1n5_2_L3.txt", "Day 1\nRoute 1:0 - 0");
    }).toThrow(/could not parse line 2: 'Route 1:0 - 0'. Expected 'Route 1: 0 -/);

    expect(() => {
        parseSolution("out_S_abs1n5_2_L3.txt", "Day 1\nRoute 1: 0- 0");
    }).toThrow(/could not parse line 2: 'Route 1: 0- 0'. Expected 'Route 1: 0 -/);

    expect(() => {
        parseSolution("out_S_abs1n5_2_L3.txt", "Day 1\nRoute 1: 0 - 1(1) - 0");
    }).toThrow(/could not parse line 2: 'Route 1: 0 - 1\(1\) - 0'. Expected 'Route 1: 0 - /);

});

test('route lines must start and finishes in node 0', () => {
    expect(() => {
        parseSolution("out_S_abs1n5_2_L3.txt", "Day 1\nRoute 1: 1 - 0");
    }).toThrow(/could not parse line 2: 'Route 1: 1 - 0'. Expected 'Route 1: 0 - /);

    expect(() => {
        parseSolution("out_S_abs1n5_2_L3.txt", "Day 1\nRoute 1: 0 - 1");
    }).toThrow(/could not parse line 2: 'Route 1: 0 - 1'. Expected 'Route 1: 0 - /);
});

test('should contains 6 lines in the end of the file', () => {
    expect(() => {
        let content = "Day 1\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
        content += "Day 2\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
        content += "Day 3\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
        content += "1\n"
        content += "2\n"
        content += "3\n"
        content += "4\n"
        content += "5"
        parseSolution("out_S_abs1n5_2_L3.txt", content);
    }).toThrow(/could not parse file 'out_S_abs1n5_2_L3.txt'. Expected six lines in the end of the file./);
});

test('should contains 6 numbers in the end of the file', () => {
    expect(() => {
        let content = "Day 1\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
        content += "Day 2\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
        content += "Day 3\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
        content += "1\n"
        content += "2\n"
        content += "3\n"
        content += "4\n"
        content += "5\n"
        content += "a\n"
        parseSolution("out_S_abs1n5_2_L3.txt", content);
    }).toThrow(/could not parse line 15: 'Error: 'a' is not a number./);
});

test('parse correct solution routes and deliveries', () => {
    let content = "Day 1\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
    content += "Day 2\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
    content += "Day 3\nRoute 1: 0 - 1 ( 10 ) - 2 ( 20 ) - 0\nRoute 2: 0 - 0\n"
    content += "1\n"
    content += "2\n"
    content += "3\n"
    content += "4\n"
    content += "5\n"
    content += "6\n"
    const solution = parseSolution("out_S_abs1n5_2_L3.txt", content);
    expect(solution.routesByPeriod[0][0]).toEqual([0,0]);
    expect(solution.deliveriesByPeriod[0][0]).toEqual([0,0]);
    expect(solution.routesByPeriod[0][1]).toEqual([0,0]);
    expect(solution.deliveriesByPeriod[0][1]).toEqual([0,0]);
    expect(solution.routesByPeriod[2][0]).toEqual([0,1,2,0]);
    expect(solution.deliveriesByPeriod[2][0]).toEqual([0,10,20,0]);
});

test('parse correct solution results', () => {
    let content = "Day 1\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
    content += "Day 2\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
    content += "Day 3\nRoute 1: 0 - 0\nRoute 2: 0 - 0\n"
    content += "1\n"
    content += "2\n"
    content += "3\n"
    content += "4\n"
    content += "5\n"
    content += "6\n"
    const solution = parseSolution("out_S_abs1n5_2_L3.txt", content);
    expect(solution.transportationCost).toEqual(1);
    expect(solution.customerCost).toEqual(2);
    expect(solution.depotCost).toEqual(3);
    expect(solution.totalCost).toEqual(4);
    expect(solution.processor).toEqual(5);
    expect(solution.timeInSeconds).toEqual(6);
});