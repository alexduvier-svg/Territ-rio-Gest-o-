package br.com.territorio.gestao;

import java.security.SecureRandom;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

/** Inner password envelope; the Android-authenticated Keystore envelope is applied separately. */
final class PixPasswordCrypto {
    static final int ITERATIONS = 210000;
    static byte[] random(int size) { byte[] value = new byte[size]; new SecureRandom().nextBytes(value); return value; }
    static SecretKey derive(char[] password, byte[] salt, String algorithm) throws Exception {
        if (!algorithm.equals("PBKDF2WithHmacSHA256") && !algorithm.equals("PBKDF2WithHmacSHA1")) throw new IllegalArgumentException("KDF inválida");
        PBEKeySpec spec = new PBEKeySpec(password, salt, ITERATIONS, 256);
        byte[] key = null;
        try { key = SecretKeyFactory.getInstance(algorithm).generateSecret(spec).getEncoded(); return new SecretKeySpec(key, "AES"); }
        finally { spec.clearPassword(); if (key != null) Arrays.fill(key, (byte) 0); }
    }
    static byte[] seal(byte[] value, char[] password, byte[] salt, byte[] iv, byte[] aad, String algorithm) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, derive(password, salt, algorithm), new GCMParameterSpec(128, iv));
        cipher.updateAAD(aad); return cipher.doFinal(value);
    }
    static byte[] open(byte[] value, char[] password, byte[] salt, byte[] iv, byte[] aad, String algorithm) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, derive(password, salt, algorithm), new GCMParameterSpec(128, iv));
        cipher.updateAAD(aad); return cipher.doFinal(value);
    }
}
