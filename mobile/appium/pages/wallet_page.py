from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class WalletPage:
    # Locators Android (UiAutomator2)
    BALANCE = (AppiumBy.ACCESSIBILITY_ID, 'wallet-balance')
    INPUT_DEPOSIT = (AppiumBy.ACCESSIBILITY_ID, 'input-deposit')
    INPUT_WITHDRAW = (AppiumBy.ACCESSIBILITY_ID, 'input-withdraw')
    BTN_DEPOSIT = (AppiumBy.ACCESSIBILITY_ID, 'btn-deposit')
    BTN_WITHDRAW = (AppiumBy.ACCESSIBILITY_ID, 'btn-withdraw')
    BTN_CONFIRM = (AppiumBy.ACCESSIBILITY_ID, 'btn-confirm')
    SUCCESS_MSG = (AppiumBy.ACCESSIBILITY_ID, 'success-message')
    ERROR_MSG = (AppiumBy.ACCESSIBILITY_ID, 'error-message')

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 15)

    def get_balance(self):
        el = self.wait.until(EC.presence_of_element_located(self.BALANCE))
        text = el.text.replace('R$', '').replace('.', '').replace(',', '.').strip()
        return float(text)

    def deposit(self, amount):
        self.wait.until(EC.element_to_be_clickable(self.INPUT_DEPOSIT)).clear()
        self.driver.find_element(*self.INPUT_DEPOSIT).send_keys(str(amount))
        self.driver.find_element(*self.BTN_DEPOSIT).click()
        self.wait.until(EC.element_to_be_clickable(self.BTN_CONFIRM)).click()

    def withdraw(self, amount):
        self.wait.until(EC.element_to_be_clickable(self.INPUT_WITHDRAW)).clear()
        self.driver.find_element(*self.INPUT_WITHDRAW).send_keys(str(amount))
        self.driver.find_element(*self.BTN_WITHDRAW).click()
        self.wait.until(EC.element_to_be_clickable(self.BTN_CONFIRM)).click()

    def get_success_message(self):
        return self.wait.until(EC.presence_of_element_located(self.SUCCESS_MSG)).text

    def get_error_message(self):
        return self.wait.until(EC.presence_of_element_located(self.ERROR_MSG)).text

    def is_withdraw_button_enabled(self):
        return self.driver.find_element(*self.BTN_WITHDRAW).is_enabled()
