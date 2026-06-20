const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'frontend', 'screenshots');

// Ensure screenshots folder exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 1x1 green PNG base64 representation
const DUMMY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const tempImagePath = path.join(__dirname, 'temp_bike_evidence.png');
fs.writeFileSync(tempImagePath, Buffer.from(DUMMY_PNG_BASE64, 'base64'));

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // standard iPhone screen size
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  // Inject some CSS to disable transition animations so screenshots don't show half-rendered elements
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = `
        * {
          transition: none !important;
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  try {
    console.log('Navigating to local EcoRise server...');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);

    // 1. Onboarding Hero
    console.log('Capturing Onboarding Hero...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_onboarding_hero.png') });

    // 2. Carousel step 1
    console.log('Capturing Onboarding Carousel Step 1...');
    await page.click('text=Start AI audit');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_onboarding_step1.png') });

    // 3. Carousel step 2
    console.log('Capturing Onboarding Carousel Step 2...');
    await page.click('text=Next');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_onboarding_step2.png') });

    // 4. Carousel step 3
    console.log('Capturing Onboarding Carousel Step 3...');
    await page.click('text=Next');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_onboarding_step3.png') });

    // 5. Signup Screen
    console.log('Capturing Signup page...');
    await page.click('text=Open coach');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_signup.png') });

    // 6. Login Screen
    console.log('Capturing Login page...');
    await page.click('text=Log in');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_login.png') });

    // 7. Perform login
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'demo@ecorise.app');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    
    // Wait for the main page to load
    await page.waitForTimeout(2000);
    console.log('Capturing Learning page (AI Coach)...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_learning_coach.png') });

    // 8. Research Library Tab
    console.log('Capturing Learning page (Research Library)...');
    await page.click('text=Research Library');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_learning_research.png') });

    // 9. Home page (combined Leaderboard & Quests)
    console.log('Capturing Home page (Combined Board & Quests)...');
    await page.click('aria-label=Home');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_home.png') });

    // 10. Feed page
    console.log('Capturing Feed page...');
    await page.click('aria-label=Feed');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_feed.png') });

    // 11. Profile page
    console.log('Capturing Profile page...');
    await page.click('aria-label=Profile');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_profile.png') });

    // 12. Privacy Center
    console.log('Capturing Privacy & Data Center...');
    await page.click('aria-label=Privacy & data');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_privacy_center.png') });

    // Go back to Profile
    await page.click('aria-label=Back');
    await page.waitForTimeout(300);

    // 13. Organizer Settings
    console.log('Capturing Organizer (Settings)...');
    await page.click('text=Create a leaderboard');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_organizer_settings.png') });

    // 14. Organizer Moderation
    console.log('Capturing Organizer (Moderation)...');
    await page.click('text=Reports');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_organizer_reports.png') });

    // Go back to Home
    await page.click('aria-label=Back');
    await page.waitForTimeout(300);

    // 15. Log Action Modal (FAB button)
    console.log('Capturing Log Action Modal...');
    await page.click('aria-label=Log an eco action');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_modal_log_action.png') });

    // Try uploading a photo to see the evidence panel flow
    console.log('Uploading photo for verification...');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Add a photo to log your action');
    await page.click('text=Photo Library');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempImagePath);
    
    // Wait for mock Vision analysis to complete
    console.log('Waiting for Vision analysis...');
    await page.waitForTimeout(2000);
    
    // Capturing modal with verification preview
    console.log('Capturing Log Action Modal with verification preview...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_modal_log_preview.png') });

    // Click submit/post button to trigger the Evidence Panel
    console.log('Submitting verification...');
    await page.click('text=Post & earn points');
    await page.waitForTimeout(2000);
    
    // Capturing AI Evidence Panel
    console.log('Capturing AI Evidence Panel...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_ai_evidence_panel.png') });

    // Close Evidence Panel
    await page.click('aria-label=Close');
    await page.waitForTimeout(300);

    // 16. Trash Spotter Modal (from Home quick action)
    console.log('Capturing Trash Spotter Modal...');
    await page.click('text=Trash Spotter');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_modal_trash_spotter.png') });

    // Upload photo for trash verification
    console.log('Uploading photo for trash verification...');
    const fileChooserPromise2 = page.waitForEvent('filechooser');
    await page.click('text=Photograph the litter or hotspot');
    await page.click('text=Photo Library');
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles(tempImagePath);
    await page.waitForTimeout(1000);
    
    console.log('Capturing Trash Spotter Modal preview...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_modal_trash_preview.png') });

    // Click submit/report button to trigger the Trash Evidence Panel
    console.log('Submitting trash report...');
    await page.fill('input[placeholder*="Riverside Park"]', 'Test School Grounds');
    await page.click('text=Submit report');
    await page.waitForTimeout(2000);

    // Capturing Trash Evidence Panel
    console.log('Capturing Trash Evidence Panel...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_trash_evidence_panel.png') });

    // Close Trash Evidence Panel
    await page.click('aria-label=Close');
    await page.waitForTimeout(300);

  } catch (err) {
    console.error('An error occurred during screenshotting:', err);
  } finally {
    await browser.close();
    // Cleanup temp image file
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    console.log('Done!');
  }
}

run();
