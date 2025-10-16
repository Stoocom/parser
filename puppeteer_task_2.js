const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const pageUrl = process.argv[2];
const titleCategory = pageUrl.split('/').at(-1);
const domen = pageUrl.split('/')[2];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  // перехватчик запросов
  page.on('request', (request) => {
    if (request.url().includes(titleCategory)) {
      request.continue();
    } else {
      request.continue();
    }
  });

  // перехватчик ответов
  page.on('response', async (response) => {
    const url = response.url();

    if (url.includes('/catalog')) {

      const contentType = response.headers()['content-type'];
      const status = response.status();

      if (contentType.includes('text/html') && status === 200) {
        const html = await response.text();
        const dom = new JSDOM(html);
        const document1 = dom.window.document;

        // получение данных из скрипта
        const data = await new Promise((resolve) => {
          const scriptElement = document1.getElementById('__NEXT_DATA__');
          if (scriptElement && scriptElement.textContent) {
            try {
              const jsonData = JSON.parse(scriptElement.textContent);
              resolve(jsonData);
            } catch (error) {
              console.error('Ошибка парсинга JSON:', error);
              resolve(null);
            }
          } else {
            console.log('Элемент __NEXT_DATA__ не найден');
            resolve(null);
          }
        });

        if (data) {
          const products = data.props?.pageProps?.initialStore?.catalogPage?.products;
          let fileContent = '';
          products.forEach(prod => {
            fileContent += `Название товара: ${prod.name}
Ссылка на страницу товара: ${'https://' + domen + prod.url}
Рейтинг: ${prod.rating}
Количество отзывов: ${prod.reviews}
Цена: ${prod.price}
${prod.unitPrice ? 'Акционная цена: ' + prod.unitPrice + '\n' : ''}${prod.oldPrice ? 'Цена до акции: ' + prod.oldPrice + '\n' : ''}${prod.discount ? 'Размер скидки: ' + prod.discount + '\n' : ''}
`
          });
          await fs.writeFile('products-api.txt', fileContent, 'utf8');
          console.log('Данные успешно сохранены в products-api.txt')
        }
      }
    }
  });

  try {
    console.log('Переходим на страницу...');
    await page.goto('https://www.vprok.ru/catalog/7382/pomidory-i-ovoschnye-nabory', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    console.log('Ожидаем загрузки данных...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await browser.close();
  }
})();