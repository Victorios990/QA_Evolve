*** Variables ***
${APPIUM_URL}       http://localhost:4723
${ANDROID_DEVICE}   emulator-5554
${APK_PATH}         ${CURDIR}/../../apps/igaming.apk
${IOS_DEVICE}       iPhone 14
${IOS_VERSION}      16.0
${IPA_PATH}         ${CURDIR}/../../apps/igaming.ipa

${USER_TENANT_A}    player_tenant_a
${PASS_TENANT_A}    Test@1234
${USER_TENANT_B}    player_tenant_b
${PASS_TENANT_B}    Test@1234

${DEPOSITO_VALIDO}      100
${SAQUE_VALIDO}         50
${VALOR_APOSTA}         50
${SALDO_INSUFICIENTE}   999999

${MSG_DEPOSITO_OK}      Depósito realizado com sucesso
${MSG_SAQUE_OK}         Saque realizado com sucesso
${MSG_APOSTA_OK}        Aposta registrada com sucesso
${MSG_SALDO_INSUF}      Saldo insuficiente
