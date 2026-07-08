import pytest
from mobile.appium.utils.driver_factory import create_driver
from mobile.appium.pages.wallet_page import WalletPage


@pytest.fixture(scope='function')
def driver():
    drv = create_driver('android')
    yield drv
    drv.quit()


@pytest.fixture
def wallet(driver):
    return WalletPage(driver)


class TestCarteiraAndroid:

    def test_deposito_valido_atualiza_saldo(self, wallet):
        saldo_antes = wallet.get_balance()
        wallet.deposit(100)
        assert 'sucesso' in wallet.get_success_message().lower()
        assert wallet.get_balance() == saldo_antes + 100

    def test_saque_valido_debita_saldo(self, wallet):
        wallet.deposit(200)
        saldo_antes = wallet.get_balance()
        wallet.withdraw(50)
        assert 'sucesso' in wallet.get_success_message().lower()
        assert wallet.get_balance() == saldo_antes - 50

    def test_saque_maior_que_saldo_exibe_erro(self, wallet):
        saldo = wallet.get_balance()
        wallet.withdraw(saldo + 9999)
        assert 'insuficiente' in wallet.get_error_message().lower()

    def test_botao_saque_desabilitado_com_saldo_zero(self, driver):
        # Simula saldo zerado via deep link ou estado inicial do app
        driver.execute_script('mobile: deepLink', {'url': 'igaming://wallet?balance=0', 'package': 'com.igaming.app'})
        wallet = WalletPage(driver)
        assert not wallet.is_withdraw_button_enabled()

    def test_deposito_duplo_nao_duplica_transacao(self, wallet):
        saldo_antes = wallet.get_balance()
        # Toca duas vezes no botão deposit rapidamente
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from appium.webdriver.common.appiumby import AppiumBy

        input_el = driver.find_element(*WalletPage.INPUT_DEPOSIT)
        input_el.send_keys('100')
        btn = driver.find_element(*WalletPage.BTN_DEPOSIT)
        btn.click()
        btn.click()
        driver.find_element(*WalletPage.BTN_CONFIRM).click()
        assert wallet.get_balance() == saldo_antes + 100
