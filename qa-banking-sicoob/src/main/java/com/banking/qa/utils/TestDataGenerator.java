package com.banking.qa.utils;

import com.github.javafaker.Faker;

import java.util.Locale;

public class TestDataGenerator {

    private static final Faker faker = new Faker(new Locale("pt-BR"));

    public static String firstName()   { return faker.name().firstName(); }
    public static String lastName()    { return faker.name().lastName(); }
    public static String address()     { return faker.address().streetAddress(); }
    public static String city()        { return faker.address().city(); }
    public static String state()       { return faker.address().stateAbbr(); }
    public static String zipCode()     { return faker.numerify("#####"); }
    public static String phone()       { return faker.numerify("###-###-####"); }
    public static String ssn()         { return faker.numerify("###-##-####"); }

    /** Gera username único com sufixo numérico para evitar colisão no Parabank */
    public static String username() {
        return faker.name().firstName().toLowerCase().replaceAll("[^a-z]", "")
            + faker.numerify("###");
    }

    public static String password() { return "Test@" + faker.numerify("####"); }

    /** Retorna um valor monetário entre min e max como string "NNN.NN" */
    public static String amount(double min, double max) {
        double v = min + Math.random() * (max - min);
        return String.format("%.2f", v);
    }
}
