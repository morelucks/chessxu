import { cvToValue, tupleCV, uintCV } from '@stacks/transactions';

const cv = tupleCV({
  'total-games': uintCV(10),
  'total-decisive': uintCV(5),
  'total-players': uintCV(2)
});

console.log('CV:', JSON.stringify(cv, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value, 2));

const val = cvToValue(cv);
console.log('Value:', val);
console.log('Type of value["total-games"]:', typeof val['total-games']);
console.log('Is value["total-games"] a BigInt?:', typeof val['total-games'] === 'bigint');
console.log('String(value["total-games"]):', String(val['total-games']));
