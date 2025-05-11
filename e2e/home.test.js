const { randomInt } = require('crypto');

describe('Home page flows (deposit, invest, update, close)', () => {
  const password = 'Test1234';
  let email;
  let investId; // will stash the Mongo-generated investment _id

  beforeAll(async () => {
    // 1) create a fresh user via the signup page
    const id    = await randomInt(1, 1000000);
    email       = `e2e${id}@example.com`;
    await page.goto('http://localhost:8787/signup', { waitUntil: 'networkidle0' });

    await page.type('input[name=firstname]',       'E2E');
    await page.type('input[name=lastname]',        'Tester');
    await page.type('input[name=email]',           email);
    await page.type('input[name=password]',        password);
    await page.type('input[name=confirmPassword]', password);

    await Promise.all([
      page.click('button.submit'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // We should now be at /home
    expect(page.url()).toMatch(/\/home$/);
  }, 20000);

  test('Deposit $100 updates balance', async () => {
    // initial balance is $0.00
    await expect(await page.content()).toMatch('$0.00');

    // deposit 100
    await page.type('input[name=amount]', '100');
    await Promise.all([
      page.click('form[action="/home/deposit"] button'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // now should read $100.00
    await expect(await page.content()).toMatch('$100.00');
  });

  test('Invest $50 creates an “open” investment and reduces balance', async () => {
    // invest 50 at 10%
    await page.type('form[action="/home/invest"] input[name=amount]', '50');
    await page.type('form[action="/home/invest"] input[name=roiRate]', '10');
    await Promise.all([
      page.click('form[action="/home/invest"] button'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // balance should drop to $50.00
    await expect(await page.content()).toMatch('$50.00');

    // investment-list should contain one <li> with “Open”
    const row = await page.$eval('.investment-list li', el => el.outerHTML);
    expect(row).toMatch(/Amount: \$50\.00/);
    expect(row).toMatch(/ROI Rate: 10%/);
    expect(row).toMatch(/Open/);

    // capture the investment’s data-id for update/close forms
    // we embed it on the Details button for the test
    investId = await page.$eval(
      '.investment-list li button[onclick^="openModal"]',
      btn => btn.getAttribute('onclick').match(/openModal\((\d+)\)/)[1]
    );
  });

  test('Update investment to $25 and 20% via modal', async () => {
    // open modal
    await page.click('.investment-list li button');
    // fill in new values
    await page.waitForSelector('#modal-amount');
    await page.click('#modal-amount', { clickCount: 3 });
    await page.type('#modal-amount', '25');
    await page.click('#modal-roi', { clickCount: 3 });
    await page.type('#modal-roi', '20');
    // submit update
    await Promise.all([
      page.click('#editForm button'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // balance should still be $50.00 (only invest changes)
    await expect(await page.content()).toMatch('$50.00');
    // and the row should now show updated values
    const updatedRow = await page.$eval('.investment-list li', el => el.outerHTML);
    expect(updatedRow).toMatch(/Amount: \$25\.00/);
    expect(updatedRow).toMatch(/ROI Rate: 20%/);
  });

  test('Close investment returns principal + prorated gain', async () => {
    // open modal again
    await page.click('.investment-list li button');
    await page.waitForSelector('#closeForm button');
    // immediately close it
    await Promise.all([
      page.click('#closeForm button'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

     const statusText = await page.$eval(
      '.investment-list li .badge',
      el => el.textContent.trim()
    );
    expect(statusText).toBe('Closed');

    // balance = previous 50 + principal 25 + tiny gain (~0)
    // since createdAt≈closeAt, gain≈0 → balance≈75.00
    await expect(await page.content()).toMatch('$75.00');
  });
});
