import pytest
from mobile.appium.utils.driver_factory import create_driver
from mobile.appium.pages.wallet_page import WalletPage


@pytest.fixture(scope='function')
def driver():
    drv = create_driver('ios')
    yield drv
    drv.quit()


@pytest.fixture
def wallet(driver):
    return WalletPage(driver)


class TestCarteiraIOS:

    def test_deposito_valido_atualiza_saldo_ios(self, wallet):
        saldo_antes = wallet.get_balance()
        wallet.deposit(100)
        assert 'sucesso' in wallet.get_success_message().lower()
        assert wallet.get_balance() == saldo_antes + 100

    def test_saque_valido_debita_saldo_ios(self, wallet):
        wallet.deposit(200)
        saldo_antes = wallet.get_balance()
        wallet.withdraw(50)
        assert wallet.get_balance() == saldo_antes - 50

    def test_teclado_numerico_exibido_no_input_valor(self, driver):
        wallet = WalletPage(driver)
        from appium.webdriver.common.appiumby import AppiumBy
        input_el = driver.find_element(*WalletPage.INPUT_DEPOSIT)
        input_el.click()
        keyboard_type = driver.execute_script('mobile: activeAppInfo')
        # Verifica se o teclado numérico está ativo (XCUITest)
        assert input_el.get_attribute('keyboardType') in ['NumberPad', 'DecimalPad', None]

    def test_swipe_para_acessar_historico(self, driver):
        from appium.webdriver.common.touch_action import TouchAction
        action = TouchAction(driver)
        size = driver.get_window_size()
        action.press(x=size['width'] * 0.8, y=size['height'] * 0.5)\
              .move_to(x=size['width'] * 0.2, y=size['height'] * 0.5)\
              .release().perform()
        # Após swipe, verifica se a tela de histórico foi aberta
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from appium.webdriver.common.appiumby import AppiumBy
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((AppiumBy.ACCESSIBILITY_ID, 'transaction-table'))
        )
