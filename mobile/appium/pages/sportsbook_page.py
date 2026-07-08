from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class SportsbookPage:
    SEARCH_EVENT = (AppiumBy.ACCESSIBILITY_ID, 'search-event')
    EVENT_CARD = (AppiumBy.ACCESSIBILITY_ID, 'event-card')
    ODD_VALUE = (AppiumBy.ACCESSIBILITY_ID, 'odd-value')
    BET_AMOUNT = (AppiumBy.ACCESSIBILITY_ID, 'bet-amount')
    BTN_PLACE_BET = (AppiumBy.ACCESSIBILITY_ID, 'btn-place-bet')
    BTN_CANCEL = (AppiumBy.ACCESSIBILITY_ID, 'btn-cancel-bet')
    POTENTIAL_WIN = (AppiumBy.ACCESSIBILITY_ID, 'potential-win')
    ODD_CHANGE_ALERT = (AppiumBy.ACCESSIBILITY_ID, 'odd-change-alert')
    SUCCESS_MSG = (AppiumBy.ACCESSIBILITY_ID, 'success-message')
    ERROR_MSG = (AppiumBy.ACCESSIBILITY_ID, 'error-message')

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 15)

    def search_event(self, event_name):
        field = self.wait.until(EC.element_to_be_clickable(self.SEARCH_EVENT))
        field.clear()
        field.send_keys(event_name)

    def select_first_event(self):
        self.wait.until(EC.presence_of_element_located(self.EVENT_CARD))
        self.driver.find_elements(*self.EVENT_CARD)[0].click()

    def place_bet(self, event_name, amount):
        self.search_event(event_name)
        self.select_first_event()
        bet_field = self.wait.until(EC.element_to_be_clickable(self.BET_AMOUNT))
        bet_field.clear()
        bet_field.send_keys(str(amount))
        self.driver.find_element(*self.BTN_PLACE_BET).click()

    def cancel_bet(self):
        self.driver.find_element(*self.BTN_CANCEL).click()

    def get_potential_win(self):
        return self.driver.find_element(*self.POTENTIAL_WIN).text

    def is_odd_change_alert_visible(self):
        try:
            return self.driver.find_element(*self.ODD_CHANGE_ALERT).is_displayed()
        except Exception:
            return False
