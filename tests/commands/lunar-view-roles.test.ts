test('original code: null -> false', () => {
    const rawPrivateResponse = null;
    const privateResponse = rawPrivateResponse ? rawPrivateResponse : false;
  expect(privateResponse).toBe(false);
});

test('original code: false -> false', () => {
    const rawPrivateResponse = false;
    const privateResponse = rawPrivateResponse ? rawPrivateResponse : false;
  expect(privateResponse).toBe(false);
});

test('original code: true - > true', () => {
    const rawPrivateResponse = true;
    const privateResponse = rawPrivateResponse ? rawPrivateResponse : false;
  expect(privateResponse).toBe(true);
});


test('correct code: null -> true', () => {
    const rawPrivateResponse = null;
    const privateResponse = (rawPrivateResponse || rawPrivateResponse == null)  ? true : false;
  expect(privateResponse).toBe(true);
});

test('correct code: false -> false', () => {
    const rawPrivateResponse = false;
    const privateResponse = (rawPrivateResponse || rawPrivateResponse == null)  ? true : false;
  expect(privateResponse).toBe(false);
});

test('correct code: true - > true', () => {
    const rawPrivateResponse = true;
    const privateResponse = (rawPrivateResponse || rawPrivateResponse == null)  ? true : false;
  expect(privateResponse).toBe(true);
});