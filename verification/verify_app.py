from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # Wait for "Creation Interface" to be visible
        print("Waiting for sidebar...")
        page.wait_for_selector("text=Creation Interface")

        # Click "+ New Project"
        print("Clicking New Project...")
        page.click("button.new-project-btn")

        # Fill in project details
        print("Filling form...")
        page.fill("input[placeholder='e.g., Analysis of Q2 Economic Trends']", "Playwright Verification Project")
        page.click("button[type='submit']")

        # Wait for project to be created and selected
        print("Waiting for project workspace...")
        page.wait_for_selector("h2:has-text('Playwright Verification Project')")

        # Update Source Context
        print("Updating source context...")
        page.fill("textarea[placeholder='Paste your source material here...']", "This is a test context for Playwright.")
        # Trigger blur to save
        page.click("h2:has-text('Playwright Verification Project')")

        # Click Generate
        print("Clicking Generate...")
        page.click("button.generate-btn")

        # Wait for generated content (mock generation takes 2 seconds)
        print("Waiting for generation...")
        page.wait_for_selector("textarea:has-text('# Executive Summary')", timeout=10000)

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/verification.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    verify_app()
