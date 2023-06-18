const app = require("express")();
let chrome = {};
let puppeteer;
if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

const { URL: URLParser } = require('url');
app.get("/api/postid", async (req, res) => {
  const { url } = req.query;

  // Validate URL
  try {
    new URLParser(url);
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);
    let page = await browser.newPage();

    await page.goto(url);
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);
    const pattern = /subscription_target_id":"([0-9]+)"/;

    const match = data.match(pattern);
    if (match) {
      const targetId = match[1];
      console.log(targetId);
      res.status(200).json({code:200, message: targetId });
    }else{
      res.status(400).json({code:400, error: 'Id not Found.' });
    }
    
  } catch (err) {
    console.error(err);
    res.status(400).json({code:200, error: err.message });
  }
});


app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
