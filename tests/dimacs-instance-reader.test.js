import {parseInstance} from "../src/dimacs-instance-reader.js";

test('empty instance should raise an error', () => {
    // from Jest documentation: https://jestjs.io/docs/expect#tothrowerror
    // we must wrap the code in a function, otherwise the error will not be caught and the assertion will fail.
    expect(() => {
        parseInstance("", "")
    }).toThrow(Error);
});

test('the first line should contains four parameters', () => {
    expect(() => {
        let input = ""
        // first line with three parameters
        input += "6\t3\t144\n";
        parseInstance("some-instance", input)
    }).toThrow(Error);
});

test('the second line should contains six parameters', () => {
    expect(() => {
        let input = ""
        input += "6\t3\t144\t2\n";
        // first line with five parameters should raise an error
        input += "0\t154.0\t417.0\t510\t193\n";
        parseInstance("some-instance", input)
    }).toThrow(Error);
});

test('the third line should contains eight parameters', () => {
    expect(() => {
        let input = ""
        input += "6\t3\t144\t2\n";
        input += "0\t154.0\t417.0\t510\t193\t0.30\n";
        // first line with seven parameters should raise an error
        input += "1\t172.0\t334.0\t130\t195\t0\t65\n";
        parseInstance("some-instance", input)
    }).toThrow(Error);
});


test('read the instance S_abs1n5_2_H3 and check for the correct parameters according to session 5', () => {
    const instanceId = "S_abs1n5_2_H3";

    let input = "";
    // The first line contains four parameters:
    // - the number of nodes including the depot (n + 1),
    // - number of time periods T
    // - vehicle capacity Q
    // - and number of vehicles M.
    input += "6\t3\t144\t2\n"


    // The second line describes the depot and provides:
    // - depot identifier (which is “0”)
    // - x coordinate
    // - y coordinate
    // - starting inventory level I00
    // - daily production r0t
    // - inventory cost h0
    input += "0\t154.0\t417.0\t510\t193\t0.30\n";

    // The n lines that follow each describes a customer and provides:
    // - customer identifier (i)
    // - x coordinate
    // - y coordinate
    // - starting inventory level Ii0
    // - maximum inventory level Ui
    // - minimum inventory level Li
    // - daily consumption rit
    // - inventory cost hi.
    input += "1\t172.0\t334.0\t130\t195\t0\t65\t0.23\n";
    input += "2\t267.0\t87.0\t70\t105\t0\t35\t0.32\n";
    input += "3\t148.0\t433.0\t58\t116\t0\t58\t0.33\n";
    input += "4\t355.0\t444.0\t48\t72\t0\t24\t0.23\n";
    input += "5\t38.0\t152.0\t11\t22\t0\t11\t0.18\n"

    const instance = parseInstance(instanceId, input);
    expect(instance.n).toEqual(5);
    expect(instance.T).toEqual(3);
    expect(instance.Q).toEqual(144);
    expect(instance.K).toEqual(2);

    // check depot
    const depot = instance.nodes[0];
    expect(depot.id).toEqual(0);
    expect(depot.x).toEqual(154.0);
    expect(depot.y).toEqual(417.0);
    expect(depot.startInv).toEqual(510);
    expect(depot.daily).toEqual(193);
    expect(depot.cost).toEqual(0.30);

    // check the first customer
    const customer1 = instance.nodes[1];
    expect(customer1.id).toEqual(1);
    expect(customer1.x).toEqual(172.0);
    expect(customer1.y).toEqual(334.0);
    expect(customer1.startInv).toEqual(130);
    expect(customer1.maxInv).toEqual(195);
    expect(customer1.minInv).toEqual(0);
    expect(customer1.daily).toEqual(65);
    expect(customer1.cost).toEqual(0.23);

    // check the last customer
    const customer5 = instance.nodes[5];
    expect(customer5.id).toEqual(5);
    expect(customer5.x).toEqual(38.0);
    expect(customer5.y).toEqual(152.0);
    expect(customer5.startInv).toEqual(11);
    expect(customer5.maxInv).toEqual(22);
    expect(customer5.minInv).toEqual(0);
    expect(customer5.daily).toEqual(11);
    expect(customer5.cost).toEqual(0.18);
});