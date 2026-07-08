import os
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.options.ios import XCUITestOptions


def create_android_driver():
    options = UiAutomator2Options()
    options.platform_name = 'Android'
    options.device_name = os.getenv('ANDROID_DEVICE', 'emulator-5554')
    options.app = os.getenv('APK_PATH', './apps/igaming.apk')
    options.automation_name = 'UiAutomator2'
    options.no_reset = False
    options.full_reset = False
    options.new_command_timeout = 60

    return webdriver.Remote(
        command_executor=os.getenv('APPIUM_URL', 'http://localhost:4723'),
        options=options,
    )


def create_ios_driver():
    options = XCUITestOptions()
    options.platform_name = 'iOS'
    options.device_name = os.getenv('IOS_DEVICE', 'iPhone 14')
    options.platform_version = os.getenv('IOS_VERSION', '16.0')
    options.app = os.getenv('IPA_PATH', './apps/igaming.ipa')
    options.automation_name = 'XCUITest'
    options.no_reset = False
    options.new_command_timeout = 60

    return webdriver.Remote(
        command_executor=os.getenv('APPIUM_URL', 'http://localhost:4723'),
        options=options,
    )


def create_driver(platform='android'):
    if platform.lower() == 'ios':
        return create_ios_driver()
    return create_android_driver()
