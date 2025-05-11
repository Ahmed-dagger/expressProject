import { randomInt } from 'crypto';

describe('Authentication flow', () => {
  let email;
  const password = 'Test1234';

  beforeAll(async () => {
    // generate a unique email before anything else
    const id = await randomInt(1, 1_000_000);
    email = `test${id}@example.com`;

    // go to signup page
    await page.goto('http://localhost:8787/signup');
  });

  test('User can sign up and see dashboard', async () => {
    // SIGNUP
    await page.type('input[name=firstname]',       'Test');
    await page.type('input[name=lastname]',        'User');
    await page.type('input[name=email]',           email);
    await page.type('input[name=password]',        password);
    await page.type('input[name=confirmPassword]', password);
    await Promise.all([
      page.click('button.submit'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // ASSERT dashboard
    const content = await page.content();
    expect(content).toMatch('💼 Dashboard');
    expect(content).toMatch('$0.00');
  });
});

describe('Login flow', () => {
  const email    = 'ballaabotaleb@gmail.com';
  const password = 'abdallah76';

  beforeAll(async () => {
    // clear any existing session cookies
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');

    // then go to login page
    await page.goto('http://localhost:8787/login', { waitUntil: 'networkidle0' });
  });


  test('Login with existing email', async () => {
    await page.type('input[type=email]',    email);
    await page.type('input[type=password]', password);

    await Promise.all([
      page.click('button[class=submit]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    const content = await page.content();
    expect(content).toMatch('💼 Dashboard');
  });
});
