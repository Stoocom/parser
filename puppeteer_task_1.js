const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const pageUrl = process.argv[2];
const region = process.argv[3];

async function takeScreenshot(pageUrl) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized',
      '--disable-infobars',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1920, height: 1080, deviceScaleFactor: 1,
  });

  await page.goto(pageUrl);

  await new Promise(resolve => setTimeout(resolve, 5000));

  // выбор региона
  const button = await page.$('.Region_region__6OUBn');
  if (button) {
    await button.click();
    const buttons = await page.$$('.UiRegionListBase_button__smgMH');
    for (const button of buttons) {
      const buttonText = await page.evaluate(el => el.textContent.trim(), button);
      if (buttonText.includes(region)) {
        await button.click();
      }
    }
  }

  const buttonText = await page.$eval('.Price_role_discount__l_tpE', element => {
    return element.textContent;
  });
  const oldPrice = await page.$eval('.Price_role_old__r1uT1', element => {
    return element.textContent;
  });
  const rating = await page.$eval('meta[itemprop="ratingValue"]', element => {
    return element.getAttribute('content');
  });
  const reviewCount = await page.$eval('meta[itemprop="reviewCount"]', element => {
    return element.getAttribute('content');
  });

  const fileContent = `price=${buttonText.split(' ')[0].replace(',', '.')}
priceOld=${oldPrice.split(' ')[0].replace(',', '.')}
rating=${rating}
reviewCount=${reviewCount}`;

  await fs.writeFile('product.txt', fileContent, 'utf8');
  console.log('Данные успешно сохранены в product.txt')

  await new Promise(resolve => setTimeout(resolve, 5000));

  // запись скрина
  await page.screenshot({
    path: 'screenshot.jpg',
    fullPage: true,
    type: 'jpeg',
  });

  await browser.close();
}

takeScreenshot(pageUrl);