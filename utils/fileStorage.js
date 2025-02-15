const puppeteer = require('puppeteer'); // instead of puppeteer-core


(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', // Adjust this path
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent('<h1>Hello, PDF!</h1>', { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    await browser.close();
    require('fs').writeFileSync('test.pdf', pdfBuffer);
    console.log('PDF created successfully.');
  } catch (error) {
    console.error('Puppeteer test error:', error);
  }
})();
